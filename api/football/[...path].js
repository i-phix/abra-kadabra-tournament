export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;

  const url = `https://api.football-data.org/v4/${apiPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": process.env.API_FOOTBALL_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || "Proxy error" });
  }
}
