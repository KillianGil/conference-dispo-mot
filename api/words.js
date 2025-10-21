import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- POST : ajouter un mot ---
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
      console.log("✅ Mot ajouté Redis:", wordData);
      return res.status(201).json({ success: true });
    }

    // --- GET : récupérer les mots ---
    if (req.method === "GET") {
      console.log("📡 Lecture clé `words` sur Upstash…");

      const list = await redis.lrange("words", 0, -1);
      console.log("🔍 Raw list from Redis:", list);

      // On tente de parser la liste récupérée
      const words = (list || [])
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch (e) {
            console.warn("⚠️ Élément non JSON:", item);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log("📤 Mots lus Redis:", words.length);

      return res.status(200).json(words);
    }

    // --- DELETE : vider la base ---
    if (req.method === "DELETE") {
      await redis.del("words");
      console.log("🧹 Tous les mots supprimés");
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("🔴 Redis API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function getRawBody(req) {
  return