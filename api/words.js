import { Redis } from "@upstash/redis";


const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tissagekil2025";


const FORBIDDEN_WORDS = [

  // Insultes courantes
  "con", "connard", "connasse", "abruti", "idiot", "imbécile", "crétin",
  "gogol", "clown", "bouffon", "guignol", "andouille", "glandeur",
  "branleur", "clochard", "manchot", "nul", "minable", "raté", "pathétique",
  "balourd", "tocard", "pauv' con", "sale con", "sale type", "pleutre",

  // Insultes fortes
  "salaud", "salopard", "salop", "salope", "pute", "putain", "pétasse",
  "petasse", "garce", "grognasse", "morue", "batard", "bâtard", "fdp",
  "ntm", "fils de pute", "ta gueule", "tg", "ta gueule",


  // Insultes fortes
  "salaud", "salopard", "salop", "salope", "pute", "putain", "pétasse",
  "petasse", "garce", "grognasse", "morue", "batard", "bâtard", "fdp",
  "ntm", "fils de pute", "ta gueule", "tg", "enculé","caca", "kaka", "pipi", "prout", "zeub", "teub", "bouffon", "boloss", "ptn", 
  "grosse merde", "gros con", "grosse conne", "grosse", "gros", "grognasse", "juif", "juive", "juifs", "juives", "israel", 

  // Vulgarité / sexualité explicite
  "merde", "bordel", "chiant", "chier", "faire chier", "chiotte",
  "cul", "bite", "teub", "queue", "zizi", "couille", "couilles",
  "chatte", "vagin", "pénis", "penis", "nichon", "nichons",
  "sucer", "fellation", "branlette", "branler", "baiser", "baisé",
  "éjaculation", "sperme", "foutre", "pénétration","paf", 

  // Violence / menaces
  "tuer", "je vais te tuer", "crève", "crève sale con", "meurtre",
  "massacre", "assassiner", "assassin", "frapper", "violence",
  "viol", "agression", "décapiter", "étrangler", "tabasser",
  "bombarder", "explosion", "arme", "fusillade",

  // Troubles mentaux utilisés comme insultes génériques
  "taré", "cinglé", "folle", "malade mental", "débile", "psychopathe",
  "sociopathe", "timbré",

  // Haine / hostilité
  "haine", "je te hais", "je te déteste",
  "ordure", "déchet", "parasite", "vermine",

  // Extrémisme / idéologies violentes
  "nazi", "nazisme", "facho", "fasciste",
  "terroriste", "djihadiste", "extrémiste",

  // Figures historiques liées à la violence (autorisé)
  "hitler", "adolf hitler",
  "himmler", "goebbels", "goering",
  "staline", "lenine", "mao",
  "ben laden", "osama ben laden",
  "kadhafi", "saddam", "pol pot",
  "pétain", "mussolini", "benladen", "netanyahu", "putain", "ptn", "put3", "h1tler","kiki",

  // Criminels connus (aucune restriction)
  "dahmer", "bundy", "manson", "joachim kroll",
  "fourniret", "zemmour" /* (politique polémique mais pas un slur) */,
  "merah", "coulibaly", "abdeslam",

  // Termes liés au crime / illégal
  "drogue", "cocaïne", "coke", "heroine", "meth",
  "dealer", "trafiquant", "cartel",
  "kidnapping", "enlèvement",

  // Termes morbides
  "cadavre", "mort", "sang", "démembrement", "charogne",

  // Harcèlement / intimidation
  "suicide toi", "suicid", "tu sers à rien", "personne t'aime",
  "t'es inutile", "t'es moche", "t'es laid", "t'es une merde",

  // Disqualification / mépris
  "va te faire voir", "va te faire foutre", "nique ta mère",
  "nique ta race" /* grossier mais ne cible aucun groupe protégé */,
  "j't'emmerde", "emmerdeur",

  // Déshumanisation générique
  "animal", "bête", "rat", "vermine", "porc", "cafard",
  "clodo", "sdf", "pouilleux",

  // Termes divers dégradants
  "prostitué", "prostitution", "pute à fric",
  "cassos", "cassosss", "cassossssss",
  "bougnoul" , "negro", "nigga", "nigger", 
  "pleurnicheur", "victimisation",
  "gamin", "sale gosse",
];

function isForbidden(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FORBIDDEN_WORDS.some(word => normalized.includes(word));
}
// ============================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  // AJOUT : On autorise le header personnalisé pour le mot de passe
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");
  res.setHeader("Cache-Control", "no-store");
  
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- POST ---
    if (req.method === "POST") {
      const body = req.body;

      if (!body) {
        return res.status(400).json({ error: "Empty body" });
      }

      // 1. CAS SPÉCIAL : VÉRIFICATION DU MOT DE PASSE (Pour le bouton Record/Reset)
      if (body.action === "verify-password") {
          if (body.password === ADMIN_PASSWORD) {
              return res.status(200).json({ success: true });
          } else {
              return res.status(401).json({ error: "Mot de passe incorrect" });
          }
      }

      // 2. AJOUT DE MOT STANDARD
      const { text, x, y, color } = body;

      // SÉCURITÉ : Vérification des insultes
      if (isForbidden(text)) {
          return res.status(400).json({ error: "Mot inapproprié." });
      }

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

      // ✅ Sérialisation explicite (Ton code d'origine)
      const serialized = JSON.stringify(wordData);
      console.log("📝 Serialized:", serialized);

      const result = await redis.rpush("words", serialized);
      console.log("✅ Mot ajouté Redis:", wordData);
      console.log("📊 Longueur de la liste:", result);

      return res.status(201).json({ success: true });
    }

    // --- GET (TON CODE D'ORIGINE INCHANGÉ) ---
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

      // Tri par timestamp (Ton tri d'origine)
      words.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return res.status(200).json(words);
    }

    // --- DELETE (SÉCURISÉ MAINTENANT) ---
    if (req.method === "DELETE") {
      // Vérification du mot de passe via Header
      const authHeader = req.headers['x-admin-password'];
      
      if (authHeader !== ADMIN_PASSWORD) {
          return res.status(403).json({ error: "Accès refusé" });
      }

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