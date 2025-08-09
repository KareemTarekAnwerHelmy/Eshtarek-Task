export default function Dashboard() {
  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Dashboard</h1>
        <div className="row" style={{marginTop: 8}}>
          <a className="badge" href="/plans">View Plans</a>
          <a className="badge" href="/subscriptions">Your Subscriptions</a>
          <a className="badge" href="/invoices">Invoices</a>
        </div>
      </div>
    </div>
  )
}