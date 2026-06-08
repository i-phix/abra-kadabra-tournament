// api/football/[...path].js
export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;
  const url = `https://api.football-data.org/v4/${apiPath}${req.url.includes("?") ? "?" + req.url.split("?")[1] : ""}`;

  const token = req.headers["x-auth-token"];
  if (!token) {
    return res.status(401).json({ message: "No API key provided" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || "Proxy error" });
  }
}
