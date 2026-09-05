const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

// Mini Harita
const minimapCanvas = document.getElementById("minimapCanvas");
const mctx = minimapCanvas.getContext("2d");

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

// UI
const healthEl = document.getElementById("health-val");
const dayEl = document.getElementById("day-val");
const timeEl = document.getElementById("time-val");
const woodEl = document.getElementById("wood-val");
const stoneEl = document.getElementById("stone-val");
const deviceModal = document.getElementById("device-modal");
const gameContainer = document.getElementById("game-container");
const mobileOverlay = document.getElementById("mobile-overlay");
const pcControls = document.getElementById("pc-controls");
const fullscreenBtn = document.getElementById("btn-fullscreen");
const toolCycleBtn = document.getElementById("btn-tool-cycle");

// Ses Sentezleyici
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, type, duration, vol = 0.12) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  slash: () => playTone(300, "triangle", 0.08),
  chopWood: () => playTone(180, "square", 0.09, 0.08),
  mineRock: () => playTone(120, "sawtooth", 0.09, 0.08),
  gather: () => playTone(540, "sine", 0.06),
  night: () => playTone(140, "sine", 0.5),
  upgrade: () => playTone(650, "square", 0.15)
};

let highScore = parseInt(localStorage.getItem("survival_high_day") || "1");
let isMobile = false;
let gameRunning = false;
let isDead = false;

// Evrensel Tam Ekran Fonksiyonu (iOS Safari ve Android Uyumlu)
function toggleFullScreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}
fullscreenBtn.addEventListener("click", toggleFullScreen);
fullscreenBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toggleFullScreen();
});

document.getElementById("btn-pc").addEventListener("click", () => startGame(false));
document.getElementById("btn-mobile").addEventListener("click", () => startGame(true));

function startGame(mobile) {
  initAudio();
  isMobile = mobile;
  deviceModal.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  if (isMobile) {
    mobileOverlay.classList.remove("hidden");
    pcControls.classList.add("hidden");
    setupMobileControls();
  }
  resetGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

// 3 Temel Alet (0: Kılıç, 1: Balta, 2: Kazma)
const TOOLS = [
  { name: "⚔️ Kılıç", btnIcon: "⚔️", monsterDmg: 45, treeDmg: 8, rockDmg: 5 },
  { name: "🪓 Balta", btnIcon: "🪓", monsterDmg: 12, treeDmg: 45, rockDmg: 5 },
  { name: "⛏️ Kazma", btnIcon: "⛏️", monsterDmg: 12, treeDmg: 5, rockDmg: 45 }
];

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  size: 22,
  speed: 4.5,
  health: 100,
  maxHealth: 100,
  wood: 0,
  stone: 0,
  activeToolIndex: 0,
  facing: 1,
  isAttacking: false,
  attackTimer: 0
};

// Sağ Üstteki Tuşa Basıldığında Alet Sırayla Değişir
function cycleTool() {
  player.activeToolIndex = (player.activeToolIndex + 1) % TOOLS.length;
  toolCycleBtn.innerText = TOOLS[player.activeToolIndex].name;
  document.getElementById("btn-attack").innerText = TOOLS[player.activeToolIndex].btnIcon;
  SFX.upgrade();
}
toolCycleBtn.addEventListener("click", cycleTool);
toolCycleBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  cycleTool();
});

let joystickVector = { x: 0, y: 0 };
const camera = { x: 0, y: 0 };

let trees = [];
let rocks = [];
let monsters = [];
let meats = [];
let base = null;

// Geri Sayım Döngüsü (1800 kare = 30 saniye)
const CYCLE_DURATION = 1800;
let cycleTicks = 0;
let dayCount = 1;
let isNight = false;

// Klavye Kontrolleri
const keys = {};
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "q") cycleTool();
  if (k === "1") { player.activeToolIndex = 0; toolCycleBtn.innerText = TOOLS[0].name; }
  if (k === "2") { player.activeToolIndex = 1; toolCycleBtn.innerText = TOOLS[1].name; }
  if (k === "3") { player.activeToolIndex = 2; toolCycleBtn.innerText = TOOLS[2].name; }
  if (k === "b") buildBase();
  if (e.key === " " && !isDead) attackOrGather();
  if (isDead && (e.key === "Enter" || e.key === " ")) resetGame();
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousedown", () => {
  if (!isDead && gameRunning) attackOrGather();
});

// Mobil Joystick ve 2 Buton
function setupMobileControls() {
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
    attackOrGather();
  });
  document.getElementById("btn-build").addEventListener("touchstart", (e) => {
    e.preventDefault();
    buildBase();
  });
}

// Saldırı ve Kırma Mekaniği
function attackOrGather() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12;

  const tool = TOOLS[player.activeToolIndex];
  const reach = 75;
  let hit = false;

  // Ağaç Kırma
  for (let i = trees.length - 1; i >= 0; i--) {
    let t = trees[i];
    let dist = Math.hypot(t.x - player.x, t.y - player.y);
    if (dist < reach + t.size / 2) {
      t.hp -= tool.treeDmg;
      t.shake = 5;
      SFX.chopWood();
      hit = true;
      if (t.hp <= 0) {
        trees.splice(i, 1);
        player.wood += 4;
        SFX.gather();
      }
      break;
    }
  }

  // Taş Kırma
  if (!hit) {
    for (let i = rocks.length - 1; i >= 0; i--) {
      let r = rocks[i];
      let dist = Math.hypot(r.x - player.x, r.y - player.y);
      if (dist < reach + r.size) {
        r.hp -= tool.rockDmg;
        r.shake = 5;
        SFX.mineRock();
        hit = true;
        if (r.hp <= 0) {
          rocks.splice(i, 1);
          player.stone += 3;
          SFX.gather();
        }
        break;
      }
    }
  }

  // Canavara Vurma
  monsters.forEach(m => {
    let dx = m.x - player.x;
    let dy = m.y - player.y;
    let dist = Math.hypot(dx, dy);
    let inFront = (player.facing === 1 && dx > -15) || (player.facing === -1 && dx < 15);
    if (dist < reach + 10 && inFront) {
      m.health -= tool.monsterDmg;
      m.x += player.facing * 35;
      hit = true;
      SFX.slash();
    }
  });

  if (!hit) SFX.slash();
  updateUI();
}

function spawnTree() {
  trees.push({
    x: Math.random() * (WORLD_WIDTH - 140) + 70,
    y: Math.random() * (WORLD_HEIGHT - 140) + 70,
    size: 32,
    hp: 100,
    maxHp: 100,
    shake: 0
  });
}

function spawnRock() {
  rocks.push({
    x: Math.random() * (WORLD_WIDTH - 140) + 70,
    y: Math.random() * (WORLD_HEIGHT - 140) + 70,
    size: 24,
    hp: 100,
    maxHp: 100,
    shake: 0
  });
}

function resetGame() {
  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  player.health = 100;
  player.wood = 0;
  player.stone = 0;
  player.activeToolIndex = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  joystickVector = { x: 0, y: 0 };
  base = null;
  monsters = [];
  meats = [];
  cycleTicks = 0;
  dayCount = 1;
  isNight = false;
  isDead = false;

  trees = [];
  rocks = [];
  for (let i = 0; i < 60; i++) spawnTree();
  for (let i = 0; i < 35; i++) spawnRock();

  toolCycleBtn.innerText = TOOLS[0].name;
  document.getElementById("btn-attack").innerText = TOOLS[0].btnIcon;
  updateUI();
}

function buildBase() {
  if (base || isDead) return;
  if (player.wood >= 10 && player.stone >= 5) {
    player.wood -= 10;
    player.stone -= 5;
    base = { x: player.x - 55, y: player.y - 55, size: 110 };
    SFX.upgrade();
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

function checkMeatPickup() {
  if (isDead) return;
  for (let i = meats.length - 1; i >= 0; i--) {
    let dist = Math.hypot(player.x - meats[i].x, player.y - meats[i].y);
    if (dist < player.size + meats[i].size) {
      meats.splice(i, 1);
      player.health = Math.min(player.maxHealth, player.health + 30);
      SFX.gather();
      updateUI();
    }
  }
}

function handleWorld() {
  if (isDead) return;

  // Geri Sayım Saati
  cycleTicks++;
  const remainingTicks = CYCLE_DURATION - cycleTicks;
  const remainingSeconds = Math.ceil(remainingTicks / 60);
  const minStr = Math.floor(remainingSeconds / 60);
  const secStr = (remainingSeconds % 60).toString().padStart(2, "0");

  if (!isNight) {
    timeEl.innerText = `Gündüz ☀️ (${minStr}:${secStr})`;
    timeEl.style.color = "#f1c40f";
  } else {
    timeEl.innerText = `Gece 🌙 (${minStr}:${secStr})`;
    timeEl.style.color = "#e74c3c";
  }

  if (cycleTicks >= CYCLE_DURATION) {
    cycleTicks = 0;
    isNight = !isNight;

    if (isNight) {
      SFX.night();
      const count = 4 + dayCount * 2;
      for (let i = 0; i < count; i++) {
        let spawnAngle = Math.random() * Math.PI * 2;
        let spawnDist = 450 + Math.random() * 200;
        monsters.push({
          x: player.x + Math.cos(spawnAngle) * spawnDist,
          y: player.y + Math.sin(spawnAngle) * spawnDist,
          size: 22,
          speed: 2.1 + dayCount * 0.15,
          health: 70 + dayCount * 10,
          maxHealth: 70 + dayCount * 10
        });
      }
    } else {
      dayCount++;
      dayEl.innerText = `${dayCount}. Gün`;
      if (dayCount > highScore) {
        highScore = dayCount;
        localStorage.setItem("survival_high_day", highScore);
      }
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

// Çizimler
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (player.facing === -1) ctx.scale(-1, 1);

  if (player.isAttacking) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(14, -5, 45, -Math.PI / 4, Math.PI / 4);
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

  // Eldeki Alet
  ctx.save();
  if (player.isAttacking) ctx.rotate(0.5);

  if (player.activeToolIndex === 0) {
    // Kılıç
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(8, -8, 16, 4);
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(8, -11, 3, 10);
  } else if (player.activeToolIndex === 1) {
    // Balta
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(8, -8, 14, 4);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(18, -14, 6, 16);
  } else {
    // Kazma
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(8, -8, 14, 4);
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(18, -14, 4, 16);
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

// Can Barlı Ağaç
function drawTree(t) {
  let shakeOffset = 0;
  if (t.shake > 0) {
    shakeOffset = (Math.random() - 0.5) * t.shake;
    t.shake--;
  }

  const px = t.x + shakeOffset;
  const py = t.y;

  // Can Barı
  if (t.hp < t.maxHp) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px - 18, py - 46, 36, 6);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(px - 18, py - 46, (36 * t.hp) / t.maxHp, 6);
  }

  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(px - 8, py, 16, 26);
  ctx.fillStyle = "#1e824c";
  ctx.beginPath();
  ctx.arc(px, py - 10, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(px - 5, py - 15, 18, 0, Math.PI * 2);
  ctx.fill();
}

// Can Barlı Taş
function drawRock(r) {
  let shakeOffset = 0;
  if (r.shake > 0) {
    shakeOffset = (Math.random() - 0.5) * r.shake;
    r.shake--;
  }

  const px = r.x + shakeOffset;
  const py = r.y;

  if (r.hp < r.maxHp) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px - 16, py - 32, 32, 6);
    ctx.fillStyle = "#3498db";
    ctx.fillRect(px - 16, py - 32, (32 * r.hp) / r.maxHp, 6);
  }

  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  ctx.arc(px, py, r.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#95a5a6";
  ctx.beginPath();
  ctx.arc(px - 4, py - 4, r.size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function renderMinimap() {
  mctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleX = minimapCanvas.width / WORLD_WIDTH;
  const scaleY = minimapCanvas.height / WORLD_HEIGHT;

  if (base) {
    mctx.fillStyle = "#9b59b6";
    mctx.fillRect(base.x * scaleX, base.y * scaleY, 6, 6);
  }

  mctx.fillStyle = "#e74c3c";
  monsters.forEach(m => {
    mctx.fillRect(m.x * scaleX, m.y * scaleY, 3, 3);
  });

  mctx.fillStyle = "#2ecc71";
  mctx.beginPath();
  mctx.arc(player.x * scaleX, player.y * scaleY, 3, 0, Math.PI * 2);
  mctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = isNight ? "#122013" : "#3a6824";
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

  rocks.forEach(r => drawRock(r));
  trees.forEach(t => drawTree(t));
  meats.forEach(m => drawMeat(m.x, m.y));

  if (!isDead) drawPlayer(player.x, player.y);
  monsters.forEach(m => drawMonster(m));

  ctx.restore();

  renderMinimap();

  if (isDead) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HAYATTA KALAMADIN!", canvas.width / 2, canvas.height / 2 - 35);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${dayCount}. Günde Elendin | En Yüksek: ${highScore}. Gün`, canvas.width / 2, canvas.height / 2 + 5);

    ctx.fillStyle = "#ffffff";
    ctx.font = "15px sans-serif";
    ctx.fillText(isMobile ? "Yeniden başlamak için ekrana dokun" : "Yeniden başlamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 45);
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
    checkMeatPickup();
    handleWorld();
    render();
  }
  requestAnimationFrame(gameLoop);
}
