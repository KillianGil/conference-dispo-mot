// ==================== CONFIGURATION ====================
const CONFIG = {
  MAX_WORDS_PER_USER: 5000,
  RESET_PASSWORD: "tissage2025",
  TARGET_FPS: 60,
  MAX_POOL_SIZE: 100,
  FETCH_INTERVAL: 2000,
};

const FORBIDDEN_WORDS = [

  // Insultes courantes
  "con", "connard", "connasse", "abruti", "idiot", "imbécile", "crétin",
  "gogol", "clown", "bouffon", "guignol", "andouille", "glandeur",
  "branleur", "clochard", "manchot", "nul", "minable", "raté", "pathétique",
  "balourd", "tocard", "pauv' con", "sale con", "sale type", "pleutre",

  // Insultes fortes
  "salaud", "salopard", "salop", "salope", "pute", "putain", "pétasse",
  "petasse", "garce", "grognasse", "morue", "batard", "bâtard", "fdp",
  "ntm", "fils de pute", "ta gueule", "tg",


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
  "éjaculation", "sperme", "foutre", "pénétration","paf", "paf",

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

// Descriptions des modes
const MODE_DESCRIPTIONS = {
  chronological: "Les mots se connectent dans l'ordre d'ajout",
  random: "Chaque mot se connecte à un autre aléatoirement",
  proximity: "Les mots proches se connectent entre eux",
  color: "Les couleurs similaires se relient",
  resonance: "Les mots partageant 2+ lettres se connectent",
  constellation: "Effet étoilé scintillant",
  waves: "Connexions en courbes fluides",
  ripple: "Vagues concentriques depuis chaque mot",
  spiral: "Connexions en spirale hypnotique",
  web: "Réseau interconnecté dense",
  pulse: "Ondes de choc lumineuses",
  basket: "Motif de vannerie croisé",
  flow: "Particule lumineuse voyageant à travers le tissage chronologique",
};

// ==================== UTILITAIRES ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function resetUserCounter() {
  localStorage.removeItem("userWordCount");
  localStorage.removeItem("isRecordingAdmin");
  console.log("🔄 Compteur utilisateur réinitialisé");
}

function getUserWordCount() {
  try {
    const count = localStorage.getItem("userWordCount");
    return count ? parseInt(count, 10) : 0;
  } catch (e) {
    console.error("Erreur localStorage:", e);
    return 0;
  }
}

function incrementUserWordCount() {
  try {
    const count = getUserWordCount();
    localStorage.setItem("userWordCount", (count + 1).toString());
    console.log("Compteur incrémenté:", count + 1);
  } catch (e) {
    console.error("Erreur localStorage:", e);
  }
}

function canUserAddWord() {
  const count = getUserWordCount();
  const canAdd = count < CONFIG.MAX_WORDS_PER_USER;
  console.log(
    `Peut ajouter ? ${canAdd} (${count}/${CONFIG.MAX_WORDS_PER_USER})`
  );
  return canAdd;
}

function isForbidden(text) {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return FORBIDDEN_WORDS.some(
    (word) =>
      normalized.includes(word) ||
      normalized
        .replace(/[@0o1il]/g, (c) => ({ "@": "a", 0: "o", 1: "i", l: "i" }[c] || c))
        .includes(word)
  );
}

// ==================== CLASSE PARTICLE ====================
class Particle {
  constructor(x, y, color) {
    this.reset(x, y, color);
  }

  reset(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = (Math.random() - 0.5) * 3;
    this.life = 1;
    this.color = color;
    this.size = Math.random() * 4 + 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.015;
    this.vy += 0.15;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// ==================== GÉNÉRATEUR DE COULEURS ====================
// ==================== GÉNÉRATEUR DE COULEURS ====================
// ==================== GÉNÉRATEUR DE COULEURS ====================
const colorGenerator = {
  mode: "auto",
  customColor: "#6366f1",
  lastHues: [], // Éviter les répétitions

  getColor: function () {
    if (this.mode === "custom") {
      return this.customColor;
    }
    
    // 🔥 COULEURS DISTINCTES PAR ZONES
    const colorZones = [
      { name: "rouge", hue: [0, 20], sat: [60, 90], light: [45, 65] },
      { name: "orange", hue: [20, 45], sat: [70, 95], light: [50, 70] },
      { name: "jaune", hue: [45, 65], sat: [75, 100], light: [55, 75] },
      { name: "vert clair", hue: [65, 120], sat: [50, 80], light: [45, 70] },
      { name: "vert foncé", hue: [120, 150], sat: [60, 85], light: [35, 55] },
      { name: "cyan", hue: [150, 190], sat: [55, 85], light: [50, 70] },
      { name: "bleu clair", hue: [190, 220], sat: [60, 90], light: [55, 75] },
      { name: "bleu foncé", hue: [220, 250], sat: [65, 90], light: [40, 60] },
      { name: "violet", hue: [250, 280], sat: [60, 85], light: [50, 70] },
      { name: "magenta", hue: [280, 320], sat: [65, 90], light: [45, 65] },
      { name: "rose", hue: [320, 350], sat: [70, 95], light: [50, 70] }
    ];
    
    // Éviter les 3 dernières teintes utilisées
    let zone;
    let attempts = 0;
    do {
      zone = colorZones[Math.floor(Math.random() * colorZones.length)];
      attempts++;
    } while (
      this.lastHues.length > 0 && 
      this.lastHues.some(h => Math.abs(h - zone.hue[0]) < 30) &&
      attempts < 20
    );
    
    const hue = zone.hue[0] + Math.random() * (zone.hue[1] - zone.hue[0]);
    const saturation = zone.sat[0] + Math.random() * (zone.sat[1] - zone.sat[0]);
    const lightness = zone.light[0] + Math.random() * (zone.light[1] - zone.light[0]);
    
    // Mémoriser pour éviter répétitions
    this.lastHues.push(hue);
    if (this.lastHues.length > 3) {
      this.lastHues.shift();
    }
    
    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  },

  setCustomColor: function (color) {
    this.customColor = color;
  },

  setMode: function (mode) {
    this.mode = mode;
  },
};

// ==================== ANIMATIONS D'APPARITION ====================
const appearingWords = new Set();

function animateWordAppearance(word) {
  appearingWords.add(word);
  
  setTimeout(() => {
    appearingWords.delete(word);
  }, 600);
}

// ==================== INITIALISATION DOM ====================
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("weave-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const wordsList = document.getElementById("words-list");
  const wordForm = document.getElementById("word-form");
  const wordInput = document.getElementById("word-input");
  const mainContainer = document.getElementById("main-container");
  const togglePanelButton = document.getElementById("toggle-panel-button");
  const downloadButton = document.getElementById("download-button");
  const resetButton = document.getElementById("reset-button");

  // ==================== VARIABLES GLOBALES ====================
  let displayedWords = [];
  let animationFrame = null;
  let currentAnimatingConnection = null;
  let animationProgress = 0;
  let particles = [];

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let startX, startY;
  let lastTouchDistance = 0;
  let isPinching = false;

  let recordedFrames = [];
  let isRecording = false;
  let recordingInterval = null;
  let recordingStartTime = 0;

  let lastFrameTime = 0;
  const frameInterval = 1000 / CONFIG.TARGET_FPS;
  let canDraw = true;
  let pendingDraws = false;
  let colorsShuffled = false;
  let positionsShuffled = false;

  const wordOccurrencesCache = new Map();
  const geometryCache = new Map();
  const particlePool = [];

  let settings = {
    linkMode: "chronological",
    showWords: true,
    animateLines: true,
    lineWidth: 6,
    enableResonance: false,
    showTimestamp: true,
    useGradient: true,
    enableParticles: true,
    linesOpacity: 0.85,      
    globalScale: 1.0,         
  };

  // ==================== GESTION DU POOL DE PARTICULES ====================
  function getParticle(x, y, color) {
    if (particlePool.length > 0) {
      const p = particlePool.pop();
      p.reset(x, y, color);
      return p;
    }
    return new Particle(x, y, color);
  }

  function recycleParticle(particle) {
    if (particlePool.length < CONFIG.MAX_POOL_SIZE) {
      particlePool.push(particle);
    }
  }

  // ==================== VÉRIFICATION ET DÉBLOCAGE ====================
  async function checkAndUnblockUser() {
    try {
      const response = await fetch("/api/words");
      const words = await response.json();

      const lastReset = localStorage.getItem("lastResetTime");
      const timeSinceReset = lastReset
        ? Date.now() - parseInt(lastReset)
        : Infinity;

      if (
        words.length === 0 ||
        (getUserWordCount() >= 5 && timeSinceReset > 300000)
      ) {
        resetUserCounter();
        wordInput.disabled = false;
        wordForm.querySelector("button").disabled = false;
        wordInput.placeholder = "Partagez un mot...";
        console.log("✅ Compteur débloqué automatiquement");
      }
    } catch (err) {
      console.error("Erreur vérification:", err);
    }
  }

  checkAndUnblockUser();

  // ==================== CALCULS DE POSITION ====================
  function getAdaptiveMinDistance() {
    const container = document.getElementById("canvas-container");
    if (!container) return 0.3;

    const uniqueCount = new Set(
      displayedWords.map((w) => w.text.toLowerCase())
    ).size;
    const isMobile = window.innerWidth < 768;

    let baseDistance = isMobile ? 0.25 : 0.3;

    if (uniqueCount > 50) baseDistance = isMobile ? 0.18 : 0.22;
    else if (uniqueCount > 30) baseDistance = isMobile ? 0.20 : 0.25;
    else if (uniqueCount > 15) baseDistance = isMobile ? 0.22 : 0.28;

    const adaptiveDistance = Math.max(
      isMobile ? 0.105 : 0.135,
      baseDistance
    );
    return Math.min(0.45, adaptiveDistance);
  }
  function getPointRadius(occurrences) {
    const isMobile = window.innerWidth < 768;
    const baseSize = isMobile ? 20 : 24; // 🔥 Points plus gros
    return baseSize + (occurrences - 1) * 5; // 🔥 Croissance augmentée
  }

  function getMaxPointSize(occurrences) {
    const pointSize = getPointRadius(occurrences);
    return pointSize + 20;
  }

  function getUniqueWordPositions() {
    const positionMap = new Map();
    displayedWords.forEach((word) => {
      const key = word.text.toLowerCase();
      if (!positionMap.has(key)) {
        const occurrences = displayedWords.filter(
          (w) => w.text.toLowerCase() === key
        ).length;
        positionMap.set(key, {
          x: word.x,
          y: word.y,
          maxSize: getMaxPointSize(occurrences),
        });
      }
    });
    return Array.from(positionMap.values());
  }

  function isPositionValid(x, y, minDist) {
    // Plus aucune limite de bordure (plus de x < 0.1...)
    
    // On vérifie uniquement la distance avec les voisins
    for (const word of displayedWords) {
      const dx = word.x - x;
      const dy = word.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Si on est trop près d'un autre mot, c'est non
      if (dist < minDist) return false;
    }
    return true;
}

function findValidPosition() {
  const minDist = getAdaptiveMinDistance();
  const center = 0.5;
  
  // La zone de jeu s'agrandit avec le nombre de mots
  // Mais on peut placer n'importe où DANS cette zone
  let maxRadius = 0.3 + (displayedWords.length * 0.03);

  // On tente 300 fois de trouver une place
  for (let i = 0; i < 300; i++) {
      // Angle aléatoire
      const angle = Math.random() * Math.PI * 2;
      
      // 🔥 VRAI ALÉATOIRE : Distance aléatoire entre 0 et le max
      // Math.sqrt assure une distribution uniforme (pas de paquet au centre)
      const r = Math.sqrt(Math.random()) * maxRadius; 
      
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);

      if (isPositionValid(x, y, minDist)) {
          return { x, y };
      }
  }

  // Si vraiment on a pas trouvé (très rare), on force un peu plus loin
  const angle = Math.random() * Math.PI * 2;
  const r = maxRadius + 0.2;
  return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
  };
}

  function findExistingWord(text) {
    return displayedWords.find(
      (w) => w.text.toLowerCase() === text.toLowerCase()
    );
  }

  // ==================== CALCULS GÉOMÉTRIQUES ====================
  function distance(word1, word2) {
    const dx = word1.x - word2.x;
    const dy = word1.y - word2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function colorSimilarity(color1, color2) {
    const hsl1 = color1.match(/\d+/g).map(Number);
    const hsl2 = color2.match(/\d+/g).map(Number);
    return Math.abs(hsl1[0] - hsl2[0]);
  }

  function hasResonance(word1, word2) {
    const letters1 = new Set(word1.text.toLowerCase().split(""));
    const letters2 = new Set(word2.text.toLowerCase().split(""));
    const common = [...letters1].filter((l) => letters2.has(l));
    return common.length >= 2;
  }

  function isVisible(word, scale, offsetX, offsetY, width, height) {
    const x = word.x * width * scale + offsetX;
    const y = word.y * height * scale + offsetY;

    const margin = Math.max(200, Math.max(width, height) * 0.3);

    return (
      x > -margin &&
      x < width + margin &&
      y > -margin &&
      y < height + margin
    );
  }

  // ==================== CACHE DES OCCURRENCES ====================
  function getWordOccurrences() {
    const cacheKey = displayedWords.map((w) => w.text).join(",");
    if (wordOccurrencesCache.has(cacheKey)) {
      return wordOccurrencesCache.get(cacheKey);
    }

    const counts = {};
    displayedWords.forEach((word) => {
      const key = word.text.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    wordOccurrencesCache.set(cacheKey, counts);
    return counts;
  }

  // ==================== STATISTIQUES AVANCÉES ====================
  function calculateAdvancedStats() {
    if (displayedWords.length === 0) return null;

    // 1. CROISEMENTS DE TRAITS
    function doSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
      const det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
      if (det === 0) return false;
      
      const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
      const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
      
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }

    const connections = calculateConnections(settings.linkMode, displayedWords, 1, 1);
    let crossings = 0;
    
    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const [w1a, w1b] = connections[i];
        const [w2a, w2b] = connections[j];
        
        if (doSegmentsIntersect(
          w1a.x, w1a.y, w1b.x, w1b.y,
          w2a.x, w2a.y, w2b.x, w2b.y
        )) {
          crossings++;
        }
      }
    }

    // 2. INTENSITÉ LUMINEUSE
    function hslToLightness(hslString) {
      const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      return match ? parseInt(match[3]) : 50;
    }

    const lightnesses = displayedWords.map(w => hslToLightness(w.color));
    const avgLightness = lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length;
    const lightIntensity = avgLightness > 55 ? "Lumineuse ✨" : 
                          avgLightness > 45 ? "Équilibrée ⚖️" : 
                          "Sombre 🌙";

    // 3. PALETTE CHROMATIQUE
    const colorCounts = {};
    displayedWords.forEach(w => {
      const hue = w.color.match(/hsl\((\d+)/)[1];
      const hueRange = Math.floor(hue / 30) * 30;
      colorCounts[hueRange] = (colorCounts[hueRange] || 0) + 1;
    });

    const topColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hue, count]) => ({
        color: `hsl(${hue}, 70%, 60%)`,
        name: getColorName(parseInt(hue)),
        count: count,
        percentage: ((count / displayedWords.length) * 100).toFixed(1)
      }));

    // 4. DISPERSION SPATIALE
    const centerX = displayedWords.reduce((sum, w) => sum + w.x, 0) / displayedWords.length;
    const centerY = displayedWords.reduce((sum, w) => sum + w.y, 0) / displayedWords.length;
    const avgDistance = displayedWords.reduce((sum, w) => {
      const dx = w.x - centerX;
      const dy = w.y - centerY;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0) / displayedWords.length;
    
    const dispersion = avgDistance > 0.3 ? "Étendue 🌍" : 
                      avgDistance > 0.2 ? "Répartie 🎯" : 
                      "Concentrée 🔬";

    // 5. DIVERSITÉ
    const wordOccurrences = getWordOccurrences();
    const uniqueWords = Object.keys(wordOccurrences).length;
    const diversity = ((uniqueWords / displayedWords.length) * 100).toFixed(0);

    return {
      crossings,
      lightIntensity,
      avgLightness: avgLightness.toFixed(0),
      topColors,
      dispersion,
      avgDistance: (avgDistance * 100).toFixed(0),
      diversity
    };
  }

  function getColorName(hue) {
    if (hue < 15 || hue >= 345) return "Rouge";
    if (hue < 45) return "Orange";
    if (hue < 75) return "Jaune";
    if (hue < 165) return "Vert";
    if (hue < 255) return "Bleu";
    if (hue < 285) return "Violet";
    return "Rose";
  }

  // ==================== CALCUL DES CONNEXIONS (AVEC CACHE) ====================
  function calculateConnections(mode, words, width, height) {
    const cacheKey = `${mode}-${words.map((w) => w.timestamp).join(",")}`;

    if (geometryCache.has(cacheKey)) {
      return geometryCache.get(cacheKey);
    }

    let connections = [];

    if (mode === "chronological" || mode === "flow") {
      const sortedWords = [...words].sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 1; i < sortedWords.length; i++) {
        connections.push([sortedWords[i - 1], sortedWords[i]]);
      }
    } else if (mode === "random") {
      words.forEach((word, index) => {
        if (index === 0) return;
        const hash = (word.text + word.timestamp)
          .split("")
          .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
        const targetIndex = Math.abs(hash) % index;
        connections.push([words[targetIndex], word]);
      });
    } else if (mode === "proximity") {
      words.forEach((word) => {
        const distances = words
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);
        distances.forEach((d) => connections.push([word, d.word]));
      });
    } else if (mode === "color") {
      words.forEach((word) => {
        const similar = words
          .filter((w) => w !== word)
          .map((w) => ({
            word: w,
            sim: colorSimilarity(word.color, w.color),
          }))
          .sort((a, b) => a.sim - b.sim)
          .slice(0, 2);
        similar.forEach((s) => connections.push([word, s.word]));
      });
    } else if (mode === "resonance") {
      words.forEach((word) => {
        const resonant = words.filter(
          (w) => w !== word && hasResonance(word, w)
        );

        if (resonant.length === 0) {
          const closest = words
            .filter((w) => w !== word)
            .map((w) => ({ word: w, dist: distance(word, w) }))
            .sort((a, b) => a.dist - b.dist)[0];
          if (closest) {
            connections.push([word, closest.word]);
          }
        } else {
          resonant.forEach((r) => connections.push([word, r]));
        }
      });
    } else if (mode === "web") {
      words.forEach((word) => {
        const neighbors = words
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4);

        neighbors.forEach(({ word: neighbor }) => {
          connections.push([word, neighbor]);
        });
      });
    } else {
      const sortedWords = [...words].sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 1; i < sortedWords.length; i++) {
        connections.push([sortedWords[i - 1], sortedWords[i]]);
      }
    }

    const connectedWords = new Set();
    connections.forEach(([w1, w2]) => {
      connectedWords.add(w1);
      connectedWords.add(w2);
    });

    words.forEach((word) => {
      if (!connectedWords.has(word) && words.length > 1) {
        const closest = words
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)[0];
        if (closest) {
          connections.push([word, closest.word]);
        }
      }
    });

    geometryCache.set(cacheKey, connections);
    return connections;
  }

  // ==================== REDIMENSIONNEMENT CANVAS ====================
  function resizeCanvas() {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    const displayValue = container.style.display;
    container.style.display = "none";
    void container.offsetHeight;
    container.style.display = displayValue || "";

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) {
      console.warn("⚠️ Dimensions invalides, nouvelle tentative...");
      setTimeout(resizeCanvas, 100);
      return;
    }

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    console.log(
      `📐 Canvas: ${width}x${height}px (DPR: ${dpr}x = ${canvas.width}x${canvas.height}px)`
    );

    scheduleRedraw();
  }

  // ==================== PLANIFICATION OPTIMISÉE DES REDRAWS ====================
  function scheduleRedraw() {
    if (!pendingDraws) {
      pendingDraws = true;
      requestAnimationFrame(() => {
        drawWeave();
        pendingDraws = false;
      });
    }
  }

  // ==================== ANIMATION PRINCIPALE ====================
  function animateWeaving(timestamp = 0) {
    if (timestamp - lastFrameTime < frameInterval) {
      animationFrame = requestAnimationFrame(animateWeaving);
      return;
    }
    lastFrameTime = timestamp;

    if (currentAnimatingConnection) {
      animationProgress += 0.035;
      if (animationProgress >= 1) {
        animationProgress = 1;
        setTimeout(() => {
          currentAnimatingConnection = null;
          animationProgress = 0;
        }, 150);
      }
    }

    drawWeave();
    animationFrame = requestAnimationFrame(animateWeaving);
  }

// ==================== DESSIN PRINCIPAL ====================
// ==================== DESSIN PRINCIPAL ====================
// ==================== DESSIN PRINCIPAL ====================
// ==================== DESSIN PRINCIPAL (COMPLET & OPTIMISÉ) ====================
function drawWeave(withBackground = false) {
  if (!canDraw) return;

  const container = document.getElementById("canvas-container");
  if (!container) return;

  // Dimensions réelles pour le rendu
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Sécurité dimensions
  if (width === 0 || height === 0) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (withBackground) {
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  if (displayedWords.length === 0) {
    ctx.restore();
    return;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const visibleWords = displayedWords;
  // Note: calculateConnections a besoin de width/height pour certains calculs
  const connections = calculateConnections(
    settings.linkMode,
    displayedWords,
    width,
    height
  );

  const time = Date.now() * 0.001;

  // 🔥 OPTIMISATION ANTI-LAG : Si > 80 mots, on coupe les ombres lourdes
  const isHeavy = displayedWords.length > 80;


  // ==================== 1. MODE CONSTELLATION ====================
  if (settings.linkMode === "constellation") {
    visibleWords.forEach((word) => {
      const x = word.x * width;
      const y = word.y * height;
      const twinkle = Math.abs(Math.sin(time * 2 + word.timestamp * 0.001));

      // Réduction étoiles si lourd
      const starCount = isHeavy ? 1 : 3;

      for (let i = 0; i < starCount; i++) {
        const angle = (time + (i * Math.PI * 2) / 3) * 0.5;
        const radius = 30 + Math.sin(time + i) * 10;
        const starX = x + Math.cos(angle) * radius;
        const starY = y + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(starX, starY, 2, 0, Math.PI * 2);
        ctx.fillStyle = word.color;
        ctx.globalAlpha = twinkle * 0.6 * settings.linesOpacity;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }


  // ==================== 2. MODE WAVES (CORRIGÉ DESKTOP) ====================
  else if (settings.linkMode === "waves") {
    connections.forEach(([word1, word2]) => {
      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // CORRECTION : Amplitude proportionnelle à la largeur de l'écran (5%)
      // Au lieu de 50px fixes, ce qui rendait mal sur grand écran.
      const baseAmplitude = width * 0.05; 
      const offset = Math.sin(time * 2) * baseAmplitude;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const perpX = (-dy / len) * offset;
      const perpY = (dx / len) * offset;

      // Halo discret (Désactivé si lourd)
      if (!isHeavy) {
        ctx.save();
        ctx.globalAlpha = 0.2 * settings.linesOpacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = word2.color;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX + perpX, midY + perpY, x2, y2);
        ctx.lineWidth = Math.max(3, settings.lineWidth * 1.2);
        ctx.strokeStyle = word2.color;
        ctx.stroke();
        ctx.restore();
      }

      // Trait avec dégradé
      ctx.save();
      // Pas d'ombre portée si lourd
      if (!isHeavy) {
          ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
          ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX + perpX, midY + perpY, x2, y2);

      if (settings.useGradient) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(1, word2.color);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = word2.color;
      }

      ctx.lineWidth = Math.max(2, settings.lineWidth * 1.0);
      ctx.globalAlpha = 0.85 * settings.linesOpacity;
      ctx.stroke();
      ctx.restore();
    });
  }


  // ==================== 3. MODE RIPPLE ====================
  else if (settings.linkMode === "ripple") {
    visibleWords.forEach((word, index) => {
      const x = word.x * width;
      const y = word.y * height;

      // Réduire les anneaux si lourd (1 seul au lieu de 3)
      const rings = isHeavy ? 1 : 3;

      for (let ring = 0; ring < rings; ring++) {
        const phase = (time * 2 + index * 0.5 + ring * 0.8) % 4;
        const radius = 30 + phase * 40;
        const opacity = Math.max(0, 1 - phase / 4);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = word.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = opacity * 0.5 * settings.linesOpacity;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    connections.forEach(([word1, word2]) => {
      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;

      // Halo (Désactivé si lourd)
      if (!isHeavy) {
          ctx.save();
          ctx.globalAlpha = 0.2 * settings.linesOpacity;
          ctx.shadowBlur = 10;
          ctx.shadowColor = word2.color;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = Math.max(3, settings.lineWidth * 1.2);
          ctx.strokeStyle = word2.color;
          ctx.stroke();
          ctx.restore();
      }

      // Trait principal
      ctx.save();
      if (!isHeavy) {
        ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = word2.color;
      ctx.lineWidth = Math.max(2, settings.lineWidth * 0.9);
      ctx.globalAlpha = 0.8 * settings.linesOpacity;
      ctx.stroke();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }


  // ==================== 4. MODE SPIRAL ====================
  else if (settings.linkMode === "spiral") {
    const centerX = width / 2;
    const centerY = height / 2;

    visibleWords.forEach((word, index) => {
      const x = word.x * width;
      const y = word.y * height;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const spiralAngle = angle + (dist / 100) * Math.sin(time + index * 0.1);
      const spiralRadius = dist * (1 + Math.sin(time * 2 + index * 0.2) * 0.1);

      const spiralX = centerX + Math.cos(spiralAngle) * spiralRadius;
      const spiralY = centerY + Math.sin(spiralAngle) * spiralRadius;

      ctx.save();
      if (!isHeavy) {
          ctx.shadowColor = word.color;
          ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(spiralX, spiralY);

      const gradient = ctx.createLinearGradient(x, y, spiralX, spiralY);
      gradient.addColorStop(0, word.color);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(2, settings.lineWidth * 0.9);
      ctx.globalAlpha = 0.8 * settings.linesOpacity;
      ctx.stroke();
      ctx.restore();
    });
  }


  // ==================== 5. MODE WEB ====================
  else if (settings.linkMode === "web") {
    // Récupération des voisins déjà calculés dans calculateConnections si possible,
    // mais le mode "web" fait son propre calcul local souvent. 
    // On reprend la logique originale qui recalcule les voisins pour l'opacité.
    visibleWords.forEach((word) => {
      const neighbors = visibleWords
        .filter((w) => w !== word)
        .map((w) => ({ word: w, dist: distance(word, w) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4);

      neighbors.forEach(({ word: neighbor, dist }) => {
        const x1 = word.x * width;
        const y1 = word.y * height;
        const x2 = neighbor.x * width;
        const y2 = neighbor.y * height;

        const opacity = Math.max(0.25, 1 - dist / 0.5);

        // Halo (Désactivé si lourd)
        if (!isHeavy) {
            ctx.save();
            ctx.globalAlpha = opacity * 0.2 * settings.linesOpacity;
            ctx.shadowBlur = 8;
            ctx.shadowColor = word.color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = Math.max(3, settings.lineWidth * 1.2);
            ctx.strokeStyle = word.color;
            ctx.stroke();
            ctx.restore();
        }

        // Trait
        ctx.save();
        if (!isHeavy) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
            ctx.shadowBlur = 6;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (settings.useGradient) {
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, word.color);
          gradient.addColorStop(1, neighbor.color);
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = word.color;
        }

        ctx.globalAlpha = opacity * 0.7 * settings.linesOpacity;
        ctx.lineWidth = Math.max(2, settings.lineWidth * 0.9);
        ctx.stroke();
        ctx.restore();
      });
    });
    ctx.globalAlpha = 1;
  }


  // ==================== 6. MODE PULSE ====================
  else if (settings.linkMode === "pulse") {
    connections.forEach(([word1, word2], idx) => {
      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;

      const pulse = Math.abs(Math.sin(time * 3 - idx * 0.3));

      // Halo (Désactivé si lourd)
      if (!isHeavy) {
          ctx.save();
          ctx.globalAlpha = 0.25 * settings.linesOpacity;
          ctx.shadowColor = word2.color;
          ctx.shadowBlur = 10 * pulse;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = Math.max(3, settings.lineWidth * 1.2 + pulse * 1.5);
          ctx.strokeStyle = word2.color;
          ctx.stroke();
          ctx.restore();
      }

      // Trait principal
      ctx.save();
      if (!isHeavy) {
          ctx.shadowColor = word2.color;
          ctx.shadowBlur = 8 * pulse;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (settings.useGradient) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(0.5, "white");
        gradient.addColorStop(1, word2.color);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = word2.color;
      }

      ctx.lineWidth = Math.max(2, settings.lineWidth * 1.0 + pulse * 1.0);
      ctx.globalAlpha = (0.8 + pulse * 0.1) * settings.linesOpacity;
      ctx.stroke();
      ctx.restore();

      // Petite particule qui voyage
      const travelProgress = (time * 0.5 + idx * 0.2) % 1;
      const travelX = x1 + (x2 - x1) * travelProgress;
      const travelY = y1 + (y2 - y1) * travelProgress;

      ctx.beginPath();
      ctx.arc(travelX, travelY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      if (!isHeavy) {
        ctx.shadowColor = "white";
        ctx.shadowBlur = 12;
      }
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }


  // ==================== 7. MODE BASKET ====================
  else if (settings.linkMode === "basket") {
    // Si trop lourd, on désactive le basket car c'est le plus gourmand (boucles imbriquées)
    if (!isHeavy) {
        const gridSize = Math.max(40, settings.weavingDensity || 60);

        for (let y = 0; y < height; y += gridSize) {
          for (let x = 0; x < width; x += gridSize) {
            const cellCenterX = x + gridSize / 2;
            const cellCenterY = y + gridSize / 2;

            let closestWord = displayedWords[0];
            let minDist = Infinity;

            // Optimisation : Chercher le mot le plus proche
            displayedWords.forEach((word) => {
              const dx = word.x * width - cellCenterX;
              const dy = word.y * height - cellCenterY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < minDist) {
                minDist = dist;
                closestWord = word;
              }
            });

            const cellX = Math.floor(x / gridSize);
            const cellY = Math.floor(y / gridSize);
            const pattern = (cellX + cellY) % 4;

            ctx.save();

            const weavePhase = (time + cellX * 0.2 + cellY * 0.3) % 2;
            const elevation = weavePhase < 1 ? weavePhase : 2 - weavePhase;

            if (pattern === 0 || pattern === 2) {
              ctx.fillStyle = closestWord.color;
              ctx.globalAlpha = (0.7 + elevation * 0.2) * settings.linesOpacity;
              // Ombres simplifiées
              ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
              ctx.shadowBlur = 5 * elevation;
              ctx.shadowOffsetY = 3 * elevation;

              for (let i = 0; i < 3; i++) {
                const bandY = y + i * (gridSize / 3);
                ctx.fillRect(x, bandY, gridSize, gridSize / 4);
              }
            } else {
              ctx.fillStyle = closestWord.color;
              ctx.globalAlpha = (0.5 + elevation * 0.2) * settings.linesOpacity;
              ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
              ctx.shadowBlur = 3 * elevation;
              ctx.shadowOffsetX = 2 * elevation;

              for (let i = 0; i < 3; i++) {
                const bandX = x + i * (gridSize / 3);
                ctx.fillRect(bandX, y, gridSize / 4, gridSize);
              }
            }
            ctx.restore();
          }
        }
    }
    ctx.globalAlpha = 1;
  }


  // ==================== 8. MODE FLOW (AMÉLIORÉ MULTI-PARTICULES) ====================
  else if (settings.linkMode === "flow") {
    const sortedWords = [...displayedWords].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // Tracer le chemin pâle en arrière-plan
    ctx.beginPath();
    sortedWords.forEach((w, i) => {
        const x = w.x * width, y = w.y * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineWidth = Math.max(2, settings.lineWidth);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();


    const totalSegments = Math.max(1, sortedWords.length - 1);
    // CORRECTION : Train de 4 particules au lieu d'une seule
    const numParticles = 4; 
    
    for(let p = 0; p < numParticles; p++) {
        const phaseOffset = p * (totalSegments / 6); 
        const globalProg = (time * 0.8 + phaseOffset) % totalSegments;
        
        const currentSeg = Math.floor(globalProg);
        const segProg = globalProg - currentSeg;

        if (currentSeg < sortedWords.length - 1) {
            const w1 = sortedWords[currentSeg];
            const w2 = sortedWords[currentSeg + 1];
            
            const x1 = w1.x * width; const y1 = w1.y * height;
            const x2 = w2.x * width; const y2 = w2.y * height;
            
            const px = x1 + (x2 - x1) * segProg;
            const py = y1 + (y2 - y1) * segProg;

            // La tête du train (particule blanche)
            ctx.save();
            if (!isHeavy) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = w2.color;
            }
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(px, py, 6 + (Math.sin(time * 10)*2), 0, Math.PI*2);
            ctx.fill();
            
            // Traînée colorée qui suit
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(px, py);
            const grad = ctx.createLinearGradient(x1, y1, px, py);
            grad.addColorStop(0, "rgba(255,255,255,0)");
            grad.addColorStop(1, w2.color);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }
    }
  }


  // ==================== 9. MODE STANDARD (Lignes simples) ====================
  else {
    connections.forEach(([word1, word2]) => {
      if (!word1.x || !word2.x) return;

      let progress = 1;

      // Animation d'apparition (si active)
      if (
        settings.animateLines &&
        currentAnimatingConnection &&
        ((currentAnimatingConnection[0].text === word1.text &&
          currentAnimatingConnection[0].timestamp === word1.timestamp &&
          currentAnimatingConnection[1].text === word2.text &&
          currentAnimatingConnection[1].timestamp === word2.timestamp) ||
          (currentAnimatingConnection[0].text === word2.text &&
            currentAnimatingConnection[0].timestamp === word2.timestamp &&
            currentAnimatingConnection[1].text === word1.text &&
            currentAnimatingConnection[1].timestamp === word1.timestamp))
      ) {
        progress = animationProgress;
      }

      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;

      // Halo discret (Désactivé si lourd)
      if (!isHeavy) {
          ctx.save();
          ctx.globalAlpha = 0.25 * settings.linesOpacity;
          ctx.shadowBlur = 12;
          ctx.shadowColor = word2.color;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
          
          ctx.lineWidth = Math.max(4, settings.lineWidth * 1.4);
          ctx.strokeStyle = word2.color;
          ctx.stroke();
          ctx.restore();
      }

      // Trait Principal
      ctx.save();
      if (!isHeavy) {
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 6;
      }

      ctx.globalAlpha = 0.85 * settings.linesOpacity;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);

      if (settings.useGradient) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(1, word2.color);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = word2.color;
      }

      ctx.lineWidth = Math.max(2, settings.lineWidth * 1.0);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ==================== PARTICULES AMBIANTES ====================
  if (settings.enableParticles) {
    const deadParticles = [];
    particles = particles.filter((p) => {
      if (p.life <= 0) {
        deadParticles.push(p);
        return false;
      }
      return true;
    });
    deadParticles.forEach((p) => recycleParticle(p));

    particles.forEach((p) => {
      p.update();
      p.draw(ctx);
    });
  } else {
    particles.forEach((p) => recycleParticle(p));
    particles = [];
  }

  ctx.globalAlpha = 1;

  // ==================== DESSIN DES POINTS & TEXTES ====================
  // Tri pour afficher les plus gros points devant
  const wordOccurrences = getWordOccurrences();
  const uniqueDisplayMap = new Map();
  visibleWords.forEach((word) => {
    const key = word.text.toLowerCase();
    if (!uniqueDisplayMap.has(key)) {
      uniqueDisplayMap.set(key, word);
    }
  });

  const sortedForDisplay = Array.from(uniqueDisplayMap.values()).sort(
    (a, b) => {
      const countA = wordOccurrences[a.text.toLowerCase()];
      const countB = wordOccurrences[b.text.toLowerCase()];
      return countA - countB;
    }
  );

  sortedForDisplay.forEach((word) => {
    const occurrences = wordOccurrences[word.text.toLowerCase()];
    const isHighlighted = word.highlighted || false;
    const highlightBonus = isHighlighted ? 6 : 0;
    const pointSize = (getPointRadius(occurrences) + highlightBonus) * settings.globalScale;

    const wobbleX = Math.sin(time * 2 + word.timestamp * 0.001) * 3;
    const wobbleY = Math.cos(time * 1.5 + word.timestamp * 0.001) * 3;
    const x = word.x * width + wobbleX;
    const y = word.y * height + wobbleY;

    // Générer particules occasionnelles (réduit si lourd)
    if (settings.enableParticles && Math.random() < (isHeavy ? 0.005 : 0.06)) {
      particles.push(getParticle(x, y, word.color));
    }

    // Pulse animation
    const pulseFactor = isHighlighted ? 6 : 4;
    const pulseSize = pointSize + 10 + Math.sin(time * (isHighlighted ? 4 : 3) + word.timestamp * 0.001) * pulseFactor;

    // Cercle extérieur (Pulse)
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = word.color;
    ctx.lineWidth = isHighlighted ? 5 : 4;
    ctx.globalAlpha = isHighlighted ? 0.8 : 0.5;
    ctx.stroke();

    // Cercle plein (Couleur)
    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    ctx.fillStyle = word.color;
    ctx.globalAlpha = 1;
    if (!isHeavy) {
        ctx.shadowColor = word.color;
        ctx.shadowBlur = isHighlighted ? 28 : 20;
    }
    ctx.fill();

    // Bordure blanche
    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    ctx.strokeStyle = isHighlighted ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = isHighlighted ? 5 : 3;
    ctx.stroke();

    // Reflet brillant (Glossy)
    ctx.beginPath();
    ctx.arc(x, y, pointSize * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    if (!isHeavy) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "white";
    }
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // TEXTE
    if (settings.showWords) {
        ctx.globalAlpha = 1;
        const isMobile = window.innerWidth < 768;
        const baseFontSize = isMobile ? 22 : 28;
        const fontSize = baseFontSize * settings.globalScale;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        
        const textPadding = Math.max(22, fontSize * 0.6);
        const textY = y - pointSize - textPadding;

        // Contour noir (lisibilité)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = isMobile ? 6 : 7;
        ctx.strokeText(word.text, x, textY);

        // Couleur brillante
        const brightColor = word.color.replace(
            /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/,
            (match, h, s, l) => {
            const newL = Math.min(85, parseInt(l) + 20);
            return `hsl(${h}, ${s}%, ${newL}%)`;
            }
        );

        ctx.fillStyle = brightColor;
        if (!isHeavy) {
            ctx.shadowBlur = isHighlighted ? 32 : 26;
            ctx.shadowColor = brightColor;
        }
        ctx.fillText(word.text, x, textY);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
    }
  });

  ctx.restore();
}
  // ==================== STATISTIQUES ====================
  function updateStats() {
    const statsPanel = document.getElementById("stats-panel");
    if (statsPanel.classList.contains("hidden")) {
      return;
    }

    if (displayedWords.length === 0) {
      document.getElementById("stats-content").innerHTML =
        '<p class="text-gray-400 text-sm">Aucune donnée disponible</p>';
      return;
    }

    const wordCounts = getWordOccurrences();
    const sorted = Object.entries(wordCounts).sort(([, a], [, b]) => b - a);
    const totalWords = displayedWords.length;
    const timestamps = displayedWords.map((w) => w.timestamp).filter(Boolean);
    let timeSpan = 0;
    if (timestamps.length > 1) {
      const oldest = Math.min(...timestamps);
      const newest = Math.max(...timestamps);
      timeSpan = Math.floor((newest - oldest) / 1000 / 60);
    }

    const uniqueWords = Object.keys(wordCounts).length;
    let connectionCount = 0;
    if (
      settings.linkMode === "chronological" ||
      settings.linkMode === "flow"
    ) {
      connectionCount = Math.max(0, displayedWords.length - 1);
    } else if (
      settings.linkMode === "proximity" ||
      settings.linkMode === "color"
    ) {
      connectionCount = displayedWords.length * 2;
    }

    const advStats = calculateAdvancedStats();

    let html = `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${totalWords}</div>
            <div class="text-xs text-gray-400">Contributions</div>
          </div>
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${advStats.diversity}%</div>
            <div class="text-xs text-gray-400">Diversité</div>
          </div>
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${connectionCount}</div>
            <div class="text-xs text-gray-400">Connexions</div>
          </div>
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${timeSpan}</div>
            <div class="text-xs text-gray-400">Minutes</div>
          </div>
        </div>

        <!-- NOUVELLES STATS AVANCÉES -->
        <div class="bg-gray-700/30 p-3 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">
          🧵 Complexité du tissage</h4>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-400">Croisements de fils</span>
            <span class="text-lg font-bold text-orange-400">${advStats.crossings}</span>
          </div>
        </div>

        <div class="bg-gray-700/30 p-3 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">✨ Intensité lumineuse</h4>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-400">Luminosité moyenne</span>
            <span class="text-sm font-bold text-yellow-400">${advStats.lightIntensity}</span>
          </div>
          <div class="w-full bg-gray-600 rounded-full h-2">
            <div class="bg-gradient-to-r from-gray-800 via-gray-500 to-white h-2 rounded-full" 
                 style="width: ${advStats.avgLightness}%"></div>
          </div>
        </div>

        <div class="bg-gray-700/30 p-3 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">🎨 Palette chromatique</h4>
          <div class="space-y-2">
            ${advStats.topColors.map((c, i) => `
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full border-2 border-gray-600" 
                     style="background: ${c.color}; box-shadow: 0 0 10px ${c.color}"></div>
                <div class="flex-1">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-300">${c.name}</span>
                    <span class="text-xs text-gray-400">${c.percentage}%</span>
                  </div>
                  <div class="w-full bg-gray-600 rounded-full h-1 mt-1">
                    <div class="h-1 rounded-full" 
                         style="width: ${c.percentage}%; background: ${c.color}"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-gray-700/30 p-3 rounded-lg">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">🗺️ Dispersion spatiale</h4>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-400">Répartition de l'espace</span>
            <span class="text-sm font-bold text-blue-400">${advStats.dispersion}</span>
          </div>
        </div>

        <div class="mt-4">
          <h4 class="text-sm font-semibold text-gray-300 mb-2">🔝 Top 5 des mots</h4>
          <div class="space-y-2">
    `;

    sorted.slice(0, 5).forEach(([word, count]) => {
      const percentage = ((count / totalWords) * 100).toFixed(1);
      html += `
        <div class="bg-gray-700/30 p-2 rounded">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-200">${word}</span>
            <span class="text-xs text-indigo-400">${count}x (${percentage}%)</span>
          </div>
          <div class="w-full bg-gray-600 rounded-full h-1.5">
            <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
        <div class="mt-4 text-xs text-gray-500">
          Dernière mise à jour: ${new Date().toLocaleTimeString("fr-FR")}
        </div>
      </div>
    `;

    document.getElementById("stats-content").innerHTML = html;
  }

  // ==================== DÉTECTION CHEVAUCHEMENTS ====================
function detectAndResolveOverlaps() {
  const wordOccurrences = getWordOccurrences();
  const width = canvas.clientWidth || 800;
  
  // Regrouper par mot unique
  const uniqueWords = new Map();
  displayedWords.forEach(word => {
    const key = word.text.toLowerCase();
    if (!uniqueWords.has(key)) {
      uniqueWords.set(key, word);
    }
  });
  
  const uniqueArray = Array.from(uniqueWords.values());
  let hasOverlaps = false;
  
  // Vérifier chaque paire de mots
  for (let i = 0; i < uniqueArray.length; i++) {
    for (let j = i + 1; j < uniqueArray.length; j++) {
      const word1 = uniqueArray[i];
      const word2 = uniqueArray[j];
      
      const occurrences1 = wordOccurrences[word1.text.toLowerCase()] || 1;
      const occurrences2 = wordOccurrences[word2.text.toLowerCase()] || 1;
      
      const radius1 = getPointRadius(occurrences1) / width;
      const radius2 = getPointRadius(occurrences2) / width;
      
      const dx = word1.x - word2.x;
      const dy = word1.y - word2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const minDist = radius1 + radius2 + 0.08; // Marge de sécurité
      
      if (dist < minDist && dist > 0.001) {
        hasOverlaps = true;
        
        // Éloigner les deux points proportionnellement
        const overlap = minDist - dist;
        const angle = Math.atan2(dy, dx);
        
        word1.x += Math.cos(angle) * overlap / 2;
        word1.y += Math.sin(angle) * overlap / 2;
        word2.x -= Math.cos(angle) * overlap / 2;
        word2.y -= Math.sin(angle) * overlap / 2;
        
        // Appliquer à tous les mots identiques
        displayedWords.forEach(w => {
          if (w.text.toLowerCase() === word1.text.toLowerCase()) {
            w.x = word1.x;
            w.y = word1.y;
          }
          if (w.text.toLowerCase() === word2.text.toLowerCase()) {
            w.x = word2.x;
            w.y = word2.y;
          }
        });
      }
    }
  }
  
  if (hasOverlaps) {
    console.log("⚠️ Chevauchements détectés et corrigés");
    geometryCache.clear();
    scheduleRedraw();
  }
}
  // ==================== FETCH WORDS ====================
  async function fetchWords() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
  
      const response = await fetch(`/api/words?t=${Date.now()}`, {
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
      const fetchedWords = await response.json();
      if (!Array.isArray(fetchedWords)) {
        console.error("❌ Réponse inattendue:", fetchedWords);
        return;
      }
  
      // Créer une map des mots existants pour préserver les modifications
      const existingWordsMap = new Map();
      displayedWords.forEach(word => {
        const key = `${word.text}-${word.timestamp}`;
        existingWordsMap.set(key, {
          color: word.color,
          x: word.x,
          y: word.y
        });
      });
  
      const newWords = [];
      const updatedWords = fetchedWords.map(fw => {
        const key = `${fw.text}-${fw.timestamp}`;
        const existing = existingWordsMap.get(key);
        
        // Si le mot existait déjà
        if (existing) {
          // Préserver les couleurs si mélangées OU si couleur custom active
          if (colorsShuffled || colorGenerator.mode === 'custom') {
            fw.color = existing.color;
          }
          
          // Préserver les positions si mélangées
          if (positionsShuffled) {
            fw.x = existing.x;
            fw.y = existing.y;
          }
        } else {
          // Nouveau mot : appliquer la couleur custom si active
          if (colorGenerator.mode === 'custom') {
            fw.color = colorGenerator.customColor;
          }
          newWords.push(fw);
          animateWordAppearance(fw);
        }
        
        return fw;
      });
  
      displayedWords = updatedWords;
      wordOccurrencesCache.clear();
      geometryCache.clear();

      detectAndResolveOverlaps();
  
      if (newWords.length > 0) {
        updateWordList(newWords);
        updateStats();
  
        const lastNewWord = newWords[newWords.length - 1];
  
        if (settings.animateLines && displayedWords.length > 1) {
          let targetWord;
  
          if (
            settings.linkMode === "chronological" ||
            settings.linkMode === "flow"
          ) {
            const allWords = [...displayedWords].sort(
              (a, b) => a.timestamp - b.timestamp
            );
            const lastIndex = allWords.findIndex(
              (w) =>
                w.text === lastNewWord.text &&
                w.timestamp === lastNewWord.timestamp
            );
            if (lastIndex > 0) {
              targetWord = allWords[lastIndex - 1];
            }
          } else if (settings.linkMode === "proximity") {
            const candidates = displayedWords.filter(
              (w) =>
                !(
                  w.text === lastNewWord.text &&
                  w.timestamp === lastNewWord.timestamp
                )
            );
            const sorted = candidates
              .map((w) => ({ word: w, dist: distance(lastNewWord, w) }))
              .sort((a, b) => a.dist - b.dist);
            targetWord = sorted[0]?.word;
          } else if (settings.linkMode === "color") {
            const candidates = displayedWords.filter(
              (w) =>
                !(
                  w.text === lastNewWord.text &&
                  w.timestamp === lastNewWord.timestamp
                )
            );
            const sorted = candidates
              .map((w) => ({
                word: w,
                sim: colorSimilarity(lastNewWord.color, w.color),
              }))
              .sort((a, b) => a.sim - b.sim);
            targetWord = sorted[0]?.word;
          } else if (settings.linkMode === "random") {
            const candidates = displayedWords.filter(
              (w) =>
                !(
                  w.text === lastNewWord.text &&
                  w.timestamp === lastNewWord.timestamp
                )
            );
            if (candidates.length > 0) {
              const hash = (lastNewWord.text + lastNewWord.timestamp)
                .split("")
                .reduce(
                  (acc, char) => (acc << 5) - acc + char.charCodeAt(0),
                  0
                );
              const targetIndex = Math.abs(hash) % candidates.length;
              targetWord = candidates[targetIndex];
            }
          } else if (settings.linkMode === "resonance") {
            const candidates = displayedWords.filter(
              (w) =>
                !(
                  w.text === lastNewWord.text &&
                  w.timestamp === lastNewWord.timestamp
                )
            );
            const resonant = candidates.filter((w) =>
              hasResonance(lastNewWord, w)
            );
            if (resonant.length > 0) {
              targetWord = resonant[0];
            } else {
              const sorted = candidates
                .map((w) => ({ word: w, dist: distance(lastNewWord, w) }))
                .sort((a, b) => a.dist - b.dist);
              targetWord = sorted[0]?.word;
            }
          }
  
          if (targetWord) {
            currentAnimatingConnection = [targetWord, lastNewWord];
            animationProgress = 0;
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("⏱️ Timeout dépassé");
      } else {
        console.error("Erreur fetchWords:", error);
      }
    }
  }

  // ==================== UPDATE WORD LIST ====================
  function updateWordList(newWords = []) {
    const existingItems = Array.from(
      wordsList.querySelectorAll(".word-item")
    );
    const currentTexts = displayedWords.map((w) => `${w.text}-${w.timestamp}`);
    existingItems.forEach((item) => {
      if (!currentTexts.includes(item.dataset.key)) {
        item.remove();
      }
    });

    newWords.forEach((word) => {
      if (!word.text || !word.color) return;
      const li = document.createElement("li");
      li.className =
        "word-item p-3 rounded-lg flex items-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors";
      li.style.borderLeft = `4px solid ${word.color}`;
      li.dataset.text = word.text;
      li.dataset.key = `${word.text}-${word.timestamp}`;

      const colorDot = document.createElement("span");
      colorDot.className = "w-3 h-3 rounded-full mr-3 flex-shrink-0";
      colorDot.style.backgroundColor = word.color;
      colorDot.style.boxShadow = `0 0 8px ${word.color}`;

      const textSpan = document.createElement("span");
      textSpan.textContent = word.text;
      textSpan.className = "text-gray-100 truncate flex-grow font-medium";

      li.appendChild(colorDot);
      li.appendChild(textSpan);

      if (settings.showTimestamp) {
        const timeSpan = document.createElement("span");
        const date = new Date(word.timestamp);
        timeSpan.textContent = date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        timeSpan.className = "text-xs text-gray-400 ml-2 flex-shrink-0";
        li.appendChild(timeSpan);
      }
      wordsList.insertBefore(li, wordsList.firstChild);
    });
  }

// ==================== MISE À JOUR COULEURS LISTE ====================
// ==================== MISE À JOUR COULEURS LISTE ====================
function updateWordListColors(forceColor = null) {
  const wordItems = document.querySelectorAll('.word-item');
  
  wordItems.forEach(item => {
    let colorToApply;

    if (forceColor) {
      // Mode Custom : on force la couleur choisie
      colorToApply = forceColor;
    } else {
      // Mode Aléatoire : on cherche la couleur du mot
      const key = item.dataset.key;
      const word = displayedWords.find(w => `${w.text}-${w.timestamp}` === key);
      colorToApply = word ? word.color : '#ffffff';
    }

    // Appliquer la couleur à la bordure
    item.style.borderLeft = `4px solid ${colorToApply}`;
    
    // Appliquer la couleur au point (le cercle coloré)
    const colorDot = item.querySelector('span.w-3');
    if (colorDot) {
      colorDot.style.backgroundColor = colorToApply;
      colorDot.style.boxShadow = `0 0 8px ${colorToApply}`;
    }
  });
}
  // ==================== WORD FILTER ====================
  function setupWordFilter() {
    const filterInput = document.getElementById("word-filter");
    const filterCount = document.getElementById("filter-count");

    if (!filterInput) return;

    filterInput.addEventListener("input", (e) => {
      const filter = e.target.value.toLowerCase().trim();
      const wordItems = document.querySelectorAll(".word-item");
      let visibleCount = 0;

      wordItems.forEach((item) => {
        const text = item.dataset.text.toLowerCase();
        const matches = text.includes(filter);
        item.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
      });

      if (filter) {
        filterCount.textContent = `${visibleCount} résultat${
          visibleCount > 1 ? "s" : ""
        }`;
        filterCount.classList.remove("hidden");
      } else {
        filterCount.classList.add("hidden");
      }

      displayedWords.forEach((word) => {
        word.highlighted = filter && word.text.toLowerCase().includes(filter);
      });

      scheduleRedraw();
    });

    filterInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        filterInput.value = "";
        filterInput.dispatchEvent(new Event("input"));
        filterInput.blur();
      }
    });
  }

  // ==================== ENREGISTREMENT TIME-LAPSE ====================
  function startRecording() {
    if (isRecording) return;

    const isAdmin = localStorage.getItem("isRecordingAdmin") === "true";

    if (!isAdmin) {
      const password = prompt(
        "🔒 Mot de passe administrateur pour l'enregistrement :"
      );
      if (password !== CONFIG.RESET_PASSWORD) {
        alert("❌ Accès refusé");
        return;
      }
      localStorage.setItem("isRecordingAdmin", "true");
    }

    recordedFrames = [];
    isRecording = true;
    recordingStartTime = Date.now();

    const recordButton = document.getElementById("record-button");
    const stopButton = document.getElementById("stop-record-button");

    recordButton.classList.add("hidden");
    stopButton.classList.remove("hidden");
    stopButton.classList.add("animate-pulse");

    console.log("🎥 Enregistrement démarré");

    recordingInterval = setInterval(() => {
      if (!isRecording) return;
    
      try {
        const frame = canvas.toDataURL("image/png");
        recordedFrames.push(frame);
    
        const estimatedSize =
          recordedFrames.reduce((acc, f) => acc + f.length, 0) / 1024 / 1024;
    
        console.log(
          `📸 Frame ${recordedFrames.length} • ${estimatedSize.toFixed(2)} MB`
        );
    
        // 🔥 PLUS DE LIMITE - Enregistrement illimité
        // (Supprimé : if (recordedFrames.length >= 600 || estimatedSize > 200))
      } catch (err) {
        console.error("❌ Erreur capture frame:", err);
        stopRecording();
        alert("❌ Erreur mémoire - enregistrement arrêté");
      }
    }, 100);
  }

  function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    clearInterval(recordingInterval);

    const recordButton = document.getElementById("record-button");
    const stopButton = document.getElementById("stop-record-button");

    stopButton.classList.add("hidden");
    stopButton.classList.remove("animate-pulse");
    recordButton.classList.remove("hidden");

    const duration = ((Date.now() - recordingStartTime) / 1000).toFixed(1);
    console.log(
      `⏹️ Enregistrement arrêté: ${recordedFrames.length} frames en ${duration}s`
    );

    if (recordedFrames.length > 0) {
      exportTimelapse();
    } else {
      alert("❌ Aucune frame enregistrée");
    }
  }

  async function exportTimelapse() {
    if (recordedFrames.length === 0) {
      alert("❌ Aucune frame à exporter");
      return;
    }

    const progressModal = document.createElement("div");
    progressModal.className =
      "fixed inset-0 bg-black/90 flex items-center justify-center z-50";
    progressModal.innerHTML = `
      <div class="bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
        <h3 class="text-xl font-bold text-white mb-2">Création ULTRA HD...</h3>
        <p class="text-gray-400 mb-4">
          <span id="progress-text">Préparation...</span>
        </p>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div id="progress-bar" class="bg-indigo-500 h-2 rounded-full transition-all" style="width: 0%"></div>
        </div>
        <p class="text-xs text-gray-500 mt-4">${recordedFrames.length} frames • Qualité maximale</p>
        <button id="cancel-export" class="mt-4 text-gray-400 hover:text-white text-sm underline">
          Annuler
        </button>
      </div>
    `;
    document.body.appendChild(progressModal);

    let cancelled = false;
    document.getElementById("cancel-export").addEventListener("click", () => {
      cancelled = true;
      document.body.removeChild(progressModal);
    });

    try {
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder non supporté");
      }

      document.getElementById("progress-text").textContent =
        "Initialisation du rendu HD...";

      const videoCanvas = document.createElement("canvas");
      const container = document.getElementById("canvas-container");

      videoCanvas.width = container.clientWidth;
      videoCanvas.height = container.clientHeight;

      const videoCtx = videoCanvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
      });

      videoCtx.fillStyle = "#111827";
      videoCtx.fillRect(0, 0, videoCanvas.width, videoCanvas.height);

      const stream = videoCanvas.captureStream(60);

      let mimeType = "video/webm;codecs=vp9";
      let bitrate = 10000000;

      if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
        mimeType = "video/webm;codecs=h264";
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: bitrate,
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (cancelled) return;

        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        const time = new Date()
          .toLocaleTimeString("fr-FR")
          .replace(/:/g, "-");
        a.href = url;
        a.download = `tissage-timelapse-${date}-${time}.webm`;
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        if (document.body.contains(progressModal)) {
          document.body.removeChild(progressModal);
        }

        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        const duration = (recordedFrames.length * 0.05).toFixed(1);
        alert(
          `✅ Time-lapse ULTRA HD exporté!\n\n` +
            `📦 Taille: ${sizeMB} MB\n` +
            `🎞️ ${recordedFrames.length} frames à 60 FPS\n` +
            `⏱️ Durée: ~${duration}s\n` +
            `📺 Résolution: ${videoCanvas.width}x${videoCanvas.height}px\n` +
            `✨ Qualité: Maximum (${(bitrate / 1000000).toFixed(0)} Mbps)`
        );

        recordedFrames = [];
      };

      mediaRecorder.start();

      const framesPerCapture = 2;

      for (let i = 0; i < recordedFrames.length; i++) {
        if (cancelled) {
          mediaRecorder.stop();
          return;
        }

        const img = new Image();
        img.src = recordedFrames[i];

        await new Promise((resolve, reject) => {
          img.onload = async () => {
            for (let repeat = 0; repeat < framesPerCapture; repeat++) {
              if (cancelled) break;

              videoCtx.fillStyle = "#111827";
              videoCtx.fillRect(0, 0, videoCanvas.width, videoCanvas.height);

              videoCtx.drawImage(img, 0, 0, videoCanvas.width, videoCanvas.height);

              await new Promise((r) => setTimeout(r, 17));
            }

            const progress = (((i + 1) / recordedFrames.length) * 100).toFixed(
              0
            );
            document.getElementById("progress-text").textContent =
              `Rendu HD ${i + 1}/${recordedFrames.length} (${progress}%)`;
            document.getElementById("progress-bar").style.width = `${progress}%`;

            resolve();
          };
          img.onerror = () => reject(new Error("Erreur chargement image"));
        });
      }

      document.getElementById("progress-text").textContent =
        "Finalisation de la vidéo ULTRA HD...";

      await new Promise((r) => setTimeout(r, 1000));
      mediaRecorder.stop();
    } catch (err) {
      console.error("❌ Erreur export vidéo:", err);

      if (document.body.contains(progressModal)) {
        document.body.removeChild(progressModal);
      }

      const retry = confirm(
        "❌ Erreur lors de la création de la vidéo.\n\n" +
          "Voulez-vous télécharger les images clés à la place ?"
      );

      if (retry) {
        await exportFramesAsImages();
      } else {
        alert("💾 Les frames restent en mémoire.");
      }
    }
  }

  async function exportFramesAsImages() {
    const exportModal = document.createElement("div");
    exportModal.className =
      "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4";
    exportModal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-2xl shadow-xl text-center max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">📸 Export d'images</h3>
        <p class="text-gray-300 text-sm mb-4">
          Choisissez les images à télécharger :
        </p>
        <div class="space-y-3">
          <button id="export-first" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition">
            📥 Première image
          </button>
          <button id="export-middle" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition">
            📥 Image du milieu
          </button>
          <button id="export-last" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition">
            📥 Dernière image
          </button>
          <button id="export-key-frames" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            📦 5 images clés
          </button>
        </div>
        <button id="close-export" class="mt-4 text-gray-400 hover:text-white text-sm">
          Fermer
        </button>
        <p class="text-xs text-gray-500 mt-3">${recordedFrames.length} frames disponibles</p>
      </div>
    `;
    document.body.appendChild(exportModal);

    const downloadImage = (index, name) => {
      const link = document.createElement("a");
      link.href = recordedFrames[index];
      link.download = `tissage-${name}.png`;
      link.click();
    };

    document.getElementById("export-first").addEventListener("click", () => {
      downloadImage(0, "01-debut");
      alert("✅ Première image téléchargée");
    });

    document.getElementById("export-middle").addEventListener("click", () => {
      const mid = Math.floor(recordedFrames.length / 2);
      downloadImage(mid, "02-milieu");
      alert("✅ Image du milieu téléchargée");
    });

    document.getElementById("export-last").addEventListener("click", () => {
      downloadImage(recordedFrames.length - 1, "03-fin");
      alert("✅ Dernière image téléchargée");
    });

    document
      .getElementById("export-key-frames")
      .addEventListener("click", () => {
        const indices = [
          0,
          Math.floor(recordedFrames.length * 0.25),
          Math.floor(recordedFrames.length * 0.5),
          Math.floor(recordedFrames.length * 0.75),
          recordedFrames.length - 1,
        ];

        indices.forEach((idx, i) => {
          setTimeout(() => downloadImage(idx, `frame-${i + 1}`), i * 100);
        });

        alert("✅ 5 images clés téléchargées");
      });

    document.getElementById("close-export").addEventListener("click", () => {
      document.body.removeChild(exportModal);
    });
  }

  // ==================== ZOOM ET PAN ====================
  function setupZoomAndPan() {
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(0.5, scale * delta), 5);
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
      offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
      scale = newScale;
      scheduleRedraw();
    });

    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      } else if (e.touches.length === 1 && !isPinching) {
        isDragging = true;
        startX = e.touches[0].clientX - offsetX;
        startY = e.touches[0].clientY - offsetY;
      }
    });

    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        if (lastTouchDistance > 0) {
          const delta = dist / lastTouchDistance;
          const newScale = Math.min(Math.max(0.5, scale * delta), 5);
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;
          const rect = canvas.getBoundingClientRect();
          const canvasCenterX = centerX - rect.left;
          const canvasCenterY = centerY - rect.top;
          offsetX =
            canvasCenterX - (canvasCenterX - offsetX) * (newScale / scale);
          offsetY =
            canvasCenterY - (canvasCenterY - offsetY) * (newScale / scale);
          scale = newScale;
          scheduleRedraw();
        }
        lastTouchDistance = dist;
      } else if (isDragging && e.touches.length === 1 && !isPinching) {
        e.preventDefault();
        offsetX = e.touches[0].clientX - startX;
        offsetY = e.touches[0].clientY - startY;
        scheduleRedraw();
      }
    });

    canvas.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
        lastTouchDistance = 0;
      }
      if (e.touches.length === 0) {
        isDragging = false;
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
      canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        scheduleRedraw();
      }
    });

    canvas.addEventListener("mouseup", () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("mouseleave", () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    let lastTap = 0;
    canvas.addEventListener("touchend", (e) => {
      if (e.touches.length === 0 && !isPinching) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          scale = 1;
          offsetX = 0;
          offsetY = 0;
          scheduleRedraw();
        }
        lastTap = currentTime;
      }
    });

    canvas.addEventListener("dblclick", () => {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      scheduleRedraw();
    });
  }

// ==================== MODE PLEIN ÉCRAN ====================
function setupFullscreen() {
  const fullscreenButton = document.getElementById("fullscreen-button");

  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Erreur plein écran:", err);
        });
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const icon = fullscreenButton.querySelector("svg");
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const wordsPanel = document.getElementById("words-panel");
      const canvasContainer = document.getElementById("canvas-container");
      
      if (document.fullscreenElement) {
        // 🎨 MODE IMMERSIF : On cache tout sauf le canvas
        header.style.display = "none";
        footer.style.display = "none";
        wordsPanel.style.display = "none";
        
        // Le canvas prend tout l'écran
        canvasContainer.style.width = "100%";
        canvasContainer.style.height = "100vh";
        
        // Icône "Quitter"
        icon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
        `;
        fullscreenButton.title = "Quitter le plein écran (Échap)";
        
        // Redimensionner le canvas après l'application des styles
        setTimeout(() => {
          resizeCanvas();
        }, 100);
        
      } else {
        // 🔙 RETOUR NORMAL : On réaffiche tout
        header.style.display = "";
        footer.style.display = "";
        wordsPanel.style.display = "";
        canvasContainer.style.width = "";
        canvasContainer.style.height = "";
        
        // Icône "Plein écran"
        icon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        `;
        fullscreenButton.title = "Plein écran";
        
        // Redimensionner le canvas après le retour
        setTimeout(() => {
          resizeCanvas();
        }, 100);
      }
    });
  }
}

  // ==================== EVENT LISTENERS ====================
  wordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = wordInput.value.trim();
    if (!text) return;

    console.log("Tentative d'ajout de mot:", text);

    if (isForbidden(text)) {
      wordInput.value = "";
      wordInput.placeholder = "⚠️ Mot inapproprié";
      wordInput.classList.add("border-2", "border-red-500");

      setTimeout(() => {
        wordInput.placeholder = "Partagez un mot...";
        wordInput.classList.remove("border-2", "border-red-500");
      }, 2500);

      return;
    }

    if (!canUserAddWord()) {
      const count = getUserWordCount();
      console.log("Limite atteinte:", count);
      alert(
        `❌ Vous avez atteint la limite de ${CONFIG.MAX_WORDS_PER_USER} mots par participant.\n\nLaissez la place aux autres ! 😊`
      );
      wordInput.value = "";
      return;
    }

    const submitButton = wordForm.querySelector("button");
    const originalPlaceholder = wordInput.placeholder;
    wordInput.disabled = true;
    submitButton.disabled = true;
    submitButton.textContent = "...";

    const existingWord = findExistingWord(text);

    let newWordPayload;

    if (existingWord) {
      console.log("Mot existant trouvé");
      newWordPayload = {
        text : existingWord.text,
        x: existingWord.x,
        y: existingWord.y,
        color: existingWord.color,
        radius: existingWord.radius,
      };
    } else {
      const newColor = colorGenerator.getColor();
      const position = findValidPosition();

      if (!position) {
        alert(
          "❌ Canvas saturé - Impossible d'ajouter plus de mots pour le moment"
        );
        wordInput.disabled = false;
        submitButton.disabled = false;
        submitButton.textContent = "Tisser";
        wordInput.value = "";
        return;
      }

      newWordPayload = {
        text,
        x: position.x,
        y: position.y,
        color: newColor,
      };
    }

    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWordPayload),
      });

      if (!response.ok || response.status !== 201) {
        let errorMsg = `Erreur serveur (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (err) {}
        throw new Error(errorMsg);
      }

      incrementUserWordCount();
      console.log("Mot ajouté avec succès");

      wordInput.value = "";
      submitButton.textContent = "✓";

      const remaining = CONFIG.MAX_WORDS_PER_USER - getUserWordCount();
      console.log("Mots restants:", remaining);

      if (remaining > 0) {
        wordInput.placeholder = `${remaining} mot${remaining > 1 ? "s" : ""} restant${
          remaining > 1 ? "s" : ""
        }...`;
      } else {
        wordInput.placeholder = "Limite atteinte (5 mots max)";
      }

      setTimeout(() => {
        submitButton.textContent = "Tisser";
        if (remaining === 0) {
          wordInput.disabled = true;
          submitButton.disabled = true;
        }
      }, 800);

      await fetchWords();
    } catch (error) {
      console.error("Erreur d'ajout:", error);
      wordInput.placeholder = error.message;
      setTimeout(() => {
        wordInput.placeholder = originalPlaceholder;
      }, 3000);
      wordInput.value = "";
    } finally {
      if (getUserWordCount() < CONFIG.MAX_WORDS_PER_USER) {
        wordInput.disabled = false;
        submitButton.disabled = false;
        wordInput.focus();
      }
    }
  });

  // Stats button
  const statsButton = document.getElementById("stats-button");
  const statsPanel = document.getElementById("stats-panel");
  const closeStatsButton = document.getElementById("close-stats-button");

  statsButton.addEventListener("click", () => {
    statsPanel.classList.toggle("hidden");
    if (!statsPanel.classList.contains("hidden")) {
      updateStats();
    }
  });

  closeStatsButton.addEventListener("click", () => {
    statsPanel.classList.add("hidden");
  });

  // Settings modal
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsButton = document.getElementById("close-settings-button");

  settingsButton.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });

  closeSettingsButton.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });

  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add("hidden");
    }
  });

  // Link mode selector
  const linkModeSelect = document.getElementById("link-mode-select");
  const modeDescription = document.getElementById("mode-description");

  if (linkModeSelect && modeDescription) {
    linkModeSelect.addEventListener("change", (e) => {
      settings.linkMode = e.target.value;

      const description = MODE_DESCRIPTIONS[e.target.value];

      modeDescription.innerHTML = `
        <div class="font-medium mb-1">${description}</div>
      `;

      geometryCache.clear();
      scheduleRedraw();
    });
  }

  // Slider opacité des traits
document.getElementById("lines-opacity").addEventListener("input", (e) => {
  settings.linesOpacity = parseFloat(e.target.value) / 100;
  document.getElementById("lines-opacity-value").textContent = e.target.value + "%";
  scheduleRedraw();
});

// Slider taille globale
document.getElementById("global-scale").addEventListener("input", (e) => {
  settings.globalScale = parseFloat(e.target.value) / 100;
  document.getElementById("global-scale-value").textContent = e.target.value + "%";
  scheduleRedraw();
});
// ==================== GESTION DES COULEURS ====================
  
  // 1. Changement de Mode (Aléatoire vs Personnalisé)
  document.querySelectorAll('input[name="color-mode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const customPicker = document.getElementById("custom-color-picker");
      
      if (e.target.value === "custom") {
        // Activation du mode Custom
        customPicker.classList.remove("hidden");
        colorGenerator.setMode("custom");
        
        const customColor = document.getElementById("color-picker-input").value;
        
        // Mettre à jour les données
        displayedWords.forEach(word => word.color = customColor);
        
        // Mettre à jour le visuel
        scheduleRedraw();
        updateWordListColors(customColor); // 🔥 On force la couleur sur la liste
        
      } else {
        // Retour au mode Aléatoire
        customPicker.classList.add("hidden");
        colorGenerator.setMode("auto");
        
        // Régénérer les couleurs
        displayedWords.forEach(word => word.color = colorGenerator.getColor());
        
        colorsShuffled = false;
        geometryCache.clear();
        
        // Mettre à jour le visuel
        scheduleRedraw();
        updateWordListColors(); // 🔥 On laisse la fonction chercher les couleurs aléatoires
      }
    });
  });

  // 2. Sélecteur de couleur (Input)
  const colorPickerInput = document.getElementById("color-picker-input");
  const colorHexInput = document.getElementById("color-hex-input");
  const colorPreview = document.getElementById("color-preview");

  if (colorPickerInput && colorHexInput && colorPreview) {
    
    const applyCustomColor = (color) => {
      colorGenerator.setCustomColor(color);
      
      // Si on est en mode custom, on applique partout immédiatement
      const isCustomMode = document.querySelector('input[name="color-mode"]:checked').value === "custom";
      
      if (isCustomMode) {
        // 1. Mettre à jour les données
        displayedWords.forEach(word => word.color = color);
        
        // 2. Redessiner le canvas
        scheduleRedraw();
        
        // 3. Mettre à jour la liste (C'EST ICI QUE ÇA SE JOUE)
        updateWordListColors(color);
      }
    };

    // Événement quand on bouge le sélecteur
    colorPickerInput.addEventListener("input", (e) => {
      const color = e.target.value;
      colorHexInput.value = color;
      colorPreview.style.background = color;
      applyCustomColor(color);
    });

    // Événement quand on tape le code HEX
    colorHexInput.addEventListener("input", (e) => {
      let color = e.target.value.trim();
      if (color && !color.startsWith("#")) color = "#" + color;
      
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        colorPickerInput.value = color;
        colorPreview.style.background = color;
        applyCustomColor(color);
      }
    });
  }
  
  // Other toggles
  document
    .getElementById("show-words-toggle")
    .addEventListener("change", (e) => {
      settings.showWords = e.target.checked;
      scheduleRedraw();
    });

  document
    .getElementById("animate-lines-toggle")
    .addEventListener("change", (e) => {
      settings.animateLines = e.target.checked;
    });

  document
    .getElementById("resonance-toggle")
    .addEventListener("change", (e) => {
      settings.enableResonance = e.target.checked;
      scheduleRedraw();
    });

  document
    .getElementById("show-timestamp-toggle")
    .addEventListener("change", (e) => {
      settings.showTimestamp = e.target.checked;
      wordsList.innerHTML = "";
      updateWordList(displayedWords);
    });

  document.getElementById("gradient-toggle").addEventListener("change", (e) => {
    settings.useGradient = e.target.checked;
    scheduleRedraw();
  });

  document
    .getElementById("particles-toggle")
    .addEventListener("change", (e) => {
      settings.enableParticles = e.target.checked;
      if (!e.target.checked) {
        particles.forEach((p) => recycleParticle(p));
        particles = [];
      }
    });

  document.getElementById("line-width").addEventListener("input", (e) => {
    settings.lineWidth = parseFloat(e.target.value);
    document.getElementById("line-width-value").textContent = e.target.value;
    scheduleRedraw();
  });

  // Panel toggle
  togglePanelButton.addEventListener("click", () => {
    mainContainer.classList.toggle("panel-hidden");
    setTimeout(() => resizeCanvas(), 350);
  });

  // Download button
  downloadButton.addEventListener("click", () => {
    const oldScale = scale;
    const oldOffsetX = offsetX;
    const oldOffsetY = offsetY;
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    resizeCanvas();
    drawWeave(true);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    link.download = `tissage-bailleul-babiole-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    scale = oldScale;
    offsetX = oldOffsetX;
    offsetY = oldOffsetY;
    drawWeave(false);
  });

  // Recording buttons
  const recordButton = document.getElementById("record-button");
  const stopRecordButton = document.getElementById("stop-record-button");

  if (recordButton) {
    recordButton.addEventListener("click", () => {
      if (!isRecording) {
        startRecording();
      }
    });
  }

  if (stopRecordButton) {
    stopRecordButton.addEventListener("click", () => {
      if (isRecording) {
        stopRecording();
      }
    });
  }

// Shuffle colors
document.getElementById("shuffle-colors-button")?.addEventListener("click", () => {
  const existingColors = displayedWords.map(w => w.color);
  
  for (let i = existingColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [existingColors[i], existingColors[j]] = [existingColors[j], existingColors[i]];
  }
  
  displayedWords.forEach((word, i) => {
    word.color = existingColors[i];
  });
  
  colorsShuffled = true; // 🔥 ACTIVER LE FLAG
  
  wordOccurrencesCache.clear();
  geometryCache.clear();
  scheduleRedraw();
  updateWordList(displayedWords);
  updateStats();
  
  const btn = document.getElementById("shuffle-colors-button");
  btn.style.transform = "rotate(360deg)";
  btn.style.transition = "transform 0.6s ease";
  setTimeout(() => { btn.style.transform = ""; }, 600);
});

// Shuffle positions
document.getElementById("shuffle-positions-button")?.addEventListener("click", () => {
  // 1. Identifier les mots uniques (1 seul par texte)
  const uniqueWordsMap = new Map();
  displayedWords.forEach(word => {
    const key = word.text.toLowerCase();
    if (!uniqueWordsMap.has(key)) {
      uniqueWordsMap.set(key, word); // On garde le premier trouvé
    }
  });

  const uniqueWords = Array.from(uniqueWordsMap.values());
  
  // 2. Récupérer leurs positions actuelles
  const positions = uniqueWords.map(w => ({ x: w.x, y: w.y }));
  
  // 3. Mélanger les positions (Fisher-Yates)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // 4. Réassigner les nouvelles positions aux mots uniques
  uniqueWords.forEach((word, i) => {
    word.x = positions[i].x;
    word.y = positions[i].y;
  });

  // 5. Propager ces positions à TOUS les doublons dans displayedWords
  displayedWords.forEach(word => {
    const key = word.text.toLowerCase();
    const uniqueWord = uniqueWordsMap.get(key);
    if (uniqueWord) {
      word.x = uniqueWord.x;
      word.y = uniqueWord.y;
    }
  });
  
  positionsShuffled = true;
  
  wordOccurrencesCache.clear();
  geometryCache.clear();
  scheduleRedraw();
  
  const btn = document.getElementById("shuffle-positions-button");
  btn.style.transform = "scale(1.2) rotate(180deg)";
  btn.style.transition = "transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
  setTimeout(() => { btn.style.transform = ""; }, 500);
});

  // Reset button
  resetButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const passwordModal = document.createElement("div");
    passwordModal.id = "password-reset-modal";
    passwordModal.className =
      "fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4";
    passwordModal.style.zIndex = "100";

    passwordModal.innerHTML = `
      <div class="bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
        <h3 class="text-xl font-bold text-white mb-4">🔒 Accès Protégé</h3>
        <p class="text-gray-300 text-sm mb-4">Entrez le mot de passe pour réinitialiser le tissage :</p>
        <input type="password" id="reset-password-input" 
          class="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-600"
          placeholder="Mot de passe..."
          autocomplete="off">
        <div class="flex gap-2">
          <button type="button" id="cancel-reset" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition">
            Annuler
          </button>
          <button type="button" id="confirm-reset" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
            Réinitialiser
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3 text-center">Action irréversible - Tous les mots seront supprimés</p>
      </div>
    `;

    document.body.appendChild(passwordModal);

    const passwordInput = document.getElementById("reset-password-input");
    const confirmBtn = document.getElementById("confirm-reset");
    const cancelBtn = document.getElementById("cancel-reset");

    setTimeout(() => passwordInput.focus(), 100);

    const closeModal = () => {
      if (document.body.contains(passwordModal)) {
        document.body.removeChild(passwordModal);
      }
    };

    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    passwordModal.addEventListener("click", (e) => {
      if (e.target === passwordModal) {
        closeModal();
      }
    });

    const attemptReset = async () => {
      const enteredPassword = passwordInput.value.trim();

      if (enteredPassword === CONFIG.RESET_PASSWORD) {
        closeModal();

        try {
          await fetch("/api/words", { method: "DELETE" });

          displayedWords = [];
          wordsList.innerHTML = "";
          particles.forEach((p) => recycleParticle(p));
          particles = [];
          currentAnimatingConnection = null;
          animationProgress = 0;
          scale = 1;
          offsetX = 0;
          offsetY = 0;
          wordOccurrencesCache.clear();
          geometryCache.clear();

          resetUserCounter();
          localStorage.setItem("lastResetTime", Date.now().toString());

          wordInput.disabled = false;
          wordInput.value = "";
          wordInput.placeholder = "Partagez un mot...";
          const submitButton = wordForm.querySelector("button");
          submitButton.disabled = false;
          submitButton.textContent = "Tisser";

          scheduleRedraw();
          updateStats();

          const confirmDiv = document.createElement("div");
          confirmDiv.className =
            "fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce";
          confirmDiv.textContent =
            "✓ Tissage réinitialisé - Tous les compteurs remis à zéro";
          document.body.appendChild(confirmDiv);

          setTimeout(() => {
            if (document.body.contains(confirmDiv)) {
              document.body.removeChild(confirmDiv);
            }
          }, 3000);

          console.log("✅ Reset complet effectué");
        } catch (err) {
          console.error("Erreur reset:", err);
          alert("❌ La réinitialisation a échoué");
        }
      } else {
        passwordInput.value = "";
        passwordInput.placeholder = "❌ Mot de passe incorrect";
        passwordInput.classList.add("border-2", "border-red-500");
        setTimeout(() => {
          passwordInput.placeholder = "Mot de passe...";
          passwordInput.classList.remove("border-2", "border-red-500");
        }, 2000);
      }
    };

    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      attemptReset();
    });

    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        attemptReset();
      }
    });
  });

  // QR Code modal
  const qrButton = document.getElementById("qr-code-button");
  const qrModal = document.getElementById("qr-modal");
  const closeModalButton = document.getElementById("close-modal-button");

  function showQrCode() {
    const qr = qrcode(0, "L");
    qr.addData(window.location.href);
    qr.make();
    document.getElementById("qrcode-display").innerHTML = qr.createImgTag(
      6,
      8
    );
    qrModal.classList.remove("hidden");
  }

  function hideQrCode() {
    qrModal.classList.add("hidden");
  }

  qrButton.addEventListener("click", showQrCode);
  closeModalButton.addEventListener("click", hideQrCode);
  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) hideQrCode();
  });

  // ==================== INITIALISATION ====================
  setupZoomAndPan();
  setupWordFilter();
  setupFullscreen();
  canvas.style.cursor = "grab";

  const debouncedResize = debounce(resizeCanvas, 150);
  window.addEventListener("resize", debouncedResize);

  resizeCanvas();
  setInterval(fetchWords, CONFIG.FETCH_INTERVAL);
  fetchWords();
  animateWeaving();

  const remaining = CONFIG.MAX_WORDS_PER_USER - getUserWordCount();
  console.log("Compteur initial:", getUserWordCount(), "/ Restants:", remaining);

  if (remaining === 0) {
    wordInput.placeholder = "Limite atteinte (5 mots max)";
    wordInput.disabled = true;
    wordForm.querySelector("button").disabled = true;
  } else if (remaining < CONFIG.MAX_WORDS_PER_USER) {
    wordInput.placeholder = `${remaining} mot${remaining > 1 ? "s" : ""} restant${
      remaining > 1 ? "s" : ""
    }...`;
  }
});