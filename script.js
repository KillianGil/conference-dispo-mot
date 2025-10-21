document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const canvas = document.getElementById('weave-canvas');
    const ctx = canvas.getContext('2d');
    const wordsList = document.getElementById('words-list');
    const wordForm = document.getElementById('word-form');
    const wordInput = document.getElementById('word-input');
    const mainContainer = document.getElementById('main-container');
    const togglePanelButton = document.getElementById('toggle-panel-button');
    const downloadButton = document.getElementById('download-button');
    const resetButton = document.getElementById('reset-button');

    // La seule source de vérité pour les mots, stockée dans l'ordre chronologique.
    let wordsData = [];

    // --- FONCTION CENTRALE DE MISE À JOUR ---
    // Cette fonction unique est maintenant responsable de tout l'affichage.
    // Elle est appelée chaque fois que les données changent.
    function updateUI(newWords) {
        wordsData = newWords;
        
        // 1. Mettre à jour la liste de mots (le plus récent en haut)
        wordsList.innerHTML = '';
        [...wordsData].reverse().forEach(word => {
            const li = document.createElement('li');
            li.className = 'word-item p-3 rounded-lg flex items-center';
            li.style.backgroundColor = word.color + '20';
            const colorDot = document.createElement('span');
            colorDot.className = 'w-3 h-3 rounded-full mr-3 flex-shrink-0';
            colorDot.style.backgroundColor = word.color;
            const textSpan = document.createElement('span');
            textSpan.textContent = word.text;
            textSpan.className = 'text-gray-200 truncate';
            li.appendChild(colorDot);
            li.appendChild(textSpan);
            wordsList.appendChild(li);
        });

        // 2. Redessiner le canvas
        drawWeave();
    }
    
    // --- Dessin du Canvas ---
    function drawWeave(withBackground = false) {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (withBackground) { ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        
        // On dessine dans l'ordre chronologique, pas besoin d'inverser.
        if (wordsData.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < wordsData.length; i++) {
            const prevWord = wordsData[i - 1]; 
            const currentWord = wordsData[i];
            ctx.beginPath();
            ctx.moveTo(prevWord.x * width, prevWord.y * height);
            ctx.lineTo(currentWord.x * width, currentWord.y * height);
            ctx.strokeStyle = currentWord.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
        }
    }

    // --- Communication avec l'API ---
    async function fetchWords() {
        try {
            const response = await fetch(`/api/words?t=${Date.now()}`); // Anti-cache
            if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
            const fetchedWords = await response.json();
            // On ne compare plus, on met à jour directement. C'est plus fiable.
            updateUI(fetchedWords);
        } catch (error) { console.error("Erreur fetchWords:", error); }
    }

    // --- Soumission du Formulaire ---
    wordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = wordInput.value.trim();
        if (text.length === 0) return;

        const submitButton = wordForm.querySelector('button');
        const originalPlaceholder = wordInput.placeholder;
        wordInput.disabled = true; submitButton.disabled = true; submitButton.textContent = '...';
        wordInput.classList.remove('ring-2', 'ring-red-500', 'placeholder-red-400');
        wordInput.placeholder = originalPlaceholder;

        const newColor = `hsl(${(Math.random() * 360)}, 80%, 60%)`;
        const newWordPayload = { text, x: Math.random(), y: Math.random(), color: newColor };

        try {
            const response = await fetch('/api/words', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newWordPayload),
            });

            if (!response.ok || response.status !== 201) {
                 let errorMsg = `Erreur serveur (${response.status})`;
                 try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(err) {}
                 throw new Error(errorMsg);
            }
            
            // Si le POST réussit, on vide l'input et on force la mise à jour.
            wordInput.value = '';
            await fetchWords();

        } catch (error) {
            console.error("Erreur d'ajout:", error);
            wordInput.placeholder = error.message;
            wordInput.classList.add('ring-2', 'ring-red-500', 'placeholder-red-400');
        } finally {
            wordInput.disabled = false; submitButton.disabled = false; submitButton.textContent = 'Tisser';
            wordInput.focus();
        }
    });

    // --- Logique de l'Interface (QR, Download, Reset, etc.) ---
    function setupUIListeners() {
        const qrButton = document.getElementById('qr-code-button');
        const qrModal = document.getElementById('qr-modal');
        const closeModalButton = document.getElementById('close-modal-button');

        togglePanelButton.addEventListener('click', () => mainContainer.classList.toggle('panel-hidden'));
        downloadButton.addEventListener('click', () => {
            const dpr = window.devicePixelRatio || 1;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.clientWidth * dpr;
            tempCanvas.height = canvas.clientHeight * dpr;
            tempCtx.scale(dpr, dpr);
            
            // On utilise une copie temporaire pour dessiner avec le fond
            const originalWords = wordsData;
            wordsData = [...originalWords]; // Cloner pour la fonction de dessin
            drawWeave.call({ ctx: tempCtx, canvas: tempCanvas }, true);
            wordsData = originalWords; // Restaurer

            const link = document.createElement('a');
            link.download = `tissage-collaboratif-${new Date().toISOString().split('T')[0]}.png`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        });

        resetButton.addEventListener('click', async () => {
            if (confirm("Supprimer tous les mots ? Cette action est irréversible.")) {
                try {
                    await fetch('/api/words', { method: 'DELETE' });
                    await fetchWords(); // Rafraîchir
                } catch (err) { alert('La réinitialisation a échoué.'); }
            }
        });

        function showQrCode() {
            const qr = qrcode(0, 'L');
            qr.addData(window.location.href);
            qr.make();
            document.getElementById('qrcode-display').innerHTML = qr.createImgTag(6, 8);
            qrModal.classList.remove('hidden');
        }
        function hideQrCode() { qrModal.classList.add('hidden'); }
        
        qrButton.addEventListener('click', showQrCode);
        closeModalButton.addEventListener('click', hideQrCode);
        qrModal.addEventListener('click', (e) => { if (e.target === qrModal) hideQrCode(); });
    }

    // --- Démarrage de l'application ---
    function init() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        setupUIListeners();
        window.addEventListener('resize', resizeCanvas);
        setInterval(fetchWords, 2000); // Récupère les mots des autres toutes les 2s
        fetchWords(); // Récupère les mots au chargement
    }

    init();
});

