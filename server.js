const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "tasks.json");

function loadTasks() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("JSON inválido"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  if (pathname === "/api/tasks" && method === "GET") {
    const tasks = loadTasks();
    return sendJson(res, 200, tasks);
  }

  const idMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (method === "GET") {
      if (index === -1) return sendJson(res, 404, { error: "Tarea no encontrada" });
      return sendJson(res, 200, tasks[index]);
    }

    if (method === "PUT") {
      if (index === -1) return sendJson(res, 404, { error: "Tarea no encontrada" });
      try {
        const data = await parseBody(req);
        if (data.title !== undefined && String(data.title).trim() === "") {
          return sendJson(res, 400, { error: "El título no puede estar vacío" });
        }
        tasks[index] = {
          ...tasks[index],
          title: data.title !== undefined ? String(data.title).trim() : tasks[index].title,
          completed: data.completed !== undefined ? Boolean(data.completed) : tasks[index].completed,
          updatedAt: new Date().toISOString()
        };
        saveTasks(tasks);
        return sendJson(res, 200, tasks[index]);
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (method === "DELETE") {
      if (index === -1) return sendJson(res, 404, { error: "Tarea no encontrada" });
      const deleted = tasks.splice(index, 1)[0];
      saveTasks(tasks);
      return sendJson(res, 200, { deleted });
    }
  }

  if (pathname === "/api/tasks" && method === "POST") {
    try {
      const data = await parseBody(req);
      if (!data.title || String(data.title).trim() === "") {
        return sendJson(res, 400, { error: "El campo 'title' es obligatorio" });
      }
      const tasks = loadTasks();
      const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
      const newTask = {
        id: nextId,
        title: String(data.title).trim(),
        completed: Boolean(data.completed),
        createdAt: new Date().toISOString()
      };
      tasks.push(newTask);
      saveTasks(tasks);
      return sendJson(res, 201, newTask);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  return sendJson(res, 404, { error: "Ruta no encontrada" });
});

server.listen(PORT, () => {
  console.log(`CRUD API escuchando en http://localhost:${PORT}/api/tasks`);
});
// feature: create task
// feature: read tasks
// feature: update task
// feature: delete task
