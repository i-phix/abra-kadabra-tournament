export default async function handler(req, res) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path;
  const url = `https://api.football-data.org/v4/${apiPath}`;
  const key = process.env.API_FOOTBALL_KEY;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": key || "",
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    // Return full debug info
    res.status(200).json({
      status: response.status,
      keyPresent: !!key,
      keyPreview: key ? key.slice(0, 8) : "MISSING",
      url,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
