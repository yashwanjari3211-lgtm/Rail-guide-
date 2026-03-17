import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy route for RapidAPI
  app.use("/api/rapidapi", async (req, res) => {
    const apiKey = process.env.VITE_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
    const apiHost = process.env.VITE_RAPIDAPI_HOST || process.env.RAPIDAPI_HOST || 'irctc1.p.rapidapi.com';
    
    if (!apiKey) {
      return res.status(500).json({ error: "API key is missing" });
    }

    // Construct the target URL
    // req.url contains the path after the mount point, e.g., /searchTrain?query=12290
    const targetUrl = `https://${apiHost}/api/v1${req.url}`;

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': apiHost,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from RapidAPI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
