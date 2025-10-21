import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 👉 parse manuellement le body s'il est vide
    let body = req.body;
    if (!body || typeof body === "string") {
      try {
        const textData = body ? body : await getRawBody(req);
        body = JSON.parse(textData);
      } catch (err) {
        // ignore si ce n’est pas un JSON valide
        body = {};
      }
    }

    if (req.method === "DELETE") {
      await kv.del("words");
      return res
        .status(200)
        .json({ success: true, message: "All words deleted." });
    }

    if (req.method === "POST") {
      const { text, x, y, color } = body;
      if (!text || x === undefined || y === undefined || !color) {
        return res.status(400).json({
          error: "Missing required fields.",
          received: body, // 🧩 Pour debug visible
        });
      }

      const wordData = {
        text,
        x: parseFloat(x),
        y: parseFloat(y),
        color,
        timestamp: Date.now(),
      };

      await kv.rpush("words", JSON.stringify(wordData));
      return res.status(201).json({ success: true, data: wordData });
    }

    if (req.method === "GET") {
      const wordsList = await kv.lrange("words", 0, -1);

      const words = wordsList
        .map((word) => {
          try {
            if (typeof word === "string") {
              const parsed = JSON.parse(word);
              if (
                typeof parsed.text === "string" &&
                parsed.color &&
                parsed.x !== undefined &&
                parsed.y !== undefined
              ) {
                return {
                  ...parsed,
                  x: parseFloat(parsed.x),
                  y: parseFloat(parsed.y),
                };
              }
            }
            return null;
          } catch (e) {
            console.warn("Invalid data found in KV, skipping:", word);
            return null;
          }
        })
        .filter(Boolean);

      words.sort((a, b) => b.timestamp - a.timestamp);
      return res.status(200).json(words);
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(`[${req.method}_ERROR]:`, error);
    return res.status(500).json({
      error: `Failed to process ${req.method} request.`,
      details: error.message,
    });
  }
}
try {
  const testKey = "kv_probe";
  await kv.set(testKey, "ok");
  const value = await kv.get(testKey);
  console.log("🟢 KV test value:", value);
} catch (err) {
  console.error("🔴 Erreur de connexion KV:", err);
}
/**
 * 🧠 Petit helper pour lire le corps brut d'une requête HTTP
 */
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}