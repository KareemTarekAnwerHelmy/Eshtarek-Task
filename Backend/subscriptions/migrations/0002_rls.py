from django.db import migrations, connection


def enable_rls_subscriptions(apps, schema_editor):
    # Only run on PostgreSQL
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE subscriptions_subscription ENABLE ROW LEVEL SECURITY;")
        cursor.execute(
            """
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'subscriptions_subscription' AND policyname = 'subscription_isolation') THEN
                EXECUTE 'DROP POLICY subscription_isolation ON subscriptions_subscription';
              END IF;
              IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'subscriptions_subscription' AND policyname = 'subscription_insert_policy') THEN
                EXECUTE 'DROP POLICY subscription_insert_policy ON subscriptions_subscription';
              END IF;
            END $$;
            """
        )
        cursor.execute(
            """
            CREATE POLICY subscription_isolation ON subscriptions_subscription
            USING (
              current_setting('app.admin', true) = 'true'
              OR tenant_id = current_setting('app.tenant_id', true)::uuid
            )
            WITH CHECK (
              current_setting('app.admin', true) = 'true'
              OR tenant_id = current_setting('app.tenant_id', true)::uuid
            );
            """
        )
        cursor.execute(
            """
            CREATE POLICY subscription_insert_policy ON subscriptions_subscription
            FOR INSERT TO PUBLIC
            WITH CHECK (
              current_setting('app.admin', true) = 'true'
              OR tenant_id = current_setting('app.tenant_id', true)::uuid
            );
            """
        )


def disable_rls_subscriptions(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cursor:
        cursor.execute("DROP POLICY IF EXISTS subscription_isolation ON subscriptions_subscription;")
        cursor.execute("DROP POLICY IF EXISTS subscription_insert_policy ON subscriptions_subscription;")
        cursor.execute("ALTER TABLE subscriptions_subscription DISABLE ROW LEVEL SECURITY;")


class Migration(migrations.Migration):
    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(enable_rls_subscriptions, disable_rls_subscriptions),
    ]
