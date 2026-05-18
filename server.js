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

  // Proxy route for Railradar API
  app.use("/api/railradar", async (req, res) => {
    const apiKey = process.env.VITE_RAILRADAR_API_KEY || process.env.RAILRADAR_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Railradar API key is missing" });
    }

    // Construct the target URL for Railradar API
    // Railradar API base URL
    const baseUrl = 'https://api.railradar.com';
    
    // Map the old RapidAPI endpoints to Railradar endpoints
    let endpoint = req.url;
    let targetUrl = '';
    
    // Parse query parameters
    const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
    
    // Map endpoints based on the path
    if (endpoint.startsWith('/searchTrain')) {
      const query = urlParams.get('query');
      targetUrl = `${baseUrl}/trains/search?q=${encodeURIComponent(query || '')}`;
    } else if (endpoint.startsWith('/getTrainLiveStatus')) {
      const trainNo = urlParams.get('trainNo');
      targetUrl = `${baseUrl}/trains/${trainNo}/live-status`;
    } else if (endpoint.startsWith('/getSeatAvailability')) {
      const trainNo = urlParams.get('trainNo');
      const fromStationCode = urlParams.get('fromStationCode');
      const toStationCode = urlParams.get('toStationCode');
      const date = urlParams.get('date');
      const classCode = urlParams.get('classCode') || '3A';
      targetUrl = `${baseUrl}/trains/${trainNo}/availability?from=${fromStationCode}&to=${toStationCode}&date=${date}&class=${classCode}`;
    } else if (endpoint.startsWith('/getTrainBetweenStations')) {
      const fromStationCode = urlParams.get('fromStationCode');
      const toStationCode = urlParams.get('toStationCode');
      const date = urlParams.get('dateOfJourney');
      targetUrl = `${baseUrl}/trains/between-stations?from=${fromStationCode}&to=${toStationCode}&date=${date}`;
    } else if (endpoint.startsWith('/getPNRStatus')) {
      const pnrNumber = urlParams.get('pnrNumber');
      targetUrl = `${baseUrl}/pnr/${pnrNumber}`;
    } else {
      return res.status(404).json({ error: "Endpoint not found" });
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Railradar API error:", error);
      res.status(500).json({ error: "Failed to fetch from Railradar API" });
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
