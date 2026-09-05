const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Arayüz Elementleri
const healthEl = document.getElementById("health-val");
const timeEl = document.getElementById("time-val");
const woodEl = document.getElementById("wood-val");
const stoneEl = document.getElementById("stone-val");
const deviceModal = document.getElementById("device-modal");
const gameContainer = document.getElementById("game-container");
const mobileControls = document.getElementById("mobile-controls");
const pcControls = document.getElementById("pc-controls");

// Oyun Durumu
let isMobile = false;
let gameRunning = false;

// Cihaz Seçimi
document.getElementById("btn-pc").addEventListener("click", () => startGame(false));
document.getElementById("btn-mobile").addEventListener("click", () => startGame(true));

function startGame(mobile) {
  isMobile = mobile;
  deviceModal.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  if (isMobile) {
    mobileControls.classList.remove("hidden");
    pcControls.classList.add("hidden");
  }
  initGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

// Oyuncu Nesnesi
const player = {
  x: 400,
  y: 250,
  size: 20,
  speed: 4,
  health: 100,
  wood: 0,
  stone: 0
};

// Dünya Nesneleri
let trees = [];
let rocks = [];
let monsters = [];
let base = null;

// Zaman Döngüsü
let gameTick = 0;
let isNight = false;

// Tuş Takibi
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "b") buildBase();
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mobil Tuş Bağlantıları
function setupTouchButton(id, key) {
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[key] = false; });
  btn.addEventListener("mousedown", () => { keys[key] = true; });
  btn.addEventListener("mouseup", () => { keys[key] = false; });
}
setupTouchButton("btn-up", "w");
setupTouchButton("btn-down", "s");
setupTouchButton("btn-left", "a");
setupTouchButton("btn-right", "d");
document.getElementById("btn-build").addEventListener("click", buildBase);

// Dünyayı Başlat
function initGame() {
  trees = [];
  rocks = [];
  monsters = [];
  
  // Rastgele 12 Ağaç
  for (let i = 0; i < 12; i++) {
    trees.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      size: 24
    });
  }

  // Rastgele 8 Taş
  for (let i = 0; i < 8; i++) {
    rocks.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      size: 18
    });
  }
}

// Üs Kurma Mantığı
function buildBase() {
  if (base) return;
  if (player.wood >= 10 && player.stone >= 5) {
    player.wood -= 10;
    player.stone -= 5;
    base = { x: player.x - 25, y: player.y - 25, size: 50 };
    updateUI();
  }
}

// Oyuncu Hareketi ve Sınırlar
function updatePlayer() {
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;

  // Harita sınırları
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

// Kaynak Toplama
function checkResourceGathering() {
  // Ağaçlar
  for (let i = trees.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - trees[i].x, player.y - trees[i].y);
    if (dist < player.size + trees[i].size) {
      trees.splice(i, 1);
      player.wood += 2;
      updateUI();
    }
  }

  // Taşlar
  for (let i = rocks.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y);
    if (dist < player.size + rocks[i].size) {
      rocks.splice(i, 1);
      player.stone += 1;
      updateUI();
    }
  }
}

// Gece/Gündüz ve Canavarlar
function handleEnvironment() {
  gameTick++;
  
  // Her 800 karede bir gece/gündüz değişimi
  if (gameTick % 800 === 0) {
    isNight = !isNight;
    timeEl.innerText = isNight ? "Gece 🌙" : "Gündüz ☀️";
    timeEl.style.color = isNight ? "#e74c3c" : "#f1c40f";

    // Gece olduysa canavar üret
    if (isNight) {
      for (let i = 0; i < 3; i++) {
        monsters.push({
          x: Math.random() < 0.5 ? 10 : canvas.width - 10,
          y: Math.random() * canvas.height,
          size: 16,
          speed: 1.8
        });
      }
    } else {
      monsters = []; // Gündüz olunca canavarlar kaybolur
    }
  }

  // Canavar Hareketi
  monsters.forEach(m => {
    let angle = Math.atan2(player.y - m.y, player.x - m.x);
    m.x += Math.cos(angle) * m.speed;
    m.y += Math.sin(angle) * m.speed;

    // Oyuncuya temas kontrolü
    let dist = Math.hypot(player.x - m.x, player.y - m.y);
    if (dist < player.size + m.size) {
      // Eğer oyuncu üssün içindeyse daha az hasar alır
      let inBase = base && (player.x > base.x && player.x < base.x + base.size &&
                            player.y > base.y && player.y < base.y + base.size);
      player.health -= inBase ? 0.2 : 0.6;
      if (player.health <= 0) {
        player.health = 0;
        alert("Hayatta kalamadın! Oyun yeniden başlayacak.");
        location.reload();
      }
      updateUI();
    }
  });
}

function updateUI() {
  healthEl.innerText = Math.floor(player.health);
  woodEl.innerText = player.wood;
  stoneEl.innerText = player.stone;
}

// Çizim
function render() {
  // Arka plan rengi (gece karartması)
  ctx.fillStyle = isNight ? "#172912" : "#4a752c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Üs Çizimi
  if (base) {
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(base.x, base.y, base.size, base.size);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(base.x, base.y, base.size, base.size);
  }

  // Taşlar
  rocks.forEach(r => {
    ctx.fillStyle = "#7f8c8d";
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ağaçlar
  trees.forEach(t => {
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e8449";
    ctx.beginPath();
    ctx.arc(t.x - 4, t.y - 4, t.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Oyuncu
  ctx.fillStyle = "#3498db";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Canavarlar
  monsters.forEach(m => {
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Ana Oyun Döngüsü
function gameLoop() {
  if (!gameRunning) return;
  updatePlayer();
  checkResourceGathering();
  handleEnvironment();
  render();
  requestAnimationFrame(gameLoop);
}
