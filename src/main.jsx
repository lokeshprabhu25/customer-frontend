import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const USER_API = "http://3.26.78.110:8001";
const ORDER_API = "http://3.26.78.110:8002";

function App() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "rajesh", password: "1234" });
  const [order, setOrder] = useState({ product: "Mobile Phone", quantity: 1, amount: 25000 });
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("Checking services...");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkServices();
  }, []);

  async function checkServices() {
    try {
      const [u, o] = await Promise.all([
        fetch(`${USER_API}/health`),
        fetch(`${ORDER_API}/health`)
      ]);
      setStatus(`🟢 User Service: ${u.ok ? "UP" : "DOWN"} | 🟢 Order Service: ${o.ok ? "UP" : "DOWN"}`);
    } catch {
      setStatus("🔴 Backend service unavailable");
    }
  }

  async function login(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${USER_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed");

      setUser(data.user);
      setMessage(`Welcome ${data.user.name}! Login successful.`);
      loadOrders(data.user.id);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  }

  async function createOrder(e) {
    e.preventDefault();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    try {
      const response = await fetch(`${ORDER_API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          ...order,
          quantity: Number(order.quantity),
          amount: Number(order.amount)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Order failed");

      setMessage(`✅ Order #${data.order.id} created. Order Service validated you through User Service.`);
      loadOrders(user.id);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  }

  async function loadOrders(userId) {
    try {
      const response = await fetch(`${ORDER_API}/orders/user/${userId}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>ShopFlow</h1>
        <span>Customer React Frontend</span>
      </header>

      <main>
        <div className="status">{status}</div>

        <div className="grid">
          <section className="card">
            <h2>Customer Login</h2>
            <p className="hint">Demo: rajesh / 1234</p>

            <form onSubmit={login}>
              <input
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="Username"
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="Password"
              />
              <button>Login</button>
            </form>

            {user && <p className="success">Logged in: {user.name} (ID: {user.id})</p>}
          </section>

          <section className="card">
            <h2>Create Order</h2>

            <form onSubmit={createOrder}>
              <input
                value={order.product}
                onChange={e => setOrder({...order, product: e.target.value})}
                placeholder="Product"
              />
              <input
                type="number"
                min="1"
                value={order.quantity}
                onChange={e => setOrder({...order, quantity: e.target.value})}
              />
              <input
                type="number"
                min="1"
                value={order.amount}
                onChange={e => setOrder({...order, amount: e.target.value})}
              />
              <button>Place Order</button>
            </form>
          </section>
        </div>

        {message && <div className="message">{message}</div>}

        <section className="card">
          <div className="titleRow">
            <h2>My Orders</h2>
            {user && <button className="secondary" onClick={() => loadOrders(user.id)}>Refresh</button>}
          </div>

          {!user ? (
            <p className="hint">Login to see your orders.</p>
          ) : orders.length === 0 ? (
            <p className="hint">No orders yet.</p>
          ) : (
            orders.map(o => (
              <div className="order" key={o.id}>
                <b>Order #{o.id}</b> — {o.product}<br />
                Quantity: {o.quantity} | ₹{o.amount} | <span className="success">{o.status}</span>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
