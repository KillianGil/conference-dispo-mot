document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('weave-canvas');
    const ctx = canvas.getContext('2d');
    const wordsList = document.getElementById('words-list');
    const wordForm = document.getElementById('word-form');
    const wordInput = document.getElementById('word-input');
    const mainContainer = document.getElementById('main-container');
    const togglePanelButton = document.getElementById('toggle-panel-button');
    const downloadButton = document.getElementById('download-button');
    const resetButton = document.getElementById('reset-button');

    // La seule source de vérité pour les mots. [plus récent, ..., plus ancien]
    let displayedWords = [];
    let hue = Math.random();

    // --- Limite de soumission désactivée pour les tests ---
    // const SUBMISSION_COUNT_KEY = 'tissageSubmissionCount';
    // let submissionCount = 0; // Ou parseInt(localStorage.getItem(SUBMISSION_COUNT_KEY) || '0');
    // function checkSubmissionLimit() { ... }

    // --- Configuration du Canvas ---
    function resizeCanvas() {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        drawWeave();
    }

    function drawWeave(withBackground = false) {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (withBackground) {
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Pour dessiner les lignes chronologiquement, on inverse la liste
        const chronoWords = [...displayedWords].reverse();
        if (chronoWords.length < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < chronoWords.length; i++) {
            const prevWord = chronoWords[i - 1];
            const currentWord = chronoWords[i];
            ctx.beginPath();
            ctx.moveTo(prevWord.x * width, prevWord.y * height);
            ctx.lineTo(currentWord.x * width, currentWord.y * height);
            ctx.strokeStyle = currentWord.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
        }
    }

    // --- Communication avec l'API Vercel ---
    async function fetchWords() {
        try {
            const response = await fetch(`/api/words?t=${Date.now()}`); // Anti-cache
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details || `Erreur ${response.status}`);
            }
            const fetchedWords = await response.json(); // API renvoie [plus récent, ..., plus ancien]

            // Mise à jour uniquement si nécessaire
            if (JSON.stringify(fetchedWords) !== JSON.stringify(displayedWords)) {
                displayedWords = fetchedWords;
                updateWordList();
                drawWeave();
            }
        } catch (error) {
            console.error("Erreur fetchWords:", error);
            // Optionnel : afficher une erreur à l'utilisateur si la récupération échoue
        }
    }

    function updateWordList() {
        wordsList.innerHTML = '';
        // displayedWords est déjà dans le bon ordre [plus récent, ..., plus ancien]
        displayedWords.forEach(word => {
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
    }

    // --- Soumission du Formulaire ---
    wordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = wordInput.value.trim();
        if (text.length === 0 || text.length > 50) return;

        const submitButton = wordForm.querySelector('button');
        const originalPlaceholder = wordInput.placeholder;
        wordInput.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = '...';

        const goldenRatioConjugate = 0.618033988749895;
        hue += goldenRatioConjugate;
        hue %= 1;
        const newColor = `hsl(${hue * 360}, 80%, 60%)`;
        
        const newWordPayload = { text, x: Math.random(), y: Math.random(), color: newColor };

        try {
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWordPayload),
            });

            // Vérifier si le POST a réussi (statut 201)
            if (!response.ok || response.status !== 201) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    // Si la réponse n'est pas du JSON valide
                    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.error || `Échec de la soumission (statut ${response.status})`);
            }
            
            // Si le POST réussit, vider l'input et rafraîchir la liste
            wordInput.value = '';
            await fetchWords(); // On redemande la liste complète pour être sûr

            // La logique de limitation est désactivée

        } catch (error) {
            console.error("Erreur d'ajout:", error);
            // Afficher l'erreur dans le placeholder pour le diagnostic
            wordInput.placeholder = error.message;
            wordInput.classList.add('ring-2', 'ring-red-500', 'placeholder-red-400');
            setTimeout(() => {
                wordInput.classList.remove('ring-2', 'ring-red-500', 'placeholder-red-400');
                wordInput.placeholder = originalPlaceholder;
            }, 5000); // Augmenté à 5s pour avoir le temps de lire
        } finally {
            // Réactiver le formulaire dans tous les cas
            wordInput.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Tisser';
            wordInput.focus();
        }
    });

    // --- Logique de l'Interface ---
    togglePanelButton.addEventListener('click', () => mainContainer.classList.toggle('panel-hidden'));

    downloadButton.addEventListener('click', () => {
        resizeCanvas();
        drawWeave(true);
        const link = document.createElement('a');
        link.download = `tissage-collaboratif-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        drawWeave(false);
    });

    resetButton.addEventListener('click', async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer tous les mots ?")) {
            try {
                const response = await fetch('/api/words', { method: 'DELETE' });
                if (!response.ok) throw new Error('La réinitialisation a échoué.');
                await fetchWords(); // Rafraîchir après suppression
            } catch (error) {
                console.error("Reset failed:", error);
                alert(error.message);
            }
        }
    });

    const qrButton = document.getElementById('qr-code-button');
    const qrModal = document.getElementById('qr-modal');
    const closeModalButton = document.getElementById('close-modal-button');
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

    // --- Démarrage et Polling ---
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setInterval(fetchWords, 1500); // Récupère les mots des autres utilisateurs
    fetchWords(); // Récupère les mots au chargement
});
