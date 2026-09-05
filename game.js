const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

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

// Oyuncu Nesnesi
const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  size: 22,
  speed: 4.5,
  health: 100,
  maxHealth: 100,
  wood: 0,
  stone: 0,
  facing: 1, // 1: sağ, -1: sol
  isAttacking: false,
  attackTimer: 0
};

const camera = { x: 0, y: 0 };
let trees = [];
let rocks = [];
let monsters = [];
let meats = []; // Düşen etler
let base = null;
let gameTick = 0;
let isNight = false;

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "b") buildBase();
  if (e.key === " " && !isDead) attack();
  if (isDead && (e.key === "Enter" || e.key === " ")) resetGame();
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// PC Tıklama ile Saldırı
canvas.addEventListener("mousedown", () => {
  if (!isDead && gameRunning) attack();
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
document.getElementById("btn-attack").addEventListener("click", () => {
  if (!isDead) attack();
});

// Saldırı Eylemi
function attack() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12; // 12 kare kılıç savrulur

  const attackRange = 65;
  // Baktığı yöndeki canavarlara vur
  monsters.forEach(m => {
    let dx = m.x - player.x;
    let dy = m.y - player.y;
    let dist = Math.hypot(dx, dy);

    // Mesafe ve önünde olma kontrolü
    let inFront = (player.facing === 1 && dx > -10) || (player.facing === -1 && dx < 10);
    if (dist < attackRange && inFront) {
      m.health -= 35; // Kılıç vuruş gücü
      // Canavarı hafifçe geriye savur (Knockback)
      m.x += (player.facing * 30);
    }
  });
}

function spawnTree() {
  trees.push({
    x: Math.random() * (WORLD_WIDTH - 120) + 60,
    y: Math.random() * (WORLD_HEIGHT - 120) + 60,
    size: 32
  });
}

function spawnRock() {
  rocks.push({
    x: Math.random() * (WORLD_WIDTH - 120) + 60,
    y: Math.random() * (WORLD_HEIGHT - 120) + 60,
    size: 24
  });
}

function resetGame() {
  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  player.health = 100;
  player.wood = 0;
  player.stone = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  base = null;
  monsters = [];
  meats = [];
  gameTick = 0;
  isNight = false;
  isDead = false;

  trees = [];
  rocks = [];

  for (let i = 0; i < 60; i++) spawnTree();
  for (let i = 0; i < 35; i++) spawnRock();

  updateUI();
}

function buildBase() {
  if (base || isDead) return;
  if (player.wood >= 10 && player.stone >= 5) {
    player.wood -= 10;
    player.stone -= 5;
    base = { x: player.x - 55, y: player.y - 55, size: 110 };
    updateUI();
  }
}

function isInsideBase(target) {
  if (!base) return false;
  return (
    target.x >= base.x &&
    target.x <= base.x + base.size &&
    target.y >= base.y &&
    target.y <= base.y + base.size
  );
}

function updatePlayer() {
  if (isDead) return;

  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) { player.x -= player.speed; player.facing = -1; }
  if (keys["d"] || keys["arrowright"]) { player.x += player.speed; player.facing = 1; }

  player.x = Math.max(player.size, Math.min(WORLD_WIDTH - player.size, player.x));
  player.y = Math.max(player.size, Math.min(WORLD_HEIGHT - player.size, player.y));

  // Saldırı sayacı
  if (player.isAttacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) player.isAttacking = false;
  }

  // Üste can yenilenmesi
  if (isInsideBase(player) && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + 0.15);
    updateUI();
  }

  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));
}

function checkResources() {
  if (isDead) return;

  // Ağaç
  for (let i = trees.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - trees[i].x, player.y - trees[i].y);
    if (dist < player.size + trees[i].size) {
      trees.splice(i, 1);
      player.wood += 2;
      updateUI();
    }
  }

  // Taş
  for (let i = rocks.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - rocks[i].x, player.y - rocks[i].y);
    if (dist < player.size + rocks[i].size) {
      rocks.splice(i, 1);
      player.stone += 1;
      updateUI();
    }
  }

  // Yerdeki Etleri Toplama (+25 Can)
  for (let i = meats.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - meats[i].x, player.y - meats[i].y);
    if (dist < player.size + meats[i].size) {
      meats.splice(i, 1);
      player.health = Math.min(player.maxHealth, player.health + 25);
      updateUI();
    }
  }
}

function handleWorld() {
  if (isDead) return;
  gameTick++;

  if (gameTick % 120 === 0) {
    if (trees.length < 35) spawnTree();
    if (rocks.length < 20) spawnRock();
  }

  // Gece / Gündüz
  if (gameTick % 700 === 0) {
    isNight = !isNight;
    timeEl.innerText = isNight ? "Gece 🌙" : "Gündüz ☀️";
    timeEl.style.color = isNight ? "#e74c3c" : "#f1c40f";

    if (isNight) {
      for (let i = 0; i < 5; i++) {
        let spawnAngle = Math.random() * Math.PI * 2;
        let spawnDist = 450 + Math.random() * 200;
        monsters.push({
          x: player.x + Math.cos(spawnAngle) * spawnDist,
          y: player.y + Math.sin(spawnAngle) * spawnDist,
          size: 22,
          speed: 2.1,
          health: 70,
          maxHealth: 70
        });
      }
    } else {
      monsters = [];
      for (let i = 0; i < 15; i++) spawnTree();
      for (let i = 0; i < 8; i++) spawnRock();
    }
  }

  const playerSafe = isInsideBase(player);

  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];

    // Canı biten canavar ölür ve et bırakır
    if (m.health <= 0) {
      meats.push({ x: m.x, y: m.y, size: 14 });
      monsters.splice(i, 1);
      continue;
    }

    let angle = Math.atan2(player.y - m.y, player.x - m.x);
    let nextX = m.x + Math.cos(angle) * m.speed;
    let nextY = m.y + Math.sin(angle) * m.speed;

    if (base) {
      let willEnterBase = (
        nextX + m.size > base.x &&
        nextX - m.size < base.x + base.size &&
        nextY + m.size > base.y &&
        nextY - m.size < base.y + base.size
      );
      if (!willEnterBase) {
        m.x = nextX;
        m.y = nextY;
      }
    } else {
      m.x = nextX;
      m.y = nextY;
    }

    if (!playerSafe) {
      let dist = Math.hypot(player.x - m.x, player.y - m.y);
      if (dist < player.size + m.size) {
        player.health -= 0.6;
        if (player.health <= 0) {
          player.health = 0;
          isDead = true;
        }
        updateUI();
      }
    }
  }
}

function updateUI() {
  healthEl.innerText = Math.max(0, Math.floor(player.health));
  woodEl.innerText = player.wood;
  stoneEl.innerText = player.stone;
}

// Çizimler
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (player.facing === -1) ctx.scale(-1, 1);

  // Kılıç savurma efekti (Slash arc)
  if (player.isAttacking) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(10, -5, 42, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }

  // Gövde
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

  // Kılıç Çizimi (Saldırıda öne savrulur)
  ctx.save();
  if (player.isAttacking) {
    ctx.rotate(0.5);
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(10, -15, 26, 6);
  } else {
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(8, -8, 14, 4);
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(8, -11, 3, 10);
  }
  ctx.restore();

  ctx.restore();
}

function drawMonster(m) {
  ctx.save();
  ctx.translate(m.x, m.y);

  // Can barı
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(-16, -28, 32, 5);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(-16, -28, (32 * m.health) / m.maxHealth, 5);

  // Gövde
  ctx.fillStyle = "#8e1b1b";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Parlayan Gözler
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

function drawMeat(x, y) {
  ctx.fillStyle = "#e67e22";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ecf0f1";
  ctx.fillRect(x + 5, y - 3, 7, 5);
}

function drawTree(x, y) {
  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(x - 8, y, 16, 26);
  ctx.fillStyle = "#1e824c";
  ctx.beginPath();
  ctx.arc(x, y - 10, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(x - 5, y - 15, 18, 0, Math.PI * 2);
  ctx.fill();
}

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

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = isNight ? "#142615" : "#44782b";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (base) {
    ctx.fillStyle = "#795548";
    ctx.fillRect(base.x, base.y, base.size, base.size);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 6;
    ctx.strokeRect(base.x, base.y, base.size, base.size);
    ctx.fillStyle = "#b93e00";
    ctx.beginPath();
    ctx.moveTo(base.x - 10, base.y);
    ctx.lineTo(base.x + base.size / 2, base.y - 30);
    ctx.lineTo(base.x + base.size + 10, base.y);
    ctx.fill();
    ctx.fillStyle = "rgba(46, 204, 113, 0.25)";
    ctx.fillRect(base.x, base.y, base.size, base.size);
  }

  rocks.forEach(r => drawRock(r.x, r.y, r.size));
  trees.forEach(t => drawTree(t.x, t.y));
  meats.forEach(m => drawMeat(m.x, m.y));

  if (!isDead) {
    drawPlayer(player.x, player.y);
  }

  monsters.forEach(m => drawMonster(m));

  ctx.restore();

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

canvas.addEventListener("click", () => {
  if (isDead) resetGame();
});

function gameLoop() {
  if (gameRunning) {
    updatePlayer();
    checkResources();
    handleWorld();
    render();
  }
  requestAnimationFrame(gameLoop);
}
