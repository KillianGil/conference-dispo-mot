document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("weave-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const container = document.getElementById("canvas-container");
  const wordsList = document.getElementById("words-list");
  const wordForm = document.getElementById("word-form");
  const wordInput = document.getElementById("word-input");
  const mainContainer = document.getElementById("main-container");
  const togglePanelButton = document.getElementById("toggle-panel-button");
  const downloadButton = document.getElementById("download-button");
  const resetButton = document.getElementById("reset-button");

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

  const settings = {
    linkMode: "chronological",
    showWords: true,
    animateLines: true,
    lineWidth: 5,
    colorTheme: "auto",
    enableResonance: false,
    showTimestamp: true,
    useGradient: true,
    enableParticles: true, // <-- nouvelle option
  };

  /* -------------------- OUTILS DE BASE -------------------- */
  function getMinDistance() {
    if (!container) return 120;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const diag = Math.sqrt(w * w + h * h);
    return Math.max(80, diag * 0.08);
  }

  function getUniquePositions() {
    const map = new Map();
    displayedWords.forEach((word) => {
      const key = word.text.toLowerCase();
      if (!map.has(key)) map.set(key, { x: word.x, y: word.y });
    });
    return Array.from(map.values());
  }

  function isPositionValid(x, y, minDist) {
    const unique = getUniquePositions();
    const w = container.clientWidth;
    const h = container.clientHeight;
    return unique.every((pos) => {
      const dx = pos.x * w - x * w;
      const dy = pos.y * h - y * h;
      return Math.sqrt(dx * dx + dy * dy) >= minDist;
    });
  }

  function findExistingWord(text) {
    return displayedWords.find((w) => w.text.toLowerCase() === text.toLowerCase());
  }

  /* -------------------- COULEURS -------------------- */
  const colorPalettes = {
    auto: () => {
      const hue = Math.random() * 360;
      const s = 65 + Math.random() * 30;
      const l = 45 + Math.random() * 25;
      return `hsl(${hue}, ${s}%, ${l}%)`;
    },
    bailleul: () => {
      const colors = [
        "hsl(35,80%,68%)","hsl(42,85%,70%)","hsl(165,55%,60%)","hsl(195,50%,65%)",
        "hsl(18,70%,62%)","hsl(50,80%,72%)","hsl(280,65%,68%)","hsl(340,75%,65%)",
        "hsl(145,60%,62%)","hsl(220,70%,68%)","hsl(25,75%,60%)","hsl(85,65%,65%)",
        "hsl(310,70%,68%)","hsl(180,60%,62%)","hsl(60,85%,68%)","hsl(200,65%,65%)",
        "hsl(330,80%,70%)","hsl(120,55%,60%)","hsl(270,75%,65%)","hsl(15,80%,65%)"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    babiole: () => {
      const colors = [
        "hsl(285,95%,70%)","hsl(185,90%,65%)","hsl(335,98%,72%)","hsl(65,100%,62%)",
        "hsl(160,88%,65%)","hsl(210,92%,68%)","hsl(30,95%,68%)","hsl(120,85%,65%)",
        "hsl(270,90%,70%)","hsl(355,95%,68%)","hsl(45,100%,65%)","hsl(195,95%,70%)",
        "hsl(300,92%,72%)","hsl(90,88%,62%)","hsl(240,90%,68%)","hsl(15,100%,65%)",
        "hsl(165,95%,68%)","hsl(320,98%,70%)","hsl(75,92%,65%)","hsl(225,88%,70%)"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
  };

  /* -------------------- PARTICULE -------------------- */
  class Particle {
    constructor(x, y, color) {
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

  /* -------------------- REDIMENSIONNEMENT -------------------- */
  function resizeCanvas() {
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    drawWeave();
  }

  /* -------------------- OUTILS -------------------- */
  function distance(w1, w2) {
    const dx = w1.x - w2.x;
    const dy = w1.y - w2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function colorSimilarity(c1, c2) {
    const h1 = +c1.match(/\d+/)[0];
    const h2 = +c2.match(/\d+/)[0];
    return Math.abs(h1 - h2);
  }

  function hasResonance(w1, w2) {
    const l1 = new Set(w1.text.toLowerCase());
    const l2 = new Set(w2.text.toLowerCase());
    const common = [...l1].filter((l) => l2.has(l));
    return common.length >= 2;
  }

  /* -------------------- ANIMATION -------------------- */
  function animateWeaving() {
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

  /* -------------------- ZOOM / PAN -------------------- */
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
      drawWeave();
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
        drawWeave();
      }
    });

    ["mouseup", "mouseleave"].forEach((ev) =>
      canvas.addEventListener(ev, () => {
        isDragging = false;
        canvas.style.cursor = "grab";
      })
    );

    canvas.addEventListener("dblclick", () => {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      drawWeave();
    });
  }

  /* -------------------- DESSIN -------------------- */
  function drawWeave(withBackground = false) {
    if (!container) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (withBackground) {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (displayedWords.length === 0) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const wordOccurrences = {};
    displayedWords.forEach((w) => {
      const key = w.text.toLowerCase();
      wordOccurrences[key] = (wordOccurrences[key] || 0) + 1;
    });

    const uniqueWords = [];
    const map = new Map();
    displayedWords.forEach((w) => {
      const key = w.text.toLowerCase();
      if (!map.has(key)) {
        map.set(key, w);
        uniqueWords.push(w);
      }
    });

    // Connexions entre mots
    const connections = [];
    const sortedWords = [...uniqueWords].sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < sortedWords.length; i++) {
      connections.push([sortedWords[i - 1], sortedWords[i]]);
    }

    // Lignes
    connections.forEach(([w1, w2]) => {
      const x1 = w1.x * width;
      const y1 = w1.y * height;
      const x2 = w2.x * width;
      const y2 = w2.y * height;
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, w1.color);
      gradient.addColorStop(1, w2.color);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = settings.lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Particules
    if (settings.enableParticles) {
      particles = particles.filter((p) => p.life > 0);
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
    }

    // Points + texte
    const time = Date.now() * 0.001;
    uniqueWords.forEach((word) => {
      const occurrences = wordOccurrences[word.text.toLowerCase()];
      const baseSize = 20;
      const pointSize = baseSize + (occurrences - 1) * 6;
      const x = word.x * width;
      const y = word.y * height;

      if (settings.enableParticles && Math.random() < 0.08) {
        particles.push(new Particle(x, y, word.color));
      }

      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fillStyle = word.color;
      ctx.shadowColor = word.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (settings.showWords) {
        ctx.font = `bold 22px Inter, sans-serif`;
        ctx.fillStyle = word.color;
        ctx.textAlign = "center";
        ctx.fillText(word.text, x, y - pointSize - 10);
      }
    });
  }

  /* -------------------- FETCH -------------------- */
  async function fetchWords() {
    try {
      const res = await fetch(`/api/words?t=${Date.now()}`);
      if (!res.ok) throw new Error(`Erreur réseau: ${res.status}`);
      const fetchedWords = await res.json();
      if (!Array.isArray(fetchedWords)) return;

      const existingMap = new Map(displayedWords.map((w) => [`${w.text}-${w.timestamp}`, w]));
      fetchedWords.forEach((fw) => {
        const key = `${fw.text}-${fw.timestamp}`;
        if (!existingMap.has(key)) displayedWords.push(fw);
      });

      updateWordList(fetchedWords);
      drawWeave();
    } catch (err) {
      console.error("Erreur fetchWords:", err);
    }
  }

  /* -------------------- INTERFACE -------------------- */
  document.getElementById("animate-lines-toggle").addEventListener("change", (e) => {
    settings.animateLines = e.target.checked;
  });

  // Ajout dynamique du toggle "Particules" dans les paramètres
  const settingsModal = document.getElementById("settings-modal");
  const displaySection = settingsModal.querySelector(".space-y-3");
  const newOption = document.createElement("label");
  newOption.className = "flex items-center text-sm md:text-base text-gray-200 cursor-pointer hover:text-white";
  newOption.innerHTML = `<input type="checkbox" id="particles-toggle" checked class="mr-3 accent-indigo-500"><span>Effet de particules</span>`;
  displaySection.appendChild(newOption);

  document.getElementById("particles-toggle").addEventListener("change", (e) => {
    settings.enableParticles = e.target.checked;
    drawWeave();
  });

  /* -------------------- INITIALISATION -------------------- */
  setupZoomAndPan();
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  animateWeaving();
  fetchWords();
  setInterval(fetchWords, 2000);
});