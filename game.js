const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

// UI
const healthEl = document.getElementById("health-val");
const timeEl = document.getElementById("time-val");
const woodEl = document.getElementById("wood-val");
const stoneEl = document.getElementById("stone-val");
const deviceModal = document.getElementById("device-modal");
const gameContainer = document.getElementById("game-container");
const mobileOverlay = document.getElementById("mobile-overlay");
const pcControls = document.getElementById("pc-controls");
const fullscreenBtn = document.getElementById("btn-fullscreen");

let isMobile = false;
let gameRunning = false;
let isDead = false;

// Tam Ekran Fonksiyonu
function toggleFullScreen() {
  const doc = window.document;
  const docEl = doc.documentElement;

  const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    if (requestFullScreen) {
      requestFullScreen.call(docEl);
    }
  } else {
    if (cancelFullScreen) {
      cancelFullScreen.call(doc);
    }
  }
}

fullscreenBtn.addEventListener("click", toggleFullScreen);
fullscreenBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toggleFullScreen();
});

// Cihaz Seçimi
document.getElementById("btn-pc").addEventListener("click", () => startGame(false));
document.getElementById("btn-mobile").addEventListener("click", () => startGame(true));

function startGame(mobile) {
  isMobile = mobile;
  deviceModal.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  if (isMobile) {
    mobileOverlay.classList.remove("hidden");
    pcControls.classList.add("hidden");
    setupJoystick();
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
  facing: 1,
  isAttacking: false,
  attackTimer: 0
};

let joystickVector = { x: 0, y: 0 };
const camera = { x: 0, y: 0 };
let trees = [];
let rocks = [];
let monsters = [];
let meats = [];
let base = null;
let gameTick = 0;
let isNight = false;

// Klavye Kontrolleri
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

// PC Mouse Saldırısı
canvas.addEventListener("mousedown", () => {
  if (!isDead && gameRunning) attack();
});

// Mobil Joystick Mekaniği
function setupJoystick() {
  const zone = document.getElementById("joystick-zone");
  const knob = document.getElementById("joystick-knob");
  const maxRadius = 45;
  let touchId = null;
  let centerX = 0;
  let centerY = 0;

  function updateTouch(touch) {
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    joystickVector.x = knobX / maxRadius;
    joystickVector.y = knobY / maxRadius;

    if (Math.abs(joystickVector.x) > 0.1) {
      player.facing = joystickVector.x > 0 ? 1 : -1;
    }
  }

  zone.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (touchId !== null) return;
    const touch = e.changedTouches[0];
    touchId = touch.identifier;
    const rect = zone.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    updateTouch(touch);
  }, { passive: false });

  window.addEventListener("touchmove", (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        updateTouch(e.changedTouches[i]);
        break;
      }
    }
  }, { passive: false });

  function endJoystick(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        touchId = null;
        knob.style.transform = `translate(0px, 0px)`;
        joystickVector = { x: 0, y: 0 };
        break;
      }
    }
  }

  window.addEventListener("touchend", endJoystick);
  window.addEventListener("touchcancel", endJoystick);

  document.getElementById("btn-attack").addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!isDead) attack();
  });
  document.getElementById("btn-build").addEventListener("touchstart", (e) => {
    e.preventDefault();
    buildBase();
  });
}

function attack() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12;

  const attackRange = 70;
  monsters.forEach(m => {
    let dx = m.x - player.x;
    let dy = m.y - player.y;
    let dist = Math.hypot(dx, dy);

    let inFront = (player.facing === 1 && dx > -15) || (player.facing === -1 && dx < 15);
    if (dist < attackRange && inFront) {
      m.health -= 35;
      m.x += player.facing * 35;
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
  joystickVector = { x: 0, y: 0 };
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

  let moveX = 0;
  let moveY = 0;

  if (keys["w"] || keys["arrowup"]) moveY -= 1;
  if (keys["s"] || keys["arrowdown"]) moveY += 1;
  if (keys["a"] || keys["arrowleft"]) { moveX -= 1; player.facing = -1; }
  if (keys["d"] || keys["arrowright"]) { moveX += 1; player.facing = 1; }

  if (isMobile) {
    moveX += joystickVector.x;
    moveY += joystickVector.y;
  }

  player.x += moveX * player.speed;
  player.y += moveY * player.speed;

  player.x = Math.max(player.size, Math.min(WORLD_WIDTH - player.size, player.x));
  player.y = Math.max(player.size, Math.min(WORLD_HEIGHT - player.size, player.y));

  if (player.isAttacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) player.isAttacking = false;
  }

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

function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (player.facing === -1) ctx.scale(-1, 1);

  if (player.isAttacking) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(10, -5, 42, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }

  ctx.fillStyle = "#2980b9";
  ctx.fillRect(-10, -14, 20, 26);

  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(0, -22, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(3, -24, 3, 3);

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

  ctx.fillStyle = "#c0392b";
  ctx.fillRect(-16, -28, 32, 5);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(-16, -28, (32 * m.health) / m.maxHealth, 5);

  ctx.fillStyle = "#8e1b1b";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(-5, -4, 4, 0, Math.PI * 2);
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();

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
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
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

window.addEventListener("touchstart", (e) => {
  if (isDead) {
    e.preventDefault();
    resetGame();
  }
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
