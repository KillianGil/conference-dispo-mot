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

    // The single source of truth for our words. Stored [newest, ... , oldest]
    let displayedWords = [];
    let hue = Math.random();

    // --- Submission Limit (2 words per user) ---
    const SUBMISSION_COUNT_KEY = 'tissageSubmissionCount';
    let submissionCount = parseInt(localStorage.getItem(SUBMISSION_COUNT_KEY) || '0');

    function checkSubmissionLimit() {
        if (submissionCount >= 2) {
            wordInput.placeholder = 'Merci pour votre participation !';
            wordInput.disabled = true;
            wordForm.querySelector('button').disabled = true;
            wordForm.querySelector('button').classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // --- Canvas Setup ---
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

    // --- Vercel API Communication ---
    async function fetchWords() {
        try {
            const response = await fetch(`/api/words?t=${Date.now()}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details || 'Failed to fetch words');
            }
            const fetchedWords = await response.json();

            // Use a robust check to see if the data has changed.
            if (JSON.stringify(fetchedWords) !== JSON.stringify(displayedWords)) {
                displayedWords = fetchedWords;
                updateWordList();
                drawWeave();
            }
        } catch (error) {
            console.error("Failed to fetch words:", error);
        }
    }

    function updateWordList() {
        wordsList.innerHTML = '';
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

    // --- Form Submission ---
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Échec de la soumission');
            }

            // ** THE FIX IS HERE: Optimistic Update **
            // The API returns the word it just created. We use it directly.
            const { word: newWordFromServer } = await response.json();

            // Add the new word to the top of our local list
            displayedWords.unshift(newWordFromServer);
            
            // Immediately update the UI without waiting for the next poll
            updateWordList();
            drawWeave();

            wordInput.value = '';
            submissionCount++;
            localStorage.setItem(SUBMISSION_COUNT_KEY, submissionCount);
            checkSubmissionLimit();

        } catch (error) {
            console.error("Error adding word: ", error);
            wordInput.placeholder = error.message;
            wordInput.classList.add('ring-2', 'ring-red-500', 'placeholder-red-400');
            setTimeout(() => {
                wordInput.classList.remove('ring-2', 'ring-red-500', 'placeholder-red-400');
                wordInput.placeholder = originalPlaceholder;
            }, 4000);
        } finally {
            if (submissionCount < 2) {
                wordInput.disabled = false;
                submitButton.disabled = false;
                submitButton.textContent = 'Tisser';
                wordInput.focus();
            }
        }
    });

    // --- UI Logic (Panel, Download, QR, Reset) ---
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
        if (confirm("Êtes-vous sûr de vouloir supprimer tous les mots et réinitialiser l'œuvre ? Cette action est irréversible.")) {
            try {
                const response = await fetch('/api/words', { method: 'DELETE' });
                if (!response.ok) throw new Error('La réinitialisation a échoué.');
                localStorage.removeItem(SUBMISSION_COUNT_KEY);
                window.location.reload();
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

    // --- Initial Setup & Polling for other users' updates ---
    window.addEventListener('resize', resizeCanvas);
    checkSubmissionLimit();
    resizeCanvas();
    setInterval(fetchWords, 2000); // Check for others' words every 2 seconds
    fetchWords(); // Initial fetch
});

