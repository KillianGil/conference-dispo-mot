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
    // --- POST ---
    if (req.method === "POST") {
      const body = req.body;

      if (!body) {
        return res.status(400).json({ error: "Empty body" });
      }

      const { text, x, y, color } = body;
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

      // ✅ Sérialisation explicite
      const serialized = JSON.stringify(wordData);
      console.log("📝 Serialized:", serialized);

      const result = await redis.rpush("words", serialized);
      console.log("✅ Mot ajouté Redis:", wordData);
      console.log("📊 Longueur de la liste:", result);

      return res.status(201).json({ success: true });
    }

    // --- GET ---
    if (req.method === "GET") {
      console.log("🔍 GET request started");

      // Test 1: Vérifier la longueur
      const length = await redis.llen("words");
      console.log("📏 LLEN result:", length);

      // Test 2: Récupérer TOUT sans filtrage
      const rawList = await redis.lrange("words", 0, -1);
      console.log("📦 LRANGE raw result:", rawList);
      console.log("📦 Type:", typeof rawList, Array.isArray(rawList));

      // Test 3: Parser chaque élément
      const words = [];
      if (Array.isArray(rawList)) {
        for (let i = 0; i < rawList.length; i++) {
          const item = rawList[i];
          console.log(`Item ${i} type:`, typeof item);
          console.log(`Item ${i} value:`, item);

          try {
            // Si c'est déjà un objet, le garder tel quel
            if (typeof item === "object" && item !== null) {
              words.push(item);
            }
            // Sinon, parser le JSON
            else if (typeof item === "string") {
              words.push(JSON.parse(item));
            }
          } catch (err) {
            console.error(`❌ Parse error item ${i}:`, err);
          }
        }
      }

      console.log("✅ Final words array:", words.length, words);

      // Tri par timestamp
      words.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return res.status(200).json(words);
    }

    // --- DELETE ---
    if (req.method === "DELETE") {
      const result = await redis.del("words");
      console.log("🗑️ DELETE result:", result);
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("🔴 Redis API Error:", error);
    console.error("🔴 Error stack:", error.stack);
    return res.status(500).json({ error: error.message });
  }
}