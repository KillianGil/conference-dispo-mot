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
    let settings = {
      linkMode: "chronological", // 'chronological', 'proximity', 'color'
      showWords: true,
      animateLines: true,
      lineWidth: 2,
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
      return Math.abs(hsl1[0] - hsl2[0]); // Différence de teinte
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
      ctx.globalAlpha = 0.6;
  
      // Créer les connexions selon le mode
      let connections = [];
  
      if (settings.linkMode === "chronological") {
        const chronoWords = [...displayedWords].reverse();
        for (let i = 1; i < chronoWords.length; i++) {
          connections.push([chronoWords[i - 1], chronoWords[i]]);
        }
      } else if (settings.linkMode === "proximity") {
        // Connecter chaque mot à ses 2 plus proches voisins
        displayedWords.forEach((word) => {
          const distances = displayedWords
            .filter((w) => w !== word)
            .map((w) => ({ word: w, dist: distance(word, w) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
          distances.forEach((d) => connections.push([word, d.word]));
        });
      } else if (settings.linkMode === "color") {
        // Connecter les mots de couleurs similaires
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
      }
  
      // Dessiner les connexions
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
  
        ctx.beginPath();
        ctx.moveTo(word1.x * width, word1.y * height);
        ctx.lineTo(word2.x * width, word2.y * height);
        ctx.strokeStyle = word2.color;
        ctx.lineWidth = settings.lineWidth;
        ctx.stroke();
      });
  
      // Dessiner les mots sur le canvas
      if (settings.showWords) {
        ctx.globalAlpha = 1;
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
  
        displayedWords.forEach((word) => {
          const x = word.x * width;
          const y = word.y * height;
  
          // Ombre
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillText(word.text, x + 1, y + 1);
  
          // Texte
          ctx.fillStyle = word.color;
          ctx.fillText(word.text, x, y);
        });
      }
    }
  
    // --- API sans animation sur les mots existants ---
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
                dw.text === fw.text &&
                dw.timestamp === fw.timestamp
            )
        );
  
        displayedWords = fetchedWords;
        updateWordList(newWords);
        drawWeave();
      } catch (error) {
        console.error("Erreur fetchWords:", error);
      }
    }
  
    // --- Mise à jour de la liste (animation seulement pour les nouveaux) ---
    function updateWordList(newWords = []) {
      // Supprimer les anciens éléments non présents
      const existingItems = Array.from(
        wordsList.querySelectorAll(".word-item")
      );
      const currentTexts = displayedWords.map((w) => w.text);
  
      existingItems.forEach((item) => {
        if (!currentTexts.includes(item.dataset.text)) {
          item.remove();
        }
      });
  
      // Ajouter seulement les nouveaux mots
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
        textSpan.className = "text-gray-200 truncate";
  
        li.appendChild(colorDot);
        li.appendChild(textSpan);
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
  
      const newColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
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
        await fetchWords();
      } catch (error) {
        console.error("Erreur d'ajout:", error);
        wordInput.placeholder = error.message;
      } finally {
        wordInput.disabled = false;
        submitButton.disabled = false;
        submitButton.textContent = "Tisser";
        wordInput.focus();
        wordInput.placeholder = originalPlaceholder;
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
  
    // Afficher les mots sur le canvas
    document
      .getElementById("show-words-toggle")
      .addEventListener("change", (e) => {
        settings.showWords = e.target.checked;
        drawWeave();
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
      link.download = `tissage-${new Date()
        .toISOString()
        .split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      drawWeave(false);
    });
  
    resetButton.addEventListener("click", async () => {
      if (confirm("Supprimer tous les mots ?")) {
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
    setInterval(fetchWords, 1500);
    fetchWords();
  });