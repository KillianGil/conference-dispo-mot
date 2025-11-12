document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("weave-canvas");
  const ctx = canvas.getContext("2d");
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

  let settings = {
    linkMode: "chronological",
    showWords: true,
    animateLines: true,
    lineWidth: 5,
    colorTheme: "auto",
    enableResonance: false,
    showTimestamp: true,
    useGradient: true,
    enableParticles: true,
  };

  // Configuration globale
  const CONFIG = {
    MAX_WORDS_PER_USER: 5,
    RESET_PASSWORD: "tissage2025",
  };

  // Système de comptage par utilisateur
  function getUserWordCount() {
    try {
      const count = localStorage.getItem('userWordCount');
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      console.error("Erreur localStorage:", e);
      return 0;
    }
  }

  function incrementUserWordCount() {
    try {
      const count = getUserWordCount();
      localStorage.setItem('userWordCount', (count + 1).toString());
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

  function getAdaptiveMinDistance() {
    const container = document.getElementById("canvas-container");
    if (!container) return 60;
    
    const uniqueCount = new Set(displayedWords.map(w => w.text.toLowerCase())).size;
    
    let baseDistance = 60;
    if (uniqueCount > 80) baseDistance = 35;
    else if (uniqueCount > 60) baseDistance = 40;
    else if (uniqueCount > 40) baseDistance = 45;
    else if (uniqueCount > 25) baseDistance = 50;
    else if (uniqueCount > 15) baseDistance = 55;
    
    return Math.max(30, baseDistance);
  }

  function getPointRadius(occurrences) {
    return 18 + (occurrences - 1) * 5;
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
          w => w.text.toLowerCase() === key
        ).length;
        positionMap.set(key, { 
          x: word.x, 
          y: word.y,
          maxSize: getMaxPointSize(occurrences)
        });
      }
    });
    return Array.from(positionMap.values());
  }

  function isPositionValid(x, y, minDist) {
    const container = document.getElementById("canvas-container");
    if (!container) return true;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const margin = 0.03;
    if (x < margin || x > 1 - margin || y < margin || y > 1 - margin) {
      return false;
    }
    
    const uniquePositions = getUniqueWordPositions();
    const newMaxSize = getMaxPointSize(1);
    
    const px = x * width;
    const py = y * height;
    
    for (const pos of uniquePositions) {
      const dx = (pos.x * width) - px;
      const dy = (pos.y * height) - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const requiredDist = minDist + (pos.maxSize + newMaxSize) * 0.25;
      
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
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    for (let i = 0; i < 30; i++) {
      const x = 0.05 + Math.random() * 0.90;
      const y = 0.05 + Math.random() * 0.90;
      if (isPositionValid(x, y, minDist)) {
        return { x, y };
      }
    }
    
    const centerX = 0.5;
    const centerY = 0.5;
    const maxRadius = 0.47;
    const radiusStep = minDist / Math.max(width, height) * 0.8;
    
    for (let radius = radiusStep; radius < maxRadius; radius += radiusStep) {
      const numPoints = Math.floor(2 * Math.PI * radius / (radiusStep * 0.8));
      const actualAngleStep = (2 * Math.PI) / numPoints;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = i * actualAngleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (x >= 0.03 && x <= 0.97 && y >= 0.03 && y <= 0.97) {
          if (isPositionValid(x, y, minDist)) {
            return { x, y };
          }
        }
      }
    }
    
    const step = minDist / Math.max(width, height) * 0.7;
    for (let gridY = 0.05; gridY <= 0.95; gridY += step) {
      for (let gridX = 0.05; gridX <= 0.95; gridX += step) {
        const jitterX = (Math.random() - 0.5) * step * 0.2;
        const jitterY = (Math.random() - 0.5) * step * 0.2;
        const x = gridX + jitterX;
        const y = gridY + jitterY;
        
        if (isPositionValid(x, y, minDist)) {
          return { x, y };
        }
      }
    }
    
    const fineStep = step * 0.5;
    for (let gridY = 0.03; gridY <= 0.97; gridY += fineStep) {
      for (let gridX = 0.03; gridX <= 0.97; gridX += fineStep) {
        if (isPositionValid(gridX, gridY, minDist * 0.6)) {
          return { x: gridX, y: gridY };
        }
      }
    }
    
    return null;
  }

  function findExistingWord(text) {
    return displayedWords.find(w => w.text.toLowerCase() === text.toLowerCase());
  }

  const colorPalettes = {
    auto: () => {
      const hue = Math.random() * 360;
      const saturation = 65 + Math.random() * 30;
      const lightness = 45 + Math.random() * 25;
      return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
    },
    
    bailleul: () => {
      const colors = [
        "hsl(35, 80%, 68%)", "hsl(42, 85%, 70%)", "hsl(165, 55%, 60%)",
        "hsl(195, 50%, 65%)", "hsl(18, 70%, 62%)", "hsl(50, 80%, 72%)",
        "hsl(280, 65%, 68%)", "hsl(340, 75%, 65%)", "hsl(145, 60%, 62%)",
        "hsl(220, 70%, 68%)", "hsl(25, 75%, 60%)", "hsl(85, 65%, 65%)",
        "hsl(310, 70%, 68%)", "hsl(180, 60%, 62%)", "hsl(60, 85%, 68%)",
        "hsl(200, 65%, 65%)", "hsl(330, 80%, 70%)", "hsl(120, 55%, 60%)",
        "hsl(270, 75%, 65%)", "hsl(15, 80%, 65%)",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    
    babiole: () => {
      const colors = [
        "hsl(285, 95%, 70%)", "hsl(185, 90%, 65%)", "hsl(335, 98%, 72%)",
        "hsl(65, 100%, 62%)", "hsl(160, 88%, 65%)", "hsl(210, 92%, 68%)",
        "hsl(30, 95%, 68%)", "hsl(120, 85%, 65%)", "hsl(270, 90%, 70%)",
        "hsl(355, 95%, 68%)", "hsl(45, 100%, 65%)", "hsl(195, 95%, 70%)",
        "hsl(300, 92%, 72%)", "hsl(90, 88%, 62%)", "hsl(240, 90%, 68%)",
        "hsl(15, 100%, 65%)", "hsl(165, 95%, 68%)", "hsl(320, 98%, 70%)",
        "hsl(75, 92%, 65%)", "hsl(225, 88%, 70%)",
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

  function resizeCanvas() {
    const container = document.getElementById("canvas-container");
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawWeave();
  }

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
          drawWeave();
        }
        lastTouchDistance = dist;
      } else if (isDragging && e.touches.length === 1 && !isPinching) {
        e.preventDefault();
        offsetX = e.touches[0].clientX - startX;
        offsetY = e.touches[0].clientY - startY;
        drawWeave();
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
        drawWeave();
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
          drawWeave();
        }
        lastTap = currentTime;
      }
    });

    canvas.addEventListener("dblclick", () => {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      drawWeave();
    });
  }

  function drawWeave(withBackground = false) {
    const container = document.getElementById("canvas-container");
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

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

    let connections = [];

    if (settings.linkMode === "chronological") {
      const sortedWords = [...displayedWords].sort((a, b) => a.timestamp - b.timestamp);
      for (let i = 1; i < sortedWords.length; i++) {
        connections.push([sortedWords[i - 1], sortedWords[i]]);
      }
    } else if (settings.linkMode === "random") {
      displayedWords.forEach((word, index) => {
        if (index === 0) return;
        const hash = (word.text + word.timestamp).split('').reduce((acc, char) => 
          ((acc << 5) - acc) + char.charCodeAt(0), 0);
        const targetIndex = Math.abs(hash) % index;
        connections.push([displayedWords[targetIndex], word]);
      });
    } else if (settings.linkMode === "proximity") {
      displayedWords.forEach((word) => {
        const distances = displayedWords
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);
        distances.forEach((d) => connections.push([word, d.word]));
      });
    } else if (settings.linkMode === "color") {
      displayedWords.forEach((word) => {
        const similar = displayedWords
          .filter((w) => w !== word)
          .map((w) => ({ word: w, sim: colorSimilarity(word.color, w.color) }))
          .sort((a, b) => a.sim - b.sim)
          .slice(0, 2);
        similar.forEach((s) => connections.push([word, s.word]));
      });
    } else if (settings.linkMode === "resonance") {
      displayedWords.forEach((word) => {
        const resonant = displayedWords.filter(
          (w) => w !== word && hasResonance(word, w)
        );
        
        if (resonant.length === 0) {
          const closest = displayedWords
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
    }

    const connectedWords = new Set();
    connections.forEach(([w1, w2]) => {
      connectedWords.add(w1);
      connectedWords.add(w2);
    });

    displayedWords.forEach((word) => {
      if (!connectedWords.has(word) && displayedWords.length > 1) {
        const closest = displayedWords
          .filter((w) => w !== word)
          .map((w) => ({ word: w, dist: distance(word, w) }))
          .sort((a, b) => a.dist - b.dist)[0];
        if (closest) {
          connections.push([word, closest.word]);
        }
      }
    });

    connections.forEach(([word1, word2]) => {
      if (
        typeof word1.x !== "number" || typeof word1.y !== "number" ||
        typeof word2.x !== "number" || typeof word2.y !== "number" ||
        isNaN(word1.x) || isNaN(word1.y) || isNaN(word2.x) || isNaN(word2.y)
      ) return;

      let progress = 1;
      
      if (settings.animateLines && 
          currentAnimatingConnection && 
          ((currentAnimatingConnection[0].text === word1.text && 
            currentAnimatingConnection[0].timestamp === word1.timestamp &&
            currentAnimatingConnection[1].text === word2.text && 
            currentAnimatingConnection[1].timestamp === word2.timestamp) ||
           (currentAnimatingConnection[0].text === word2.text && 
            currentAnimatingConnection[0].timestamp === word2.timestamp &&
            currentAnimatingConnection[1].text === word1.text && 
            currentAnimatingConnection[1].timestamp === word1.timestamp))) {
        progress = animationProgress;
      }

      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.globalAlpha = 1;
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

      ctx.lineWidth = settings.lineWidth + 2;
      ctx.stroke();
      ctx.restore();

      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
      ctx.lineWidth = settings.lineWidth + 10;
      ctx.stroke();
    });

    const wordOccurrences = {};
    displayedWords.forEach((word) => {
      const key = word.text.toLowerCase();
      wordOccurrences[key] = (wordOccurrences[key] || 0) + 1;
    });

    if (settings.enableParticles) {
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
    } else {
      particles = [];
    }

    ctx.globalAlpha = 1;
    const time = Date.now() * 0.001;
    
    const uniqueDisplayMap = new Map();
    displayedWords.forEach((word) => {
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
    
    sortedForDisplay.forEach((word) => {
      const occurrences = wordOccurrences[word.text.toLowerCase()];
      const baseSize = 18;
      const pointSize = baseSize + (occurrences - 1) * 5;
      
      const wobbleX = Math.sin(time * 2 + word.timestamp * 0.001) * 4;
      const wobbleY = Math.cos(time * 1.5 + word.timestamp * 0.001) * 4;
      const x = word.x * width + wobbleX;
      const y = word.y * height + wobbleY;
      
      if (settings.enableParticles && Math.random() < 0.08) {
        particles.push(new Particle(x, y, word.color));
      }
      
      const pulseSize = pointSize + 10 + Math.sin(time * 3 + word.timestamp * 0.001) * 4;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = word.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fillStyle = word.color;
      ctx.globalAlpha = 1;
      ctx.shadowColor = word.color;
      ctx.shadowBlur = 18;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, pointSize * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'white';
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    });

    if (settings.showWords) {
      ctx.globalAlpha = 1;
      const isMobile = window.innerWidth < 768;
      const fontSize = isMobile ? 16 : 22;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      sortedForDisplay.forEach((word) => {
        const occurrences = wordOccurrences[word.text.toLowerCase()];
        const pointSize = 18 + (occurrences - 1) * 5;
        
        const wobbleX = Math.sin(time * 2 + word.timestamp * 0.001) * 4;
        const wobbleY = Math.cos(time * 1.5 + word.timestamp * 0.001) * 4;
        const x = word.x * width + wobbleX;
        const y = word.y * height + wobbleY;
        const textY = y - pointSize - 12;

        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
        ctx.lineWidth = 6;
        ctx.strokeText(word.text, x, textY);

        ctx.fillStyle = word.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = word.color;
        ctx.fillText(word.text, x, textY);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      });
    }
  }

  function updateStats() {
    if (displayedWords.length === 0) {
      document.getElementById("stats-content").innerHTML =
        '<p class="text-gray-400 text-sm">Aucune donnée disponible</p>';
      return;
    }

    const wordCounts = {};
    displayedWords.forEach((word) => {
      const text = word.text.toLowerCase();
      wordCounts[text] = (wordCounts[text] || 0) + 1;
    });

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
    if (settings.linkMode === "chronological") {
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

  async function fetchWords() {
    try {
      const response = await fetch(`/api/words?t=${Date.now()}`);
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
      
      if (newWords.length > 0) {
        updateWordList(newWords);
        updateStats();
        
        const lastNewWord = newWords[newWords.length - 1];
        
        if (settings.animateLines && displayedWords.length > 1) {
          let targetWord;
          
          if (settings.linkMode === "chronological") {
            const allWords = [...displayedWords].sort((a, b) => a.timestamp - b.timestamp);
            const lastIndex = allWords.findIndex(
              w => w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp
            );
            if (lastIndex > 0) {
              targetWord = allWords[lastIndex - 1];
            }
          } else if (settings.linkMode === "proximity") {
            const candidates = displayedWords
              .filter((w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp));
            const sorted = candidates
              .map((w) => ({ word: w, dist: distance(lastNewWord, w) }))
              .sort((a, b) => a.dist - b.dist);
            targetWord = sorted[0]?.word;
          } else if (settings.linkMode === "color") {
            const candidates = displayedWords
              .filter((w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp));
            const sorted = candidates
              .map((w) => ({ word: w, sim: colorSimilarity(lastNewWord.color, w.color) }))
              .sort((a, b) => a.sim - b.sim);
            targetWord = sorted[0]?.word;
          } else if (settings.linkMode === "random") {
            const candidates = displayedWords
              .filter((w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp));
            if (candidates.length > 0) {
              const hash = (lastNewWord.text + lastNewWord.timestamp).split('').reduce((acc, char) => 
                ((acc << 5) - acc) + char.charCodeAt(0), 0);
              const targetIndex = Math.abs(hash) % candidates.length;
              targetWord = candidates[targetIndex];
            }
          } else if (settings.linkMode === "resonance") {
            const candidates = displayedWords
              .filter((w) => !(w.text === lastNewWord.text && w.timestamp === lastNewWord.timestamp));
            const resonant = candidates.filter(w => hasResonance(lastNewWord, w));
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
      console.error("Erreur fetchWords:", error);
    }
  }

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
      li.className = "word-item p-3 rounded-lg flex items-center bg-gray-800/50 hover:bg-gray-700/50 transition-colors";
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

  wordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = wordInput.value.trim();
    if (!text) return;
    
    console.log("Tentative d'ajout de mot:", text);
    
    // Vérification stricte de la limite
    if (!canUserAddWord()) {
      const count = getUserWordCount();
      console.log("Limite atteinte:", count);
      alert(`❌ Vous avez atteint la limite de ${CONFIG.MAX_WORDS_PER_USER} mots par participant.\n\nLaissez la place aux autres ! 😊`);
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
      const colorGenerator = colorPalettes[settings.colorTheme] || colorPalettes.auto;
      const newColor = colorGenerator();
      
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
      
      // Incrémente SEULEMENT après succès serveur
      incrementUserWordCount();
      console.log("Mot ajouté avec succès");
      
      wordInput.value = "";
      submitButton.textContent = "✓";
      
      // Mise à jour du placeholder
      const remaining = CONFIG.MAX_WORDS_PER_USER - getUserWordCount();
      console.log("Mots restants:", remaining);
      
      if (remaining > 0) {
        wordInput.placeholder = `${remaining} mot${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}...`;
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

  document.querySelectorAll('input[name="link-mode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      settings.linkMode = e.target.value;
      drawWeave();
    });
  });

  document.querySelectorAll('input[name="color-theme"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      settings.colorTheme = e.target.value;
    });
  });

  document.getElementById("show-words-toggle").addEventListener("change", (e) => {
    settings.showWords = e.target.checked;
    drawWeave();
  });

  document.getElementById("animate-lines-toggle").addEventListener("change", (e) => {
    settings.animateLines = e.target.checked;
  });

  document.getElementById("resonance-toggle").addEventListener("change", (e) => {
    settings.enableResonance = e.target.checked;
    drawWeave();
  });

  document.getElementById("show-timestamp-toggle").addEventListener("change", (e) => {
    settings.showTimestamp = e.target.checked;
    wordsList.innerHTML = "";
    updateWordList(displayedWords);
  });

  document.getElementById("gradient-toggle").addEventListener("change", (e) => {
    settings.useGradient = e.target.checked;
    drawWeave();
  });

  document.getElementById("particles-toggle").addEventListener("change", (e) => {
    settings.enableParticles = e.target.checked;
    if (!e.target.checked) {
      particles = [];
    }
  });

  document.getElementById("line-width").addEventListener("input", (e) => {
    settings.lineWidth = parseInt(e.target.value);
    document.getElementById("line-width-value").textContent = e.target.value;
    drawWeave();
  });

  togglePanelButton.addEventListener("click", () =>
    mainContainer.classList.toggle("panel-hidden")
  );

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

  // Bouton Reset avec protection par mot de passe
  resetButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Reset button clicked");
    
    const passwordModal = document.createElement('div');
    passwordModal.id = 'password-reset-modal';
    passwordModal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4';
    passwordModal.style.zIndex = '100';
    
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
    console.log("Modal ajouté au DOM");
    
    const passwordInput = document.getElementById('reset-password-input');
    const confirmBtn = document.getElementById('confirm-reset');
    const cancelBtn = document.getElementById('cancel-reset');
    
    setTimeout(() => passwordInput.focus(), 100);
    
    const closeModal = () => {
      if (document.body.contains(passwordModal)) {
        document.body.removeChild(passwordModal);
        console.log("Modal fermé");
      }
    };
    
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
    
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        closeModal();
      }
    });
    
    const attemptReset = async () => {
      const enteredPassword = passwordInput.value.trim();
      console.log("Tentative reset avec mot de passe:", enteredPassword ? "***" : "(vide)");
      
      if (enteredPassword === CONFIG.RESET_PASSWORD) {
        console.log("✓ Mot de passe correct");
        closeModal();
        
        try {
          const response = await fetch("/api/words", { method: "DELETE" });
          console.log("Réponse DELETE:", response.status);
          
          displayedWords = [];
          wordsList.innerHTML = "";
          particles = [];
          currentAnimatingConnection = null;
          animationProgress = 0;
          scale = 1;
          offsetX = 0;
          offsetY = 0;
          
          localStorage.removeItem('userWordCount');
          console.log("LocalStorage nettoyé");
          
          wordInput.disabled = false;
          wordForm.querySelector("button").disabled = false;
          wordInput.placeholder = "Partagez un mot...";
          
          drawWeave();
          updateStats();
          alert("✓ Tissage réinitialisé avec succès");
        } catch (err) {
          console.error("Erreur reset:", err);
          alert("❌ La réinitialisation a échoué");
        }
      } else {
        console.log("✗ Mot de passe incorrect");
        passwordInput.value = "";
        passwordInput.placeholder = "❌ Mot de passe incorrect";
        passwordInput.classList.add('border-2', 'border-red-500');
        setTimeout(() => {
          passwordInput.placeholder = "Mot de passe...";
          passwordInput.classList.remove('border-2', 'border-red-500');
        }, 2000);
      }
    };
    
    confirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      attemptReset();
    });
    
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptReset();
      }
    });
  });

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

  setupZoomAndPan();
  canvas.style.cursor = "grab";
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  setInterval(fetchWords, 2000);
  fetchWords();
  animateWeaving();
  
  // Afficher le compteur au chargement
  const remaining = CONFIG.MAX_WORDS_PER_USER - getUserWordCount();
  console.log("Compteur initial:", getUserWordCount(), "/ Restants:", remaining);
  
  if (remaining === 0) {
    wordInput.placeholder = "Limite atteinte (5 mots max)";
    wordInput.disabled = true;
    wordForm.querySelector("button").disabled = true;
  } else if (remaining < CONFIG.MAX_WORDS_PER_USER) {
    wordInput.placeholder = `${remaining} mot${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}...`;
  }
});