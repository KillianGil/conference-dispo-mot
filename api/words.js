import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- DELETE
    if (req.method === "DELETE") {
      await redis.del("words");
      return res
        .status(200)
        .json({ success: true, message: "All words deleted." });
    }

    // --- POST
    if (req.method === "POST") {
      const raw = await getRawBody(req);
      const { text, x, y, color } = JSON.parse(raw || "{}");

      if (!text || x === undefined || y === undefined || !color) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const wordData = {
        text,
        x: parseFloat(x),
        y: parseFloat(y),
        color,
        timestamp: Date.now(),
      };

      await redis.rpush("words", JSON.stringify(wordData));
      console.log("🟢 Ajout redis:", wordData);
      return res.status(201).json({ success: true });
    }

    // --- GET
    if (req.method === "GET") {
      const list = (await redis.lrange("words", 0, -1)) || [];
      console.log("📦 Données brutes Upstash:", list.length);
      const words = list
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log("📤 Retour final:", words.length);
      return res.status(200).json(words);
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("🔴 API error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}