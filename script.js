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

    let displayedWords = [];
    let hue = Math.random();

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
        if (withBackground) { ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        if (displayedWords.length < 2) {
            console.log('Not enough words to draw (need at least 2, have', displayedWords.length, ')');
            return;
        }
        console.log('Drawing weave with', displayedWords.length, 'words');
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < displayedWords.length; i++) {
            const prevWord = displayedWords[i - 1]; 
            const currentWord = displayedWords[i];
            ctx.beginPath();
            ctx.moveTo(prevWord.x * width, prevWord.y * height);
            ctx.lineTo(currentWord.x * width, currentWord.y * height);
            ctx.strokeStyle = currentWord.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
            ctx.stroke();
        }
    }

    // --- Communication avec l'API ---
    async function fetchWords() {
        try {
            console.log('Fetching words from API...');
            const response = await fetch(`/api/words?t=${Date.now()}`); // Anti-cache
            if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
            const fetchedWords = await response.json();
            console.log('Received words:', fetchedWords.length);
            
            // Toujours mettre à jour si le nombre de mots ou le contenu change
            const needsUpdate = displayedWords.length !== fetchedWords.length || 
                                JSON.stringify(fetchedWords) !== JSON.stringify(displayedWords);
            
            if (needsUpdate) {
                console.log('Updating display with new words');
                displayedWords = fetchedWords;
                updateWordList();
                drawWeave();
            }
        } catch (error) { 
            console.error("Erreur fetchWords:", error); 
        }
    }

    function updateWordList() {
        console.log('Updating word list, total words:', displayedWords.length);
        wordsList.innerHTML = '';
        displayedWords.forEach(word => {
            const li = document.createElement('li'); li.className = 'word-item p-3 rounded-lg flex items-center'; li.style.backgroundColor = word.color + '20';
            const colorDot = document.createElement('span'); colorDot.className = 'w-3 h-3 rounded-full mr-3 flex-shrink-0'; colorDot.style.backgroundColor = word.color;
            const textSpan = document.createElement('span'); textSpan.textContent = word.text; textSpan.className = 'text-gray-200 truncate';
            li.appendChild(colorDot); li.appendChild(textSpan); wordsList.appendChild(li);
        });
    }

    // --- Soumission du Formulaire ---
    wordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = wordInput.value.trim();
        if (text.length === 0) return; // Ne rien faire si le champ est vide

        console.log('Submitting word:', text);
        const submitButton = wordForm.querySelector('button');
        const originalPlaceholder = wordInput.placeholder; // Sauvegarder le placeholder
        wordInput.disabled = true; submitButton.disabled = true; submitButton.textContent = '...';
        wordInput.classList.remove('ring-2', 'ring-red-500', 'placeholder-red-400'); // Réinitialiser l'erreur visuelle
        wordInput.placeholder = originalPlaceholder; // Restaurer le placeholder normal

        const newColor = `hsl(${(Math.random() * 360)}, 80%, 60%)`;
        const newWordPayload = { text, x: Math.random(), y: Math.random(), color: newColor };

        try {
            const response = await fetch('/api/words', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(newWordPayload),
            });

            console.log('POST response status:', response.status);

            // Vérifier si le POST a réussi (statut 201 attendu)
            if (!response.ok) {
                 let errorMsg = `Erreur serveur (${response.status})`;
                 try {
                     const errorData = await response.json();
                     errorMsg = errorData.error || errorMsg;
                     console.error('Server error:', errorData);
                 } catch(e) {
                    console.error('Could not parse error response');
                 }
                 throw new Error(errorMsg);
            }
            
            // Récupérer la liste mise à jour directement depuis la réponse du POST
            const updatedWords = await response.json();
            console.log('Received updated words from POST:', updatedWords.length);
            
            // Mettre à jour immédiatement l'affichage avec les données reçues
            displayedWords = updatedWords;
            updateWordList();
            drawWeave();
            
            // Vider l'input seulement après succès
            wordInput.value = '';

        } catch (error) {
            console.error("Erreur d'ajout:", error);
            wordInput.placeholder = error.message; // Afficher l'erreur dans le champ
            wordInput.classList.add('ring-2', 'ring-red-500', 'placeholder-red-400');
        } finally {
            // Réactiver le formulaire dans tous les cas pour permettre une nouvelle tentative
            wordInput.disabled = false; submitButton.disabled = false; submitButton.textContent = 'Tisser';
            wordInput.focus();
        }
    });

    // --- Logique UI ---
    togglePanelButton.addEventListener('click', () => mainContainer.classList.toggle('panel-hidden'));
    downloadButton.addEventListener('click', () => { resizeCanvas(); drawWeave(true); const link = document.createElement('a'); link.download = `tissage-${new Date().toISOString().split('T')[0]}.png`; link.href = canvas.toDataURL('image/png'); link.click(); drawWeave(false); });
    resetButton.addEventListener('click', async () => { if (confirm("Supprimer tous les mots ?")) { try { await fetch('/api/words', { method: 'DELETE' }); await fetchWords(); } catch (err) { alert('La réinitialisation a échoué.'); } } });
    const qrButton = document.getElementById('qr-code-button'); const qrModal = document.getElementById('qr-modal'); const closeModalButton = document.getElementById('close-modal-button');
    function showQrCode() { const qr = qrcode(0, 'L'); qr.addData(window.location.href); qr.make(); document.getElementById('qrcode-display').innerHTML = qr.createImgTag(6, 8); qrModal.classList.remove('hidden'); }
    function hideQrCode() { qrModal.classList.add('hidden'); }
    qrButton.addEventListener('click', showQrCode);
    closeModalButton.addEventListener('click', hideQrCode);
    qrModal.addEventListener('click', (e) => { if (e.target === qrModal) hideQrCode(); });

    // --- Démarrage ---
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setInterval(fetchWords, 1500); // Récupère les mots des autres utilisateurs toutes les 1.5s
    fetchWords(); // Récupère les mots au chargement initial
});