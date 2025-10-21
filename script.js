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
  
      const chronoWords = [...displayedWords].reverse();
      if (chronoWords.length < 2) return;
  
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.8;
  
      for (let i = 1; i < chronoWords.length; i++) {
        const prevWord = chronoWords[i - 1];
        const currentWord = chronoWords[i];
        if (
          typeof prevWord.x !== "number" ||
          typeof prevWord.y !== "number" ||
          typeof currentWord.x !== "number" ||
          typeof currentWord.y !== "number"
        )
          continue;
  
        ctx.beginPath();
        ctx.moveTo(prevWord.x * width, prevWord.y * height);
        ctx.lineTo(currentWord.x * width, currentWord.y * height);
        ctx.strokeStyle = currentWord.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  
    // --- API ---
    async function fetchWords() {
      try {
        const response = await fetch(`/api/words?t=${Date.now()}`);
        if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
        const fetchedWords = await response.json();
  
        console.log("📥 Données KV reçues:", fetchedWords);
  
        // Forcer la mise à jour pour éviter les problèmes de comparaison JSON
        displayedWords = fetchedWords || [];
        updateWordList();
        drawWeave();
      } catch (error) {
        console.error("Erreur fetchWords:", error);
      }
    }
  
    function updateWordList() {
      wordsList.innerHTML = "";
  
      displayedWords.forEach((word) => {
        if (!word.text || !word.color) return;
  
        const li = document.createElement("li");
        li.className = "word-item p-3 rounded-lg flex items-center";
        li.style.backgroundColor = word.color + "20";
  
        const colorDot = document.createElement("span");
        colorDot.className = "w-3 h-3 rounded-full mr-3 flex-shrink-0";
        colorDot.style.backgroundColor = word.color;
  
        const textSpan = document.createElement("span");
        textSpan.textContent = word.text;
        textSpan.className = "text-gray-200 truncate";
  
        li.appendChild(colorDot);
        li.appendChild(textSpan);
        wordsList.appendChild(li);
      });
    }
  
    // --- Soumission ---
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
          await fetchWords();
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
  
    // --- Init ---
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    setInterval(fetchWords, 1500);
    fetchWords();
  });