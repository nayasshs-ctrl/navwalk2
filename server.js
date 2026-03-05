
const express = require("express");
const https = require("https");
const path = require("path");

const app = express();

// Read API keys from environment variables (safer for deployment)
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "naver-walk-nav.html"));
});

// Naver Directions API proxy
app.get("/api/directions", (req, res) => {
  const { start, goal } = req.query;

  if (!start || !goal) {
    return res.status(400).json({ error: "start and goal parameters are required." });
  }

  const options = {
    hostname: "maps.apigw.ntruss.com",
    path: `/map-direction/v1/driving?start=${encodeURIComponent(start)}&goal=${encodeURIComponent(goal)}&option=pedestrian`,
    method: "GET",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
      "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";

    proxyRes.on("data", chunk => {
      data += chunk;
    });

    proxyRes.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on("error", err => {
    console.error("Directions API error:", err);
    res.status(500).json({ error: "Directions API server error" });
  });

  proxyReq.end();
});

// Use Render's provided port or default to 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("NavWalk server running on port", PORT);
});
