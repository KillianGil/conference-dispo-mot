// ==================== CONFIGURATION ====================
const CONFIG = {
  MAX_WORDS_PER_USER: 5000,
  RESET_PASSWORD: "tissage2025",
  TARGET_FPS: 60,
  MAX_POOL_SIZE: 100,
  FETCH_INTERVAL: 2000,
};

// Liste de mots interdits
const FORBIDDEN_WORDS = [
  // Insultes
  "merde",
  "con",
  "connard",
  "connasse",
  "salaud",
  "salope",
  "pute",
  "enculé",
  "batard",
  "fdp",
  "ntm",
  // Grossièretés
  "sexe",
  "penis",
  "vagin",
  "cul",
  "bite",
  "couille",
  "chatte",
  // Injures
  "nazi",
  "facho",
  "terroriste",
  "raciste",
  // Variantes
  "pd",
  "tapette",
  "salop",
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
  flow: "Animation fluide chronologique avec effet de flux",
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
  console.log(`Peut ajouter ? ${canAdd} (${count}/${CONFIG.MAX_WORDS_PER_USER})`);
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
const colorGenerator = {
  mode: "auto",
  customColor: "#6366f1",

  getColor: function () {
    if (this.mode === "custom") {
      return this.customColor;
    }
    const hue = Math.random() * 360;
    const saturation = 65 + Math.random() * 30;
    const lightness = 45 + Math.random() * 25;
    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  },

  setCustomColor: function (color) {
    this.customColor = color;
  },

  setMode: function (mode) {
    this.mode = mode;
  },
};

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

  const wordOccurrencesCache = new Map();
  const geometryCache = new Map();
  const particlePool = [];

  let settings = {
    linkMode: "chronological",
    showWords: true,
    animateLines: true,
    lineWidth: 2,
    enableResonance: false,
    showTimestamp: true,
    useGradient: true,
    enableParticles: true,
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
      const timeSinceReset = lastReset ? Date.now() - parseInt(lastReset) : Infinity;

      if (words.length === 0 || (getUserWordCount() >= 5 && timeSinceReset > 300000)) {
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
    if (!container) return 0.225;

    const uniqueCount = new Set(displayedWords.map((w) => w.text.toLowerCase())).size;
    const isMobile = window.innerWidth < 768;

    let baseDistance = isMobile ? 0.18 : 0.225;

    if (uniqueCount > 100) baseDistance = isMobile ? 0.12 : 0.15;
    else if (uniqueCount > 80) baseDistance = isMobile ? 0.135 : 0.165;
    else if (uniqueCount > 60) baseDistance = isMobile ? 0.15 : 0.18;
    else if (uniqueCount > 40) baseDistance = isMobile ? 0.165 : 0.195;
    else if (uniqueCount > 20) baseDistance = isMobile ? 0.18 : 0.21;

    const adaptiveDistance = Math.max(isMobile ? 0.105 : 0.135, baseDistance);
    return Math.min(0.45, adaptiveDistance);
  }

  function getPointRadius(occurrences) {
    const isMobile = window.innerWidth < 768;
    const baseSize = isMobile ? 14 : 16;
    return baseSize + (occurrences - 1) * 4;
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
        const occurrences = displayedWords.filter((w) => w.text.toLowerCase() === key).length;
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
    const container = document.getElementById("canvas-container");
    if (!container) return true;

    const margin = 0.08;
    if (x < margin || x > 1 - margin || y < margin || y > 1 - margin) {
      return false;
    }

    const uniquePositions = getUniqueWordPositions();
    const newMaxSize = getMaxPointSize(1);

    for (const pos of uniquePositions) {
      const dx = pos.x - x;
      const dy = pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const avgScreenSize = (container.clientWidth + container.clientHeight) / 2;
      const pointSizePercent = (pos.maxSize + newMaxSize) / avgScreenSize;

      const requiredDist = minDist + pointSizePercent * 0.5;

      if (dist < requiredDist) {
        return false;
      }
    }

    return true;
  }

  function findValidPosition() {
    const container = document.getElementById("canvas-container");
    if (!container) return { x: 0.5, y: 0.5 };

    const minDist = getAdaptiveMinDistance();

    for (let i = 0; i < 150; i++) {
      const x = 0.1 + Math.random() * 0.8;
      const y = 0.1 + Math.random() * 0.8;
      if (isPositionValid(x, y, minDist)) {
        return { x, y };
      }
    }

    const centerX = 0.5;
    const centerY = 0.5;
    const maxRadius = 0.48;
    const radiusStep = minDist * 0.6;

    for (let radius = radiusStep; radius < maxRadius; radius += radiusStep) {
      const numPoints = Math.max(20, Math.floor((2 * Math.PI * radius) / (radiusStep * 0.3)));
      const angleStep = (2 * Math.PI) / numPoints;

      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep + Math.random() * 0.6;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (x >= 0.08 && x <= 0.92 && y >= 0.08 && y <= 0.92) {
          if (isPositionValid(x, y, minDist)) {
            return { x, y };
          }
        }
      }
    }

    for (let i = 0; i < 120; i++) {
      const x = 0.1 + Math.random() * 0.8;
      const y = 0.1 + Math.random() * 0.8;
      if (isPositionValid(x, y, minDist * 0.75)) {
        return { x, y };
      }
    }

    for (let i = 0; i < 120; i++) {
      const x = 0.12 + Math.random() * 0.76;
      const y = 0.12 + Math.random() * 0.76;
      if (isPositionValid(x, y, minDist * 0.5)) {
        return { x, y };
      }
    }

    for (let i = 0; i < 120; i++) {
      const x = 0.12 + Math.random() * 0.76;
      const y = 0.12 + Math.random() * 0.76;
      if (isPositionValid(x, y, minDist * 0.3)) {
        return { x, y };
      }
    }

    const step = minDist * 0.7;
    for (let gridY = 0.15; gridY <= 0.85; gridY += step) {
      for (let gridX = 0.15; gridX <= 0.85; gridX += step) {
        const jitterX = (Math.random() - 0.5) * step * 0.4;
        const jitterY = (Math.random() - 0.5) * step * 0.4;
        const x = Math.max(0.12, Math.min(0.88, gridX + jitterX));
        const y = Math.max(0.12, Math.min(0.88, gridY + jitterY));

        if (isPositionValid(x, y, minDist * 0.2)) {
          return { x, y };
        }
      }
    }

    console.warn("⚠️ Mode sans contrainte activé");
    for (let i = 0; i < 250; i++) {
      const x = 0.15 + Math.random() * 0.7;
      const y = 0.15 + Math.random() * 0.7;

      if (x >= 0.15 && x <= 0.85 && y >= 0.15 && y <= 0.85) {
        return { x, y };
      }
    }

    const zones = [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.2 },
      { x: 0.2, y: 0.8 },
      { x: 0.8, y: 0.8 },
      { x: 0.5, y: 0.2 },
      { x: 0.5, y: 0.8 },
      { x: 0.2, y: 0.5 },
      { x: 0.8, y: 0.5 },
      { x: 0.35, y: 0.35 },
      { x: 0.65, y: 0.35 },
      { x: 0.35, y: 0.65 },
      { x: 0.65, y: 0.65 },
      { x: 0.5, y: 0.5 },
    ];

    for (const zone of zones) {
      const x = zone.x + (Math.random() - 0.5) * 0.15;
      const y = zone.y + (Math.random() - 0.5) * 0.15;

      if (x >= 0.15 && x <= 0.85 && y >= 0.15 && y <= 0.85) {
        return { x, y };
      }
    }

    const fallbackX = 0.5 + (Math.random() - 0.5) * 0.4;
    const fallbackY = 0.5 + (Math.random() - 0.5) * 0.4;

    return {
      x: Math.max(0.2, Math.min(0.8, fallbackX)),
      y: Math.max(0.2, Math.min(0.8, fallbackY)),
    };
  }

  function findExistingWord(text) {
    return displayedWords.find((w) => w.text.toLowerCase() === text.toLowerCase());
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
    const margin = 100;

    return x > -margin && x < width + margin && y > -margin && y < height + margin;
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
        const resonant = words.filter((w) => w !== word && hasResonance(word, w));

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

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    console.log(`📐 Canvas: ${width}x${height}px (DPR: ${dpr}x = ${canvas.width}x${canvas.height}px)`);

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
  function drawWeave(withBackground = false) {
    if (!canDraw) return;

    const container = document.getElementById("canvas-container");
    if (!container) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) {
      console.warn("⚠️ Canvas dimensions invalides");
      return;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (withBackground) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (displayedWords.length === 0) {
      ctx.restore();
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Filtrer les mots visibles pour optimisation
    const visibleWords = displayedWords.filter((w) =>
      isVisible(w, scale, offsetX, offsetY, width, height)
    );

    const connections = calculateConnections(settings.linkMode, displayedWords, width, height);

    // ==================== MODES SPÉCIAUX ====================
    if (settings.linkMode === "constellation") {
      const time = Date.now() * 0.001;
      visibleWords.forEach((word) => {
        const x = word.x * width;
        const y = word.y * height;
        const twinkle = Math.abs(Math.sin(time * 2 + word.timestamp * 0.001));

        for (let i = 0; i < 3; i++) {
          const angle = (time + (i * Math.PI * 2) / 3) * 0.5;
          const radius = 30 + Math.sin(time + i) * 10;
          const starX = x + Math.cos(angle) * radius;
          const starY = y + Math.sin(angle) * radius;

          ctx.beginPath();
          ctx.arc(starX, starY, 2, 0, Math.PI * 2);
          ctx.fillStyle = word.color;
          ctx.globalAlpha = twinkle * 0.6;
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    if (settings.linkMode === "waves") {
      connections.forEach(([word1, word2]) => {
        const x1 = word1.x * width;
        const y1 = word1.y * height;
        const x2 = word2.x * width;
        const y2 = word2.y * height;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offset = Math.sin(Date.now() * 0.002) * 50;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = (-dy / len) * offset;
        const perpY = (dx / len) * offset;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

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

        ctx.lineWidth = Math.max(2.5, settings.lineWidth * 1.2);
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.restore();
      });
    } else if (settings.linkMode === "ripple") {
      const time = Date.now() * 0.001;

      visibleWords.forEach((word, index) => {
        const x = word.x * width;
        const y = word.y * height;

        for (let ring = 0; ring < 3; ring++) {
          const phase = (time * 2 + index * 0.5 + ring * 0.8) % 4;
          const radius = 30 + phase * 40;
          const opacity = Math.max(0, 1 - phase / 4);

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = word.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = opacity * 0.4;
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      connections.forEach(([word1, word2]) => {
        const x1 = word1.x * width;
        const y1 = word1.y * height;
        const x2 = word2.x * width;
        const y2 = word2.y * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = word2.color;
        ctx.lineWidth = Math.max(2, settings.lineWidth * 0.9);
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    } else if (settings.linkMode === "spiral") {
      const time = Date.now() * 0.0005;
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
        ctx.shadowColor = word.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(spiralX, spiralY);

        const gradient = ctx.createLinearGradient(x, y, spiralX, spiralY);
        gradient.addColorStop(0, word.color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(2, settings.lineWidth * 0.8);
        ctx.globalAlpha = 0.75;
        ctx.stroke();
        ctx.restore();
      });
    } else if (settings.linkMode === "web") {
      displayedWords.forEach((word) => {
        const neighbors = displayedWords
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4);

        neighbors.forEach(({ word: neighbor, dist }) => {
          const x1 = word.x * width;
          const y1 = word.y * height;
          const x2 = neighbor.x * width;
          const y2 = neighbor.y * height;

          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 4;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);

          const opacity = Math.max(0.25, 1 - dist / 0.5);

          if (settings.useGradient) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, word.color);
            gradient.addColorStop(1, neighbor.color);
            ctx.strokeStyle = gradient;
          } else {
            ctx.strokeStyle = word.color;
          }

          ctx.globalAlpha = opacity * 0.5;
          ctx.lineWidth = Math.max(2, settings.lineWidth * 0.9);
          ctx.stroke();
          ctx.restore();
        });
      });
      ctx.globalAlpha = 1;
    } else if (settings.linkMode === "pulse") {
      const time = Date.now() * 0.001;

      connections.forEach(([word1, word2], idx) => {
        const x1 = word1.x * width;
        const y1 = word1.y * height;
        const x2 = word2.x * width;
        const y2 = word2.y * height;

        const pulse = Math.abs(Math.sin(time * 3 - idx * 0.3));

        ctx.save();
        ctx.shadowColor = word2.color;
        ctx.shadowBlur = 12 * pulse;

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

        ctx.lineWidth = Math.max(2.5, settings.lineWidth * 1.0 + pulse * 2);
        ctx.globalAlpha = 0.7 + pulse * 0.2;
        ctx.stroke();
        ctx.restore();

        const travelProgress = (time * 0.5 + idx * 0.2) % 1;
        const travelX = x1 + (x2 - x1) * travelProgress;
        const travelY = y1 + (y2 - y1) * travelProgress;

        ctx.beginPath();
        ctx.arc(travelX, travelY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 12;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (settings.linkMode === "basket") {
      const time = Date.now() * 0.0003;
      const gridSize = Math.max(40, settings.weavingDensity || 60);

      for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
          const cellCenterX = x + gridSize / 2;
          const cellCenterY = y + gridSize / 2;

          let closestWord = displayedWords[0];
          let minDist = Infinity;

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
            ctx.globalAlpha = 0.7 + elevation * 0.2;
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 5 * elevation;
            ctx.shadowOffsetY = 3 * elevation;

            for (let i = 0; i < 3; i++) {
              const bandY = y + i * (gridSize / 3);
              ctx.fillRect(x, bandY, gridSize, gridSize / 4);
            }
          } else {
            ctx.fillStyle = closestWord.color;
            ctx.globalAlpha = 0.5 + elevation * 0.2;
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

      ctx.globalAlpha = 1;
    } else if (settings.linkMode === "flow") {
      const time = Date.now() * 0.0008;
      const sortedWords = [...displayedWords].sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 1; i < sortedWords.length; i++) {
        const word1 = sortedWords[i - 1];
        const word2 = sortedWords[i];

        const x1 = word1.x * width;
        const y1 = word1.y * height;
        const x2 = word2.x * width;
        const y2 = word2.y * height;

        const flowProgress = (time + i * 0.1) % 2;
        const flowIntensity = Math.sin(flowProgress * Math.PI);

        ctx.save();
        ctx.shadowColor = word2.color;
        ctx.shadowBlur = 15 * flowIntensity;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const controlOffset = 30 * Math.sin(time * 2 + i);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX + controlOffset, midY - controlOffset, x2, y2);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(flowProgress / 2, "white");
        gradient.addColorStop(1, word2.color);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(2, settings.lineWidth * (1 + flowIntensity * 0.5));
        ctx.globalAlpha = 0.7 + flowIntensity * 0.2;
        ctx.stroke();
        ctx.restore();

        const particleX = x1 + (x2 - x1) * (flowProgress / 2);
        const particleY = y1 + (y2 - y1) * (flowProgress / 2);

        ctx.beginPath();
        ctx.arc(particleX, particleY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.shadowBlur = 20;
        ctx.shadowColor = word2.color;
        ctx.fill();
      }
    } else {
      // Mode standard
      connections.forEach(([word1, word2]) => {
        if (
          typeof word1.x !== "number" ||
          typeof word1.y !== "number" ||
          typeof word2.x !== "number" ||
          typeof word2.y !== "number" ||
          isNaN(word1.x) ||
          isNaN(word1.y) ||
          isNaN(word2.x) ||
          isNaN(word2.y)
        )
          return;

        let progress = 1;

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

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.globalAlpha = 0.9;
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

        ctx.lineWidth = Math.max(2.5, settings.lineWidth * 1.2);
        ctx.stroke();
        ctx.restore();

        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
        ctx.lineWidth = Math.max(4, settings.lineWidth * 1.5);
        ctx.stroke();
      });
    }

    // ==================== PARTICULES ====================
    const wordOccurrences = getWordOccurrences();

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
    const time = Date.now() * 0.001;

    const uniqueDisplayMap = new Map();
    visibleWords.forEach((word) => {
      const key = word.text.toLowerCase();
      if (!uniqueDisplayMap.has(key)) {
        uniqueDisplayMap.set(key, word);
      }
    });

    const sortedForDisplay = Array.from(uniqueDisplayMap.values()).sort((a, b) => {
      const countA = wordOccurrences[a.text.toLowerCase()];
      const countB = wordOccurrences[b.text.toLowerCase()];
      return countA - countB;
    });

    // ==================== DESSIN DES POINTS ====================
    sortedForDisplay.forEach((word) => {
      const occurrences = wordOccurrences[word.text.toLowerCase()];
      const pointSize = getPointRadius(occurrences);

      const isHighlighted = word.highlighted || false;
      const highlightBonus = isHighlighted ? 6 : 0;
      const finalPointSize = pointSize + highlightBonus;

      const wobbleX = Math.sin(time * 2 + word.timestamp * 0.001) * 3;
      const wobbleY = Math.cos(time * 1.5 + word.timestamp * 0.001) * 3;
      const x = word.x * width + wobbleX;
      const y = word.y * height + wobbleY;

      if (settings.enableParticles && Math.random() < 0.06) {
        particles.push(getParticle(x, y, word.color));
      }

      const pulseFactor = isHighlighted ? 6 : 4;
      const pulseSize =
        finalPointSize +
        10 +
        Math.sin(time * (isHighlighted ? 4 : 3) + word.timestamp * 0.001) * pulseFactor;

      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = word.color;
      ctx.lineWidth = isHighlighted ? 5 : 4;
      ctx.globalAlpha = isHighlighted ? 0.8 : 0.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, finalPointSize, 0, Math.PI * 2);
      ctx.fillStyle = word.color;
      ctx.globalAlpha = 1;
      ctx.shadowColor = word.color;
      ctx.shadowBlur = isHighlighted ? 28 : 20;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, finalPointSize, 0, Math.PI * 2);
      ctx.strokeStyle = isHighlighted ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = isHighlighted ? 5 : 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, finalPointSize * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "white";
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    });

    // ==================== DESSIN DES TEXTES ====================
    if (settings.showWords) {
      ctx.globalAlpha = 1;
      const isMobile = window.innerWidth < 768;
      const fontSize = isMobile ? 16 : 18;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      sortedForDisplay.forEach((word) => {
        const occurrences = wordOccurrences[word.text.toLowerCase()];
        const isHighlighted = word.highlighted || false;
        const highlightBonus = isHighlighted ? 6 : 0;
        const pointSize = getPointRadius(occurrences) + highlightBonus;

        const wobbleX = Math.sin(time * 2 + word.timestamp * 0.001) * 3;
        const wobbleY = Math.cos(time * 1.5 + word.timestamp * 0.001) * 3;
        const x = word.x * width + wobbleX;
        const y = word.y * height + wobbleY;
        const textY = y - pointSize - 18;

        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
        ctx.lineWidth = 6;
        ctx.strokeText(word.text, x, textY);

        ctx.fillStyle = word.color;
        ctx.shadowBlur = isHighlighted ? 24 : 18;
        ctx.shadowColor = word.color;
        ctx.fillText(word.text, x, textY);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      });
    }

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
    if (settings.linkMode === "chronological" || settings.linkMode === "flow") {
      connectionCount = Math.max(0, displayedWords.length - 1);
    } else if (settings.linkMode === "proximity" || settings.linkMode === "color") {
      connectionCount = displayedWords.length * 2;
    }

    let html = `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${totalWords}</div>
            <div class="text-xs text-gray-400">Contributions</div>
          </div>
          <div class="bg-gray-700/50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-indigo-400">${uniqueWords}</div>
            <div class="text-xs text-gray-400">Mots uniques</div>
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

      const newWords = [];
      fetchedWords.forEach((fw) => {
        const existing = displayedWords.find(
          (dw) => dw.text === fw.text && dw.timestamp === fw.timestamp
        );
        if (!existing) {
          newWords.push(fw);
        }
      });

      displayedWords = fetchedWords;
      wordOccurrencesCache.clear();
      geometryCache.clear();

      if (newWords.length > 0) {
        updateWordList(newWords);
        updateStats();

        const lastNewWord = newWords[newWords.length - 1];

        if (settings.animateLines && displayedWords.length > 1) {
          let targetWord;

          if (settings.linkMode === "chronological" || settings.linkMode === "flow") {
            const allWords = [...displayedWords].sort((a, b) => a.timestamp - b.timestamp);
            const lastIndex = allWords.findIndex(
              (w) => w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp
            );
            if (lastIndex > 0) {
              targetWord = allWords[lastIndex - 1];
            }
          } else if (settings.linkMode === "proximity") {
            const candidates = displayedWords.filter(
              (w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp)
            );
            const sorted = candidates
              .map((w) => ({ word: w, dist: distance(lastNewWord, w) }))
              .sort((a, b) => a.dist - b.dist);
            targetWord = sorted[0]?.word;
          } else if (settings.linkMode === "color") {
            const candidates = displayedWords.filter(
              (w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp)
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
              (w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp)
            );
            if (candidates.length > 0) {
              const hash = (lastNewWord.text + lastNewWord.timestamp)
                .split("")
                .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
              const targetIndex = Math.abs(hash) % candidates.length;
              targetWord = candidates[targetIndex];
            }
          } else if (settings.linkMode === "resonance") {
            const candidates = displayedWords.filter(
              (w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp)
            );
            const resonant = candidates.filter((w) => hasResonance(lastNewWord, w));
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
    const existingItems = Array.from(wordsList.querySelectorAll(".word-item"));
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
        filterCount.textContent = `${visibleCount}
        résultat${visibleCount > 1 ? "s" : ""}`;
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
      const password = prompt("🔒 Mot de passe administrateur pour l'enregistrement :");
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

        const estimatedSize = recordedFrames.reduce((acc, f) => acc + f.length, 0) / 1024 / 1024;

        console.log(`📸 Frame ${recordedFrames.length} • ${estimatedSize.toFixed(2)} MB`);

        if (recordedFrames.length >= 600 || estimatedSize > 200) {
          stopRecording();
          alert("⏱️ Limite atteinte (1 minute / 200 MB). Enregistrement arrêté.");
        }
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
    console.log(`⏹️ Enregistrement arrêté: ${recordedFrames.length} frames en ${duration}s`);

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

      document.getElementById("progress-text").textContent = "Initialisation du rendu HD...";

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
        const time = new Date().toLocaleTimeString("fr-FR").replace(/:/g, "-");
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

            const progress = (((i + 1) / recordedFrames.length) * 100).toFixed(0);
            document.getElementById("progress-text").textContent =
              `Rendu HD ${i + 1}/${recordedFrames.length} (${progress}%)`;
            document.getElementById("progress-bar").style.width = `${progress}%`;

            resolve();
          };
          img.onerror = () => reject(new Error("Erreur chargement image"));
        });
      }

      document.getElementById("progress-text").textContent = "Finalisation de la vidéo ULTRA HD...";

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

    document.getElementById("export-key-frames").addEventListener("click", () => {
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
          offsetX = canvasCenterX - (canvasCenterX - offsetX) * (newScale / scale);
          offsetY = canvasCenterY - (canvasCenterY - offsetY) * (newScale / scale);
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

  // ==================== EVENT LISTENERS ====================
  wordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = wordInput.value.trim();
    if (!text) return;

    console.log("Tentative d'ajout de mot:", text);

    // Vérification mots interdits
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
        text,
        x: existingWord.x,
        y: existingWord.y,
        color: existingWord.color,
      };
    } else {
      const newColor = colorGenerator.getColor();
      const position = findValidPosition();

      if (!position) {
        alert("❌ Canvas saturé - Impossible d'ajouter plus de mots pour le moment");
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
      modeDescription.textContent = MODE_DESCRIPTIONS[e.target.value];
      geometryCache.clear();
      scheduleRedraw();
    });
  }

  // Color mode
  document.querySelectorAll('input[name="color-mode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const customPicker = document.getElementById("custom-color-picker");
      if (e.target.value === "custom") {
        customPicker.classList.remove("hidden");
        colorGenerator.setMode("custom");
      } else {
        customPicker.classList.add("hidden");
        colorGenerator.setMode("auto");
      }
    });
  });

  // Color picker
  const colorPickerInput = document.getElementById("color-picker-input");
  const colorHexInput = document.getElementById("color-hex-input");
  const colorPreview = document.getElementById("color-preview");

  if (colorPickerInput && colorHexInput && colorPreview) {
    colorPickerInput.addEventListener("input", (e) => {
      const color = e.target.value;
      colorHexInput.value = color;
      colorPreview.style.background = color;
      colorGenerator.setCustomColor(color);
    });

    colorHexInput.addEventListener("input", (e) => {
      let color = e.target.value.trim();

      if (color && !color.startsWith("#")) {
        color = "#" + color;
        e.target.value = color;
      }

      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexRegex.test(color)) {
        colorPickerInput.value = color;
        colorPreview.style.background = color;
        colorGenerator.setCustomColor(color);
        e.target.classList.remove("border-red-500");
      } else if (color.length === 7) {
        e.target.classList.add("border-red-500");
      }
    });

    colorHexInput.addEventListener("blur", (e) => {
      let color = e.target.value.trim();
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      if (!hexRegex.test(color)) {
        e.target.value = colorGenerator.customColor;
        e.target.classList.remove("border-red-500");
      }
    });
  }

  // Other toggles
  document.getElementById("show-words-toggle").addEventListener("change", (e) => {
    settings.showWords = e.target.checked;
    scheduleRedraw();
  });

  document.getElementById("animate-lines-toggle").addEventListener("change", (e) => {
    settings.animateLines = e.target.checked;
  });

  document.getElementById("resonance-toggle").addEventListener("change", (e) => {
    settings.enableResonance = e.target.checked;
    scheduleRedraw();
  });

  document.getElementById("show-timestamp-toggle").addEventListener("change", (e) => {
    settings.showTimestamp = e.target.checked;
    wordsList.innerHTML = "";
    updateWordList(displayedWords);
  });

  document.getElementById("gradient-toggle").addEventListener("change", (e) => {
    settings.useGradient = e.target.checked;
    scheduleRedraw();
  });

  document.getElementById("particles-toggle").addEventListener("change", (e) => {
    settings.enableParticles = e.target.checked;
    if (!e.target.checked) {
      particles.forEach((p) => recycleParticle(p));
      particles = [];
    }
  });

  document.getElementById("line-width").addEventListener("input", (e) => {
    settings.lineWidth = parseInt(e.target.value);
    document.getElementById("line-width-value").textContent = e.target.value;
    scheduleRedraw();
  });

  // Panel toggle
  togglePanelButton.addEventListener("click", () =>
    mainContainer.classList.toggle("panel-hidden")
  );

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
          const response = await fetch("/api/words", { method: "DELETE" });

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
    document.getElementById("qrcode-display").innerHTML = qr.createImgTag(6, 8);
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