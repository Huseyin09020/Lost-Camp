const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ekran boyutunu ayarla
canvas.width = 800;
canvas.height = 500;

// Büyük Dünya Boyutları
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

// UI Elementleri
const healthEl = document.getElementById("health-val");
const timeEl = document.getElementById("time-val");
const woodEl = document.getElementById("wood-val");
const stoneEl = document.getElementById("stone-val");
const deviceModal = document.getElementById("device-modal");
const gameContainer = document.getElementById("game-container");
const mobileControls = document.getElementById("mobile-controls");
const pcControls = document.getElementById("pc-controls");

let isMobile = false;
let gameRunning = false;
let isDead = false;

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
  resetGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

// Oyuncu
const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  size: 22,
  speed: 4.5,
  health: 100,
  wood: 0,
  stone: 0,
  facing: 1 // 1: sağ, -1: sol
};

// Kamera
const camera = { x: 0, y: 0 };

let trees = [];
let rocks = [];
let monsters = [];
let base = null;
let gameTick = 0;
let isNight = false;

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "b") buildBase();
  if (isDead && (e.key === "Enter" || e.key === " ")) resetGame();
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mobil Tuşlar
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

// Oyunu Sıfırla / Başlat
function resetGame() {
  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  player.health = 100;
  player.wood = 0;
  player.stone = 0;
  base = null;
  monsters = [];
  gameTick = 0;
  isNight = false;
  isDead = false;

  trees = [];
  rocks = [];

  // Büyük haritaya 60 Ağaç
  for (let i = 0; i < 60; i++) {
    trees.push({
      x: Math.random() * (WORLD_WIDTH - 120) + 60,
      y: Math.random() * (WORLD_HEIGHT - 120) + 60,
      size: 32
    });
  }

  // Büyük haritaya 35 Taş
  for (let i = 0; i < 35; i++) {
    rocks.push({
      x: Math.random() * (WORLD_WIDTH - 120) + 60,
      y: Math.random() * (WORLD_HEIGHT - 120) + 60,
      size: 24
    });
  }

  updateUI();
}

// Üs Kurma
function buildBase() {
  if (base || isDead) return;
  if (player.wood >= 10 && player.stone >= 5) {
    player.wood -= 10;
    player.stone -= 5;
    base = { x: player.x - 45, y: player.y - 45, size: 90 };
    updateUI();
  }
}

// Oyuncu Hareketi ve Kamera Takibi
function updatePlayer() {
  if (isDead) return;

  let moving = false;
  if (keys["w"] || keys["arrowup"]) { player.y -= player.speed; moving = true; }
  if (keys["s"] || keys["arrowdown"]) { player.y += player.speed; moving = true; }
  if (keys["a"] || keys["arrowleft"]) { player.x -= player.speed; player.facing = -1; moving = true; }
  if (keys["d"] || keys["arrowright"]) { player.x += player.speed; player.facing = 1; moving = true; }

  // Dünya sınırları
  player.x = Math.max(player.size, Math.min(WORLD_WIDTH - player.size, player.x));
  player.y = Math.max(player.size, Math.min(WORLD_HEIGHT - player.size, player.y));

  // Kamera karakteri ortalar
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;

  // Kameranın harita dışına taşmasını engelle
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));
}

// Kaynak Toplama
function checkResources() {
  if (isDead) return;

  for (let i = trees.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - trees[i].x, player.y - trees[i].y);
    if (dist < player.size + trees[i].size) {
      trees.splice(i, 1);
      player.wood += 2;
      updateUI();
    }
  }

  for (let i = rocks.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y);
    if (dist < player.size + rocks[i].size) {
      rocks.splice(i, 1);
      player.stone += 1;
      updateUI();
    }
  }
}

// Gece Döngüsü ve Yaratıklar
function handleWorld() {
  if (isDead) return;
  gameTick++;

  // 700 karede bir döngü
  if (gameTick % 700 === 0) {
    isNight = !isNight;
    timeEl.innerText = isNight ? "Gece 🌙" : "Gündüz ☀️";
    timeEl.style.color = isNight ? "#e74c3c" : "#f1c40f";

    if (isNight) {
      // Oyuncunun çevresine 5 yaratık gönder
      for (let i = 0; i < 5; i++) {
        let spawnAngle = Math.random() * Math.PI * 2;
        let spawnDist = 450 + Math.random() * 200;
        monsters.push({
          x: player.x + Math.cos(spawnAngle) * spawnDist,
          y: player.y + Math.sin(spawnAngle) * spawnDist,
          size: 22,
          speed: 2.2
        });
      }
    } else {
      monsters = [];
    }
  }

  // Yaratık yapay zekası
  monsters.forEach(m => {
    let angle = Math.atan2(player.y - m.y, player.x - m.x);
    m.x += Math.cos(angle) * m.speed;
    m.y += Math.sin(angle) * m.speed;

    let dist = Math.hypot(player.x - m.x, player.y - m.y);
    if (dist < player.size + m.size) {
      let inBase = base && (player.x > base.x && player.x < base.x + base.size &&
                            player.y > base.y && player.y < base.y + base.size);
      player.health -= inBase ? 0.2 : 0.7;

      if (player.health <= 0) {
        player.health = 0;
        isDead = true;
      }
      updateUI();
    }
  });
}

function updateUI() {
  healthEl.innerText = Math.max(0, Math.floor(player.health));
  woodEl.innerText = player.wood;
  stoneEl.innerText = player.stone;
}

// Karakter Çizimi
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (player.facing === -1) ctx.scale(-1, 1);

  // Gövde (Zırh / Kıyafet)
  ctx.fillStyle = "#2980b9";
  ctx.fillRect(-10, -14, 20, 26);

  // Kafa
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);
  ctx.fill();

  // Göz
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(3, -24, 3, 3);

  // Kılıç
  ctx.fillStyle = "#bdc3c7";
  ctx.fillRect(8, -8, 14, 4);
  ctx.fillStyle = "#7f8c8d";
  ctx.fillRect(8, -11, 3, 10);

  ctx.restore();
}

// Yaratık Çizimi
function drawMonster(x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Canavar Gövdesi (Karanlık Kurt/İblis)
  ctx.fillStyle = "#8e1b1b";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Kırmızı Parlayan Gözler
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(-5, -4, 4, 0, Math.PI * 2);
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Sivri Dişler
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-6, 6); ctx.lineTo(-3, 12); ctx.lineTo(0, 6);
  ctx.moveTo(0, 6); ctx.lineTo(3, 12); ctx.lineTo(6, 6);
  ctx.fill();

  ctx.restore();
}

// Ağaç Çizimi
function drawTree(x, y) {
  // Gövde
  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(x - 8, y, 16, 26);

  // Yaprak Katmanları
  ctx.fillStyle = "#1e824c";
  ctx.beginPath();
  ctx.arc(x, y - 10, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(x - 5, y - 15, 18, 0, Math.PI * 2);
  ctx.fill();
}

// Taş Çizimi
function drawRock(x, y, size) {
  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#95a5a6";
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Ekrana Çizdirme
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Kamerayı karaktere odakla
  ctx.translate(-camera.x, -camera.y);

  // Zemin ve Grid Çizgileri
  ctx.fillStyle = isNight ? "#142615" : "#44782b";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Harita sınır çizgisi
  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Üs (Sığınak Kulübesi)
  if (base) {
    ctx.fillStyle = "#d35400";
    ctx.fillRect(base.x, base.y, base.size, base.size);
    // Çatı
    ctx.fillStyle = "#b93e00";
    ctx.beginPath();
    ctx.moveTo(base.x - 10, base.y);
    ctx.lineTo(base.x + base.size / 2, base.y - 30);
    ctx.lineTo(base.x + base.size + 10, base.y);
    ctx.fill();
    // Kapı
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(base.x + base.size / 2 - 12, base.y + base.size - 28, 24, 28);
  }

  // Taşlar
  rocks.forEach(r => drawRock(r.x, r.y, r.size));

  // Ağaçlar
  trees.forEach(t => drawTree(t.x, t.y));

  // Karakter
  if (!isDead) {
    drawPlayer(player.x, player.y);
  }

  // Yaratıklar
  monsters.forEach(m => drawMonster(m.x, m.y));

  ctx.restore();

  // Ölüm Ekranı
  if (isDead) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HAYATTA KALAMADIN!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px sans-serif";
    ctx.fillText(isMobile ? "Yeniden başlamak için ekrana dokun" : "Yeniden başlamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 30);
  }
}

// Mobilde ölüm ekranına tıklayınca dirilme
canvas.addEventListener("click", () => {
  if (isDead) resetGame();
});

// Oyun Döngüsü
function gameLoop() {
  if (gameRunning) {
    updatePlayer();
    checkResources();
    handleWorld();
    render();
  }
  requestAnimationFrame(gameLoop);
}
