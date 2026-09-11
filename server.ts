import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to get Ollama URL from request header or default to localhost:11434
function getOllamaBaseUrl(req: express.Request): string {
  const customUrl = req.headers["x-ollama-url"] as string;
  return customUrl || "http://localhost:11434";
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Proxy GET /api/ollama/tags (List models)
app.get("/api/ollama/tags", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return res.json({ models: [], connected: false, error: errorText || "Failed to fetch models from Ollama" });
    }
    const data = await response.json();
    res.json({ models: data.models || [], connected: true });
  } catch (error: any) {
    // Graceful fallback when Ollama is offline or unreachable
    res.json({
      models: [],
      connected: false,
      error: `Could not connect to Ollama at ${baseUrl}. Ensure Ollama is running ('ollama serve') and accessible. If in Docker or WSL, try http://host.docker.internal:11434.`,
      details: error.message
    });
  }
});

// Proxy POST /api/ollama/chat (Chat completion with streaming support)
app.post("/api/ollama/chat", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  const { model, messages, options, stream = true, system } = req.body;

  try {
    const payload: any = {
      model: model || "llama3",
      messages: messages || [],
      options: options || {},
      stream: !!stream,
    };
    if (system) {
      payload.system = system;
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || "Ollama chat error" });
    }

    if (stream && response.body) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamError: any) {
        // Stream aborted or closed
      } finally {
        res.end();
      }
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to communicate with Ollama" });
    }
  }
});

// Proxy POST /api/ollama/generate (Completion)
app.post("/api/ollama/generate", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy POST /api/ollama/show (Model details)
app.post("/api/ollama/show", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  try {
    const response = await fetch(`${baseUrl}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy POST /api/ollama/pull (Pull model)
app.post("/api/ollama/pull", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    res.setHeader("Content-Type", "text/event-stream");
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    }
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy DELETE /api/ollama/delete (Delete model)
app.delete("/api/ollama/delete", async (req, res) => {
  const baseUrl = getOllamaBaseUrl(req);
  const { name } = req.body;
  try {
    const response = await fetch(`${baseUrl}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
