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
    let weavingAnimation = [];
    let animationProgress = 0;
  
    // Zoom et pan - CORRECTION : sauvegarde du zoom
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
      lineWidth: 2,
      colorTheme: "auto",
      enableResonance: false,
      showTimestamp: true,
      useGradient: false,
    };
  
    const colorPalettes = {
      auto: () => `hsl(${Math.random() * 360}, 80%, 60%)`,
      bailleul: () => {
        const colors = [
          "hsl(30, 70%, 55%)",
          "hsl(45, 80%, 65%)",
          "hsl(160, 45%, 50%)",
          "hsl(200, 30%, 60%)",
          "hsl(15, 60%, 50%)",
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
      babiole: () => {
        const colors = [
          "hsl(280, 90%, 65%)",
          "hsl(180, 85%, 55%)",
          "hsl(330, 95%, 60%)",
          "hsl(60, 100%, 50%)",
          "hsl(120, 80%, 55%)",
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    };
  
    // --- Canvas Resize ---
    function resizeCanvas() {
      const container = document.getElementById("canvas-container");
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
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
      if (weavingAnimation.length === 0) return;
      animationProgress += 0.03;
      if (animationProgress >= 1) {
        animationProgress = 0;
        weavingAnimation.shift();
      }
      drawWeave();
      if (settings.animateLines && weavingAnimation.length > 0) {
        animationFrame = requestAnimationFrame(animateWeaving);
      }
    }
  
    // --- CORRECTION : Zoom avec sauvegarde ---
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
  
      // Touch zoom - CORRECTION
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
          const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
  
          if (lastTouchDistance > 0) {
            const delta = distance / lastTouchDistance;
            const newScale = Math.min(
              Math.max(0.5, scale * delta),
              5
            );
  
            // Centre du pinch
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            const rect = canvas.getBoundingClientRect();
            const canvasCenterX = centerX - rect.left;
            const canvasCenterY = centerY - rect.top;
  
            offsetX =
              canvasCenterX -
              (canvasCenterX - offsetX) * (newScale / scale);
            offsetY =
              canvasCenterY -
              (canvasCenterY - offsetY) * (newScale / scale);
  
            scale = newScale;
            drawWeave();
          }
  
          lastTouchDistance = distance;
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
  
      // Mouse drag
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
  
      // Double-tap reset
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
  
    // Remplacez la fonction drawWeave par cette version corrigée :
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
  
    if (displayedWords.length < 2) return;
  
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  
    let connections = [];
  
    if (settings.linkMode === "chronological") {
      const chronoWords = [...displayedWords].reverse();
      for (let i = 1; i < chronoWords.length; i++) {
        connections.push([chronoWords[i - 1], chronoWords[i]]);
      }
    } else if (settings.linkMode === "random") {
      // CORRECTION: Calcul stable basé sur un seed
      displayedWords.forEach((word, index) => {
        if (index === 0) return;
        // Utiliser un hash stable du mot pour déterminer la connexion
        const hash = word.text.split('').reduce((acc, char) => 
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
          .map((w) => ({
            word: w,
            sim: colorSimilarity(word.color, w.color),
          }))
          .sort((a, b) => a.sim - b.sim)
          .slice(0, 2);
        similar.forEach((s) => connections.push([word, s.word]));
      });
    } else if (settings.linkMode === "resonance") {
      displayedWords.forEach((word) => {
        const resonant = displayedWords.filter(
          (w) => w !== word && hasResonance(word, w)
        );
        resonant.forEach((r) => connections.push([word, r]));
      });
    }
  
    connections.forEach(([word1, word2], index) => {
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
        weavingAnimation.length > 0 &&
        index === connections.length - 1
      ) {
        progress = animationProgress;
      }
  
      const x1 = word1.x * width;
      const y1 = word1.y * height;
      const x2 = word2.x * width;
      const y2 = word2.y * height;
  
      const baseAlpha = 0.7;
      ctx.globalAlpha = baseAlpha;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 + (x2 - x1) * progress,
        y1 + (y2 - y1) * progress
      );
  
      if (settings.useGradient) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(1, word2.color);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = word2.color;
      }
  
      ctx.lineWidth = settings.lineWidth;
      ctx.stroke();
  
      if (settings.enableResonance && hasResonance(word1, word2)) {
        const pulseIntensity =
          0.3 + 0.2 * Math.sin(Date.now() * 0.003);
        ctx.globalAlpha = pulseIntensity;
        ctx.lineWidth = settings.lineWidth * 3;
        ctx.strokeStyle = word2.color;
        ctx.stroke();
  
        ctx.globalAlpha = pulseIntensity * 1.5;
        [
          [x1, y1],
          [x2, y2],
        ].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, settings.lineWidth * 2, 0, Math.PI * 2);
          ctx.fillStyle = word2.color;
          ctx.fill();
        });
      }
    });
  
    if (settings.showWords) {
      ctx.globalAlpha = 1;
      const isMobile = window.innerWidth < 768;
      const fontSize = isMobile ? 12 : 14;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
  
      displayedWords.forEach((word) => {
        const x = word.x * width;
        const y = word.y * height;
  
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
  
        ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
        ctx.lineWidth = 3;
        ctx.strokeText(word.text, x, y);
  
        ctx.fillStyle = word.color;
        ctx.fillText(word.text, x, y);
  
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
  
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = word.color;
        ctx.fill();
      });
    }
  
    // CORRECTION: Animation uniquement pour la résonance
    if (settings.enableResonance && connections.some(([w1, w2]) => hasResonance(w1, w2))) {
      requestAnimationFrame(() => drawWeave(withBackground));
    }
  }
  
  // Amélioration de la palette auto pour plus de variété
  const colorPalettes = {
    auto: () => {
      // CORRECTION: Meilleure distribution des couleurs
      const hueRanges = [
        [0, 30],      // Rouge-Orange
        [30, 60],     // Orange-Jaune
        [150, 180],   // Vert-Cyan
        [180, 210],   // Cyan
        [210, 270],   // Bleu
        [270, 330],   // Violet-Magenta
        [330, 360],   // Magenta-Rouge
      ];
      const range = hueRanges[Math.floor(Math.random() * hueRanges.length)];
      const hue = range[0] + Math.random() * (range[1] - range[0]);
      const saturation = 70 + Math.random() * 20; // 70-90%
      const lightness = 50 + Math.random() * 15;  // 50-65%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    bailleul: () => {
      const colors = [
        "hsl(30, 70%, 55%)",
        "hsl(45, 80%, 65%)",
        "hsl(160, 45%, 50%)",
        "hsl(200, 30%, 60%)",
        "hsl(15, 60%, 50%)",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    babiole: () => {
      const colors = [
        "hsl(280, 90%, 65%)",
        "hsl(180, 85%, 55%)",
        "hsl(330, 95%, 60%)",
        "hsl(60, 100%, 50%)",
        "hsl(120, 80%, 55%)",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
  };
  
    // --- Calcul des statistiques ---
    function updateStats() {
      if (displayedWords.length === 0) {
        document.getElementById("stats-content").innerHTML =
          '<p class="text-gray-400 text-sm">Aucune donnée disponible</p>';
        return;
      }
  
      // Compter les occurrences
      const wordCounts = {};
      displayedWords.forEach((word) => {
        const text = word.text.toLowerCase();
        wordCounts[text] = (wordCounts[text] || 0) + 1;
      });
  
      // Trier par fréquence
      const sorted = Object.entries(wordCounts).sort(
        ([, a], [, b]) => b - a
      );
      const totalWords = displayedWords.length;
  
      // Temps écoulé
      const timestamps = displayedWords
        .map((w) => w.timestamp)
        .filter(Boolean);
      let timeSpan = 0;
      if (timestamps.length > 1) {
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        timeSpan = Math.floor((newest - oldest) / 1000 / 60); // minutes
      }
  
      // Mots uniques
      const uniqueWords = Object.keys(wordCounts).length;
  
      // Connexions
      let connectionCount = 0;
      if (settings.linkMode === "chronological") {
        connectionCount = Math.max(0, displayedWords.length - 1);
      } else if (
        settings.linkMode === "proximity" ||
        settings.linkMode === "color"
      ) {
        connectionCount = displayedWords.length * 2;
      }
  
      // Générer le HTML
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
        if (!response.ok)
          throw new Error(`Erreur réseau: ${response.status}`);
  
        const fetchedWords = await response.json();
  
        if (!Array.isArray(fetchedWords)) {
          console.error("❌ Réponse inattendue:", fetchedWords);
          return;
        }
  
        const newWords = fetchedWords.filter(
          (fw) =>
            !displayedWords.some(
              (dw) =>
                dw.text === fw.text && dw.timestamp === fw.timestamp
            )
        );
  
        const hadWords = displayedWords.length > 0;
        displayedWords = fetchedWords;
  
        if (newWords.length > 0) {
          updateWordList(newWords);
          updateStats();
  
          if (settings.animateLines && hadWords) {
            weavingAnimation = newWords;
            animationProgress = 0;
            if (animationFrame)
              cancelAnimationFrame(animationFrame);
            animateWeaving();
          } else {
            drawWeave();
          }
        }
      } catch (error) {
        console.error("Erreur fetchWords:", error);
      }
    }
  
    // --- CORRECTION : Liste sans fond coloré ---
    function updateWordList(newWords = []) {
      const existingItems = Array.from(
        wordsList.querySelectorAll(".word-item")
      );
      const currentTexts = displayedWords.map((w) => w.text);
  
      existingItems.forEach((item) => {
        if (!currentTexts.includes(item.dataset.text)) {
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
          timeSpan.className =
            "text-xs text-gray-400 ml-2 flex-shrink-0";
          li.appendChild(timeSpan);
        }
  
        wordsList.insertBefore(li, wordsList.firstChild);
      });
    }
  
    wordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = wordInput.value.trim();
      if (!text) return;
  
      const submitButton = wordForm.querySelector("button");
      const originalPlaceholder = wordInput.placeholder;
  
      wordInput.disabled = true;
      submitButton.disabled = true;
      submitButton.textContent = "...";
  
      const colorGenerator =
        colorPalettes[settings.colorTheme] || colorPalettes.auto;
      const newColor = colorGenerator();
  
      const newWordPayload = {
        text,
        x: Math.random(),
        y: Math.random(),
        color: newColor,
      };
  
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
  
        wordInput.value = "";
  
        submitButton.textContent = "✓";
        setTimeout(() => {
          submitButton.textContent = "Tisser";
        }, 800);
  
        await fetchWords();
      } catch (error) {
        console.error("Erreur d'ajout:", error);
        wordInput.placeholder = error.message;
        setTimeout(() => {
          wordInput.placeholder = originalPlaceholder;
        }, 3000);
      } finally {
        wordInput.disabled = false;
        submitButton.disabled = false;
        wordInput.focus();
      }
    });
  
    // --- Stats panel toggle ---
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
  
    // --- Settings ---
    const settingsButton = document.getElementById("settings-button");
    const settingsModal = document.getElementById("settings-modal");
    const closeSettingsButton = document.getElementById(
      "close-settings-button"
    );
  
    settingsButton.addEventListener("click", () => {
      settingsModal.classList.remove("hidden");
    });
  
    closeSettingsButton.addEventListener("click", () => {
      settingsModal.classList.add("hidden");
    });
  
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal)
        settingsModal.classList.add("hidden");
    });
  
    document
      .querySelectorAll('input[name="link-mode"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          settings.linkMode = e.target.value;
          drawWeave();
        });
      });
  
    document
      .querySelectorAll('input[name="color-theme"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          settings.colorTheme = e.target.value;
        });
      });
  
    document
      .getElementById("show-words-toggle")
      .addEventListener("change", (e) => {
        settings.showWords = e.target.checked;
        drawWeave();
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
        drawWeave();
      });
  
    document
      .getElementById("show-timestamp-toggle")
      .addEventListener("change", (e) => {
        settings.showTimestamp = e.target.checked;
        wordsList.innerHTML = "";
        updateWordList(displayedWords);
      });
  
    document
      .getElementById("gradient-toggle")
      .addEventListener("change", (e) => {
        settings.useGradient = e.target.checked;
        drawWeave();
      });
  
    document
      .getElementById("line-width")
      .addEventListener("input", (e) => {
        settings.lineWidth = parseInt(e.target.value);
        document.getElementById("line-width-value").textContent =
          e.target.value;
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
  
    resetButton.addEventListener("click", async () => {
      const isMobile = window.innerWidth < 768;
      const message = isMobile
        ? "Tout supprimer ?"
        : "Supprimer tous les mots et recommencer le tissage ?";
  
      if (confirm(message)) {
        try {
          await fetch("/api/words", { method: "DELETE" });
          displayedWords = [];
          wordsList.innerHTML = "";
          scale = 1;
          offsetX = 0;
          offsetY = 0;
          drawWeave();
          updateStats();
        } catch (err) {
          alert("La réinitialisation a échoué.");
        }
      }
    });
  
    const qrButton = document.getElementById("qr-code-button");
    const qrModal = document.getElementById("qr-modal");
    const closeModalButton = document.getElementById("close-modal-button");
  
    function showQrCode() {
      const qr = qrcode(0, "L");
      qr.addData(window.location.href);
      qr.make();
      document.getElementById("qrcode-display").innerHTML =
        qr.createImgTag(6, 8);
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
  });