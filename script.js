const canvas = document.getElementById('tissage');
const ctx = canvas.getContext('2d');
const wordList = document.getElementById('wordList');
const wordInput = document.getElementById('wordInput');
const sendButton = document.getElementById('sendButton');

canvas.width = canvas.parentElement.clientWidth;
canvas.height = canvas.parentElement.clientHeight;

let mots = [];
let connections = [];

// Fonction pour récupérer les mots depuis l'API
async function fetchMots() {
  try {
    const res = await fetch('/api/words');
    const data = await res.json();
    mots = data;

    // Construire les connexions si elles n'existent pas encore
    connections = [];
    mots.forEach((m, i) => {
      if(i>0){
        const index = Math.floor(Math.random() * i);
        connections.push({from:index, to:i, color:m.color});
      }
    });

    updateWordList();
    drawCanvas();
  } catch(err) {
    console.error(err);
  }
}

// Fonction pour ajouter un mot
async function addMot(word){
  const data = {
    text: word,
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    color: `rgb(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`
  };
  try {
    await fetch('/api/words', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    fetchMots(); // rafraîchir
  } catch(err){
    console.error(err);
  }
}

// Envoyer un mot
sendButton.addEventListener('click', ()=>{
  const word = wordInput.value.trim();
  if(word) {
    addMot(word);
    wordInput.value = '';
  }
});

// Liste des mots
function updateWordList(){
  wordList.innerHTML = '';
  mots.forEach(m=>{
    const li = document.createElement('li');
    li.textContent = m.text;
    wordList.appendChild(li);
  });
}

// Dessiner le canvas
function drawCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  connections.forEach(conn=>{
    const from = mots[conn.from];
    const to = mots[conn.to];
    ctx.strokeStyle = conn.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  });
}

// Redimensionner
window.addEventListener('resize', ()=>{
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  drawCanvas();
});

// Refresh automatique toutes les 2 secondes pour voir les mots des autres
setInterval(fetchMots, 2000);

// Initial fetch
fetchMots();