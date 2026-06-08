import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Express 5 wildcard syntax: {*path}
app.get("/api/football/{*path}", async (req, res) => {
  const authToken = req.headers["x-auth-token"];
  if (!authToken)
    return res.status(401).json({ error: "Missing X-Auth-Token header" });

  const subPath = Array.isArray(req.params.path)
    ? req.params.path.join("/")
    : req.params.path || "";
  const query = new URLSearchParams(req.query).toString();
  const url = `https://api.football-data.org/v4/${subPath}${query ? `?${query}` : ""}`;

  console.log(`[proxy] GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: { "X-Auth-Token": authToken },
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message };
    console.error(`[proxy] ${status}:`, JSON.stringify(data));
    res.status(status).json(data);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
