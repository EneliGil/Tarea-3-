const http = require("http");
const url = require("url");

const PORT = process.env.PORT || 3000;

let orders = [
  {
    id: 1,
    customer: "Valeria Méndez",
    product: "Latte de vainilla y croissant de mantequilla",
    quantity: 2,
    price: 420,
    notes: "Sin azúcar extra en el café",
    status: "En preparación"
  },
  {
    id: 2,
    customer: "Mateo Castillo",
    product: "Porción de bizcocho de chocolate y capuchino",
    quantity: 1,
    price: 550,
    notes: "Empaque para llevar",
    status: "Listo"
  },
  {
    id: 3,
    customer: "Sofía Herrera",
    product: "Cheesecake de fresa y espresso doble",
    quantity: 3,
    price: 1140,
    notes: "Incluir 3 servilletas y cucharitas",
    status: "Pendiente"
  }
];

let nextId = 4;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Café & Dulce — Pedidos de Cafetería y Repostería</title>
  <style>
    :root {
      --bg: #f6f3ee;
      --card: #ffffff;
      --ink: #231914;
      --muted: #6e5d53;
      --accent: #6b3e26;
      --accent-dark: #4d2b19;
      --soft: #efe7dc;
      --border: #e3d8c9;
      --pending-bg: #fff3cd;
      --pending-fg: #7a5200;
      --prep-bg: #e0f2fe;
      --prep-fg: #075985;
      --ready-bg: #dcfce7;
      --ready-fg: #166534;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--ink);
      padding: 24px 16px 48px;
    }
    .container { max-width: 980px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #4b2a18, #7a482d);
      color: #fff;
      padding: 24px 28px;
      border-radius: 16px;
      margin-bottom: 22px;
      box-shadow: 0 8px 24px rgba(35, 25, 20, 0.12);
    }
    header h1 { font-size: 1.65rem; margin-bottom: 6px; }
    header p { opacity: 0.9; font-size: 0.95rem; }
    .grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 20px; align-items: start; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 4px 14px rgba(35, 25, 20, 0.05);
    }
    .card h2 { font-size: 1.15rem; margin-bottom: 14px; color: var(--accent-dark); }
    .field { margin-bottom: 12px; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: var(--muted); }
    input, select, textarea {
      width: 100%;
      padding: 9px 11px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.92rem;
      font-family: inherit;
      background: #fff;
      color: var(--ink);
    }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    button {
      cursor: pointer;
      border: none;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 0.88rem;
      font-weight: 600;
      transition: transform 0.08s ease, opacity 0.15s ease;
    }
    button:active { transform: scale(0.98); }
    .btn-primary {
      width: 100%;
      background: var(--accent);
      color: #fff;
      padding: 11px 16px;
      font-size: 0.95rem;
    }
    .btn-primary:hover { background: var(--accent-dark); }
    .toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .toolbar input { flex: 1; min-width: 180px; }
    .toolbar select { width: auto; min-width: 150px; }
    .order-list { display: flex; flex-direction: column; gap: 12px; }
    .order-item {
      border: 1px solid var(--border);
      background: var(--soft);
      border-radius: 12px;
      padding: 14px;
    }
    .order-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .customer { font-weight: 700; font-size: 1rem; }
    .badge {
      font-size: 0.76rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .st-Pendiente { background: var(--pending-bg); color: var(--pending-fg); }
    .st-En\\ preparación { background: var(--prep-bg); color: var(--prep-fg); }
    .st-Listo { background: var(--ready-bg); color: var(--ready-fg); }
    .product { font-size: 0.94rem; margin-bottom: 4px; }
    .meta { font-size: 0.83rem; color: var(--muted); margin-bottom: 10px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-sm { padding: 6px 10px; font-size: 0.8rem; background: #fff; border: 1px solid var(--border); color: var(--ink); }
    .btn-del { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .empty { text-align: center; color: var(--muted); padding: 24px; font-size: 0.92rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Café & Dulce — Gestor de Pedidos</h1>
      <p>Control de órdenes de cafetería y repostería (crear, actualizar estado, filtrar y eliminar)</p>
    </header>

    <div class="grid">
      <section class="card">
        <h2>Nuevo pedido</h2>
        <form id="orderForm">
          <div class="field">
            <label for="customer">Cliente</label>
            <input id="customer" name="customer" placeholder="Ej. Camila Peña" required />
          </div>
          <div class="field">
            <label for="product">Producto de cafetería / repostería</label>
            <input id="product" name="product" placeholder="Ej. Brownie de nuez y cold brew" required />
          </div>
          <div class="row-2">
            <div class="field">
              <label for="quantity">Cantidad</label>
              <input id="quantity" name="quantity" type="number" min="1" value="1" required />
            </div>
            <div class="field">
              <label for="price">Total (RD$)</label>
              <input id="price" name="price" type="number" min="0" step="10" value="350" required />
            </div>
          </div>
          <div class="field">
            <label for="status">Estado inicial</label>
            <select id="status" name="status">
              <option value="Pendiente">Pendiente</option>
              <option value="En preparación">En preparación</option>
              <option value="Listo">Listo</option>
            </select>
          </div>
          <div class="field">
            <label for="notes">Notas del pedido</label>
            <textarea id="notes" name="notes" rows="2" placeholder="Ej. Sin hielo, mensaje en caja..."></textarea>
          </div>
          <button class="btn-primary" type="submit">Agregar pedido</button>
        </form>
      </section>

      <section class="card">
        <h2>Pedidos activos</h2>
        <div class="toolbar">
          <input id="searchInput" type="text" placeholder="Buscar por cliente o producto..." />
          <select id="statusFilter">
            <option value="ALL">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En preparación">En preparación</option>
            <option value="Listo">Listo</option>
          </select>
        </div>
        <div id="ordersContainer" class="order-list"></div>
      </section>
    </div>
  </div>

  <script>
    const ordersContainer = document.getElementById("ordersContainer");
    const orderForm = document.getElementById("orderForm");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    async function loadOrders() {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const q = searchInput.value.trim().toLowerCase();
      const st = statusFilter.value;

      const filtered = data.filter((o) => {
        const matchesStatus = st === "ALL" || o.status === st;
        const matchesQuery =
          !q ||
          o.customer.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      });

      if (!filtered.length) {
        ordersContainer.innerHTML = '<div class="empty">No hay pedidos que coincidan con el filtro.</div>';
        return;
      }

      ordersContainer.innerHTML = filtered
        .map((o) => {
          const badgeClass = "st-" + o.status.replace(/\\s+/g, "\\\\ ");
          return \`
            <div class="order-item">
              <div class="order-top">
                <span class="customer">#\${o.id} · \${escapeHtml(o.customer)}</span>
                <span class="badge \${badgeClass}">\${escapeHtml(o.status)}</span>
              </div>
              <div class="product">\${escapeHtml(o.product)} (x\${o.quantity})</div>
              <div class="meta">Total: RD$ \${Number(o.price).toLocaleString()}\${o.notes ? " · Nota: " + escapeHtml(o.notes) : ""}</div>
              <div class="actions">
                <button class="btn-sm" onclick="changeStatus(\${o.id}, 'En preparación')">En preparación</button>
                <button class="btn-sm" onclick="changeStatus(\${o.id}, 'Listo')">Marcar listo</button>
                <button class="btn-sm btn-del" onclick="deleteOrder(\${o.id})">Eliminar</button>
              </div>
            </div>
          \`;
        })
        .join("");
    }

    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        customer: document.getElementById("customer").value.trim(),
        product: document.getElementById("product").value.trim(),
        quantity: Number(document.getElementById("quantity").value) || 1,
        price: Number(document.getElementById("price").value) || 0,
        status: document.getElementById("status").value,
        notes: document.getElementById("notes").value.trim()
      };
      if (!payload.customer || !payload.product) return;

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      orderForm.reset();
      document.getElementById("quantity").value = "1";
      document.getElementById("price").value = "350";
      loadOrders();
    });

    async function changeStatus(id, status) {
      await fetch("/api/orders/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      loadOrders();
    }

    async function deleteOrder(id) {
      await fetch("/api/orders/" + id, { method: "DELETE" });
      loadOrders();
    }

    searchInput.addEventListener("input", loadOrders);
    statusFilter.addEventListener("change", loadOrders);
    loadOrders();
  </script>
</body>
</html>`;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML_PAGE);
    return;
  }

  if (pathname === "/api/orders" && req.method === "GET") {
    return sendJson(res, 200, orders);
  }

  if (pathname === "/api/orders" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      if (!body.customer || !body.product) {
        return sendJson(res, 400, { error: "customer y product son obligatorios" });
      }
      const newOrder = {
        id: nextId++,
        customer: String(body.customer).trim(),
        product: String(body.product).trim(),
        quantity: Math.max(1, Number(body.quantity) || 1),
        price: Math.max(0, Number(body.price) || 0),
        notes: String(body.notes || "").trim(),
        status: ["Pendiente", "En preparación", "Listo"].includes(body.status)
          ? body.status
          : "Pendiente"
      };
      orders.push(newOrder);
      return sendJson(res, 201, newOrder);
    } catch {
      return sendJson(res, 400, { error: "JSON inválido" });
    }
  }

  const matchId = pathname.match(/^\/api\/orders\/(\d+)$/);
  if (matchId) {
    const id = Number(matchId[1]);
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return sendJson(res, 404, { error: "Pedido no encontrado" });
    }

    if (req.method === "PUT") {
      try {
        const body = await parseBody(req);
        const current = orders[idx];
        orders[idx] = {
          ...current,
          customer: body.customer !== undefined ? String(body.customer).trim() : current.customer,
          product: body.product !== undefined ? String(body.product).trim() : current.product,
          quantity: body.quantity !== undefined ? Math.max(1, Number(body.quantity) || 1) : current.quantity,
          price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : current.price,
          notes: body.notes !== undefined ? String(body.notes).trim() : current.notes,
          status: ["Pendiente", "En preparación", "Listo"].includes(body.status)
            ? body.status
            : current.status
        };
        return sendJson(res, 200, orders[idx]);
      } catch {
        return sendJson(res, 400, { error: "JSON inválido" });
      }
    }

    if (req.method === "DELETE") {
      const [removed] = orders.splice(idx, 1);
      return sendJson(res, 200, { deleted: removed });
    }
  }

  sendJson(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => {
  console.log(\`Servidor de pedidos en http://localhost:\${PORT}\`);
});

// feature: create task
// feature: read tasks
// feature: update task
// feature: delete task
// hotfix: validate title
