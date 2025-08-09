from django.db import migrations, connection


def enable_rls_accounts(apps, schema_editor):
    # Only run on PostgreSQL
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE accounts_userprofile ENABLE ROW LEVEL SECURITY;")
        cursor.execute(
            """
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'accounts_userprofile' AND policyname = 'userprofile_isolation') THEN
                EXECUTE 'DROP POLICY userprofile_isolation ON accounts_userprofile';
              END IF;
              IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'accounts_userprofile' AND policyname = 'userprofile_insert_policy') THEN
                EXECUTE 'DROP POLICY userprofile_insert_policy ON accounts_userprofile';
              END IF;
            END $$;
            """
        )
        cursor.execute(
            """
            CREATE POLICY userprofile_isolation ON accounts_userprofile
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
            CREATE POLICY userprofile_insert_policy ON accounts_userprofile
            FOR INSERT TO PUBLIC
            WITH CHECK (
              current_setting('app.admin', true) = 'true'
              OR tenant_id = current_setting('app.tenant_id', true)::uuid
            );
            """
        )


def disable_rls_accounts(apps, schema_editor):
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cursor:
        cursor.execute("DROP POLICY IF EXISTS userprofile_isolation ON accounts_userprofile;")
        cursor.execute("DROP POLICY IF EXISTS userprofile_insert_policy ON accounts_userprofile;")
        cursor.execute("ALTER TABLE accounts_userprofile DISABLE ROW LEVEL SECURITY;")


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(enable_rls_accounts, disable_rls_accounts),
    ]
