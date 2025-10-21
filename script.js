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
  
    let settings = {
      linkMode: "chronological",
      showWords: true,
      animateLines: true,
      lineWidth: 2,
      colorTheme: "auto",
      enableResonance: false,
      showTimestamp: true,
    };
  
    // Palettes de couleurs thématiques
    const colorPalettes = {
      auto: () => `hsl(${Math.random() * 360}, 80%, 60%)`,
      bailleul: () => {
        const colors = [
          "hsl(30, 70%, 55%)", // terracotta
          "hsl(45, 80%, 65%)", // ocre
          "hsl(160, 45%, 50%)", // vert végétal
          "hsl(200, 30%, 60%)", // bleu lin
          "hsl(15, 60%, 50%)", // rouille
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
      babiole: () => {
        const colors = [
          "hsl(280, 90%, 65%)", // violet électrique
          "hsl(180, 85%, 55%)", // cyan
          "hsl(330, 95%, 60%)", // magenta
          "hsl(60, 100%, 50%)", // jaune vif
          "hsl(120, 80%, 55%)", // vert néon
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
  
    // --- Calcul de distance ---
    function distance(word1, word2) {
      const dx = word1.x - word2.x;
      const dy = word1.y - word2.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  
    // --- Calcul de similarité de couleur ---
    function colorSimilarity(color1, color2) {
      const hsl1 = color1.match(/\d+/g).map(Number);
      const hsl2 = color2.match(/\d+/g).map(Number);
      return Math.abs(hsl1[0] - hsl2[0]);
    }
  
    // --- Résonance : lettres communes ---
    function hasResonance(word1, word2) {
      const letters1 = new Set(word1.text.toLowerCase().split(""));
      const letters2 = new Set(word2.text.toLowerCase().split(""));
      const common = [...letters1].filter((l) => letters2.has(l));
      return common.length >= 2;
    }
  
    // --- Animation de tissage ---
    function animateWeaving() {
      if (weavingAnimation.length === 0) return;
  
      animationProgress += 0.02;
      if (animationProgress >= 1) {
        animationProgress = 0;
        weavingAnimation.shift();
      }
  
      drawWeave();
  
      if (settings.animateLines && weavingAnimation.length > 0) {
        animationFrame = requestAnimationFrame(animateWeaving);
      }
    }
  
    // --- Dessin amélioré ---
    function drawWeave(withBackground = false) {
      const container = document.getElementById("canvas-container");
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      if (withBackground) {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
  
      if (displayedWords.length < 2) return;
  
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
  
      // Créer les connexions selon le mode
      let connections = [];
  
      if (settings.linkMode === "chronological") {
        const chronoWords = [...displayedWords].reverse();
        for (let i = 1; i < chronoWords.length; i++) {
          connections.push([chronoWords[i - 1], chronoWords[i]]);
        }
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
  
      // Dessiner les connexions avec animation
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
  
        // Animation de tissage
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
  
        // Ligne principale
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(
          x1 + (x2 - x1) * progress,
          y1 + (y2 - y1) * progress
        );
  
        // Dégradé pour l'effet tissage
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, word1.color);
        gradient.addColorStop(1, word2.color);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = settings.lineWidth;
        ctx.stroke();
  
        // Effet de résonance
        if (settings.enableResonance && hasResonance(word1, word2)) {
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = settings.lineWidth * 2;
          ctx.stroke();
        }
      });
  
      // Dessiner les mots sur le canvas
      if (settings.showWords) {
        ctx.globalAlpha = 1;
        const isMobile = window.innerWidth < 768;
        ctx.font = isMobile
          ? "12px Inter, sans-serif"
          : "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
  
        displayedWords.forEach((word) => {
          const x = word.x * width;
          const y = word.y * height;
  
          // Ombre
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillText(word.text, x + 1, y + 1);
  
          // Texte
          ctx.fillStyle = word.color;
          ctx.fillText(word.text, x, y);
  
          // Point central
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = word.color;
          ctx.fill();
        });
      }
    }
  
    // --- API ---
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
  
        // Identifier les nouveaux mots
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
  
          // Lancer l'animation de tissage pour les nouveaux mots
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
  
    // --- Mise à jour de la liste ---
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
        li.className = "word-item p-3 rounded-lg flex items-center";
        li.style.backgroundColor = word.color + "20";
        li.dataset.text = word.text;
  
        const colorDot = document.createElement("span");
        colorDot.className = "w-3 h-3 rounded-full mr-3 flex-shrink-0";
        colorDot.style.backgroundColor = word.color;
  
        const textSpan = document.createElement("span");
        textSpan.textContent = word.text;
        textSpan.className = "text-gray-200 truncate flex-grow";
  
        li.appendChild(colorDot);
        li.appendChild(textSpan);
  
        // Timestamp optionnel
        if (settings.showTimestamp) {
          const timeSpan = document.createElement("span");
          const date = new Date(word.timestamp);
          timeSpan.textContent = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          timeSpan.className = "text-xs text-gray-500 ml-2";
          li.appendChild(timeSpan);
        }
  
        wordsList.insertBefore(li, wordsList.firstChild);
      });
    }
  
    // --- Soumission du formulaire ---
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
        
        // Feedback visuel mobile
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
  
    // --- Panel d'options ---
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
  
    // Options de liaison
    document
      .querySelectorAll('input[name="link-mode"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          settings.linkMode = e.target.value;
          drawWeave();
        });
      });
  
    // Thème de couleur
    document
      .querySelectorAll('input[name="color-theme"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          settings.colorTheme = e.target.value;
        });
      });
  
    // Afficher les mots
    document
      .getElementById("show-words-toggle")
      .addEventListener("change", (e) => {
        settings.showWords = e.target.checked;
        drawWeave();
      });
  
    // Animation de tissage
    document
      .getElementById("animate-lines-toggle")
      .addEventListener("change", (e) => {
        settings.animateLines = e.target.checked;
      });
  
    // Résonance
    document
      .getElementById("resonance-toggle")
      .addEventListener("change", (e) => {
        settings.enableResonance = e.target.checked;
        drawWeave();
      });
  
    // Timestamp
    document
      .getElementById("show-timestamp-toggle")
      .addEventListener("change", (e) => {
        settings.showTimestamp = e.target.checked;
        wordsList.innerHTML = "";
        updateWordList(displayedWords);
      });
  
    // Épaisseur des lignes
    document
      .getElementById("line-width")
      .addEventListener("input", (e) => {
        settings.lineWidth = parseInt(e.target.value);
        document.getElementById("line-width-value").textContent =
          e.target.value;
        drawWeave();
      });
  
    // --- UI ---
    togglePanelButton.addEventListener("click", () =>
      mainContainer.classList.toggle("panel-hidden")
    );
  
    downloadButton.addEventListener("click", () => {
      resizeCanvas();
      drawWeave(true);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.download = `tissage-bailleul-babiole-${date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
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
          drawWeave();
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
  
    // --- Init ---
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    setInterval(fetchWords, 2000); // Réduit pour mobile
    fetchWords();
  });