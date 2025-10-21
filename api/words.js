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
    //
    // --- Test de connexion KV en interne (log seulement au premier passage)
    //
    try {
      const testKey = "kv_probe";
      await kv.set(testKey, "ok");
      const value = await kv.get(testKey);
      console.log("🟢 Connexion KV OK:", value);
    } catch (err) {
      console.error("🔴 Erreur de connexion KV:", err);
    }

    // --- Gestion du corps de requête (pour POST)
    let body = req.body;
    if (!body || typeof body === "string") {
      try {
        const raw = body ? body : await getRawBody(req);
        body = JSON.parse(raw);
      } catch {
        body = {};
      }
    }

    // --- DELETE : vider la base
    if (req.method === "DELETE") {
      await kv.del("words");
      return res
        .status(200)
        .json({ success: true, message: "All words deleted." });
    }

    // --- POST : ajouter un mot
    if (req.method === "POST") {
      const { text, x, y, color } = body;

      if (!text || x === undefined || y === undefined || !color) {
        return res
          .status(400)
          .json({ error: "Missing required fields.", received: body });
      }

      const wordData = {
        text,
        x: parseFloat(x),
        y: parseFloat(y),
        color,
        timestamp: Date.now(),
      };

      await kv.rpush("words", JSON.stringify(wordData));

      console.log("🟢 Mot ajouté:", wordData);
      return res.status(201).json({ success: true });
    }

    // --- GET : récupérer les mots
    if (req.method === "GET") {
      const wordsList = await kv.lrange("words", 0, -1);

      const words = wordsList
        .map((w) => {
          try {
            const parsed = JSON.parse(w);
            if (parsed && parsed.text && parsed.color) {
              return {
                ...parsed,
                x: parseFloat(parsed.x),
                y: parseFloat(parsed.y),
              };
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Trier du plus récent au plus ancien
      words.sort((a, b) => b.timestamp - a.timestamp);

      return res.status(200).json(words);
    }

    // --- Méthode non autorisée
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

// --- Helper pour lire le corps brut d’une requête HTTP
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}