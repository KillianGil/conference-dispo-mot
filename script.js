document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("weave-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const container = document.getElementById("canvas-container");
  const wordForm = document.getElementById("word-form");
  const wordInput = document.getElementById("word-input");

  let displayedWords = [];
  let particles = [];

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let startX, startY;

  const settings = {
    lineWidth: 5,
    colorTheme: "auto",
    enableParticles: true,
  };

  /* -------------------- OUTILS -------------------- */
  function getMinDistance() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const diag = Math.sqrt(w * w + h * h);
    return Math.max(150, diag * 0.12); // plus espacé
  }

  const colorPalettes = {
    auto: () => `hsl(${Math.random() * 360}, 70%, 60%)`,
    bailleul: () => {
      const colors = [
        "hsl(35,80%,68%)","hsl(42,85%,70%)","hsl(165,55%,60%)","hsl(195,50%,65%)",
        "hsl(18,70%,62%)","hsl(280,65%,68%)"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    babiole: () => {
      const colors = [
        "hsl(285,95%,70%)","hsl(185,90%,65%)","hsl(335,98%,72%)",
        "hsl(65,100%,62%)","hsl(210,92%,68%)","hsl(355,95%,68%)"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
  };

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.life = 1;
      this.color = color;
      this.size = Math.random() * 3 + 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.015;
      this.vy += 0.1;
    }
    draw(ctx) {
      ctx.globalAlpha = this.life;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  /* -------------------- CANVAS -------------------- */
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawWeave();
  }

  function drawWeave() {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (!displayedWords.length) return;

    const wordOccurrences = {};
    displayedWords.forEach(w => {
      const key = w.text.toLowerCase();
      wordOccurrences[key] = (wordOccurrences[key] || 0) + 1;
    });

    // Lignes
    for (let i = 1; i < displayedWords.length; i++) {
      const w1 = displayedWords[i - 1];
      const w2 = displayedWords[i];
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
    }

    // Points
    displayedWords.forEach(w => {
      const occurrences = wordOccurrences[w.text.toLowerCase()];
      const size = 10 + (occurrences - 1) * 8; // grossit selon récurrence
      const x = w.x * width;
      const y = w.y * height;

      if (settings.enableParticles && Math.random() < 0.05)
        particles.push(new Particle(x, y, w.color));

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = w.color;
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `bold 18px Inter, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(w.text, x, y - size - 6);
    });

    // Particules
    if (settings.enableParticles) {
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
    }
  }

  /* -------------------- AJOUT DE MOT -------------------- */
  wordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = wordInput.value.trim();
    if (!text) return;

    const rect = container.getBoundingClientRect();
    const minDist = getMinDistance();
    let x, y, valid = false;
    while (!valid) {
      x = Math.random();
      y = Math.random();
      valid = displayedWords.every(w => {
        const dx = w.x - x;
        const dy = w.y - y;
        return Math.sqrt(dx * dx + dy * dy) >= minDist / rect.width;
      });
    }

    const color = colorPalettes[settings.colorTheme]();
    const newWord = { text, x, y, color, timestamp: Date.now() };
    displayedWords.push(newWord);

    drawWeave();
    wordInput.value = "";
  });

  /* -------------------- UI -------------------- */
  document.getElementById("particles-toggle")?.addEventListener("change", (e) => {
    settings.enableParticles = e.target.checked;
    drawWeave();
  });

  /* -------------------- ZOOM/PAN -------------------- */
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
  });
  canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      drawWeave();
    }
  });
  ["mouseup", "mouseleave"].forEach(ev =>
    canvas.addEventListener(ev, () => (isDragging = false))
  );

  canvas.addEventListener("dblclick", () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    drawWeave();
  });

  /* -------------------- INIT -------------------- */
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
});