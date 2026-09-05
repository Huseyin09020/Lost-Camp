const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

// Mini Harita
const minimapCanvas = document.getElementById("minimapCanvas");
const mctx = minimapCanvas.getContext("2d");

// DAHA BÜYÜK HARİTA (3200 x 2400)
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;

// UI Elementleri
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

// Web Audio API Synthesizer (Ses Sistemi)
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

const SFX = {
  slash: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {}
  },
  chopWood: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, audioCtx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.13, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.07);
    } catch(e) {}
  },
  mineRock: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(560, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.11, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch(e) {}
  },
  hitMonster: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch(e) {}
  },
  pickup: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(920, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch(e) {}
  },
  build: () => {
    if (!audioCtx) return;
    try {
      [320, 420, 580].forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.06);
        osc.stop(audioCtx.currentTime + idx * 0.06 + 0.15);
      });
    } catch(e) {}
  },
  night: () => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch(e) {}
  }
};

let highScore = parseInt(localStorage.getItem("survival_high_day") || "1");
let isMobile = false;
let gameRunning = false;
let isDead = false;

function toggleFullScreen() {
  initAudio();
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

const TOOLS = [
  { name: "⚔️ Kılıç", btnIcon: "⚔️", monsterDmg: 45, treeDmg: 8, rockDmg: 5 },
  { name: "🪓 Balta", btnIcon: "🪓", monsterDmg: 12, treeDmg: 45, rockDmg: 5 },
  { name: "⛏️ Kazma", btnIcon: "⛏️", monsterDmg: 12, treeDmg: 5, rockDmg: 45 }
];

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  size: 22,
  speed: 4.8,
  health: 100,
  maxHealth: 100,
  wood: 0,
  stone: 0,
  activeToolIndex: 0,
  facing: 1,
  isAttacking: false,
  attackTimer: 0,
  walkCycle: 0
};

function cycleTool() {
  initAudio();
  player.activeToolIndex = (player.activeToolIndex + 1) % TOOLS.length;
  toolCycleBtn.innerText = TOOLS[player.activeToolIndex].name;
  document.getElementById("btn-attack").innerText = TOOLS[player.activeToolIndex].btnIcon;
  SFX.slash();
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
  initAudio();
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
  initAudio();
  if (!isDead && gameRunning) attackOrGather();
});

// Mobil Joystick Mekaniği
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
    initAudio();
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
    initAudio();
    attackOrGather();
  });
  document.getElementById("btn-build").addEventListener("touchstart", (e) => {
    e.preventDefault();
    initAudio();
    buildBase();
  });
}

function attackOrGather() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12;

  const tool = TOOLS[player.activeToolIndex];
  const reach = 80;
  let hit = false;

  // Ağaç
  for (let i = trees.length - 1; i >= 0; i--) {
    let t = trees[i];
    let dist = Math.hypot(t.x - player.x, t.y - player.y);
    if (dist < reach + t.size / 2) {
      t.hp -= tool.treeDmg;
      t.shake = 6;
      hit = true;
      SFX.chopWood();
      if (t.hp <= 0) {
        trees.splice(i, 1);
        player.wood += 4;
        SFX.pickup();
      }
      break;
    }
  }

  // Taş
  if (!hit) {
    for (let i = rocks.length - 1; i >= 0; i--) {
      let r = rocks[i];
      let dist = Math.hypot(r.x - player.x, r.y - player.y);
      if (dist < reach + r.size) {
        r.hp -= tool.rockDmg;
        r.shake = 6;
        hit = true;
        SFX.mineRock();
        if (r.hp <= 0) {
          rocks.splice(i, 1);
          player.stone += 3;
          SFX.pickup();
        }
        break;
      }
    }
  }

  // Canavar
  monsters.forEach(m => {
    let dx = m.x - player.x;
    let dy = m.y - player.y;
    let dist = Math.hypot(dx, dy);
    let inFront = (player.facing === 1 && dx > -15) || (player.facing === -1 && dx < 15);
    if (dist < reach + 12 && inFront) {
      m.health -= tool.monsterDmg;
      m.x += player.facing * 38;
      hit = true;
      SFX.hitMonster();
    }
  });

  if (!hit) SFX.slash();
  updateUI();
}

function spawnTree() {
  trees.push({
    x: Math.random() * (WORLD_WIDTH - 160) + 80,
    y: Math.random() * (WORLD_HEIGHT - 160) + 80,
    size: 36,
    hp: 100,
    maxHp: 100,
    shake: 0,
    type: Math.floor(Math.random() * 2) // Farklı ton varyasyonu
  });
}

function spawnRock() {
  rocks.push({
    x: Math.random() * (WORLD_WIDTH - 160) + 80,
    y: Math.random() * (WORLD_HEIGHT - 160) + 80,
    size: 26,
    hp: 100,
    maxHp: 100,
    shake: 0,
    points: [
      { x: -22, y: 6 }, { x: -16, y: -16 }, { x: 4, y: -24 },
      { x: 22, y: -10 }, { x: 24, y: 14 }, { x: -4, y: 22 }
    ]
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
  // Geniş haritaya bol kaynak
  for (let i = 0; i < 80; i++) spawnTree();
  for (let i = 0; i < 45; i++) spawnRock();

  toolCycleBtn.innerText = TOOLS[0].name;
  document.getElementById("btn-attack").innerText = TOOLS[0].btnIcon;
  updateUI();
}

function buildBase() {
  if (base || isDead) return;
  if (player.wood >= 10 && player.stone >= 5) {
    player.wood -= 10;
    player.stone -= 5;
    base = { x: player.x - 65, y: player.y - 65, size: 130 };
    SFX.build();
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

  if (moveX !== 0 || moveY !== 0) {
    player.walkCycle += 0.25;
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
      SFX.pickup();
      updateUI();
    }
  }
}

function handleWorld() {
  if (isDead) return;

  cycleTicks++;
  const remainingTicks = CYCLE_DURATION - cycleTicks;
  const remainingSeconds = Math.ceil(remainingTicks / 60);
  const minStr = Math.floor(remainingSeconds / 60);
  const secStr = (remainingSeconds % 60).toString().padStart(2, "0");

  if (!isNight) {
    timeEl.innerText = `Gündüz ☀️ (${minStr}:${secStr})`;
    timeEl.style.color = "#2ecc71";
  } else {
    timeEl.innerText = `Gece 🌙 (${minStr}:${secStr})`;
    timeEl.style.color = "#e74c3c";
  }

  if (cycleTicks >= CYCLE_DURATION) {
    cycleTicks = 0;
    isNight = !isNight;

    if (isNight) {
      SFX.night();
      const count = 5 + dayCount * 2;
      for (let i = 0; i < count; i++) {
        let spawnAngle = Math.random() * Math.PI * 2;
        let spawnDist = 480 + Math.random() * 250;
        monsters.push({
          x: player.x + Math.cos(spawnAngle) * spawnDist,
          y: player.y + Math.sin(spawnAngle) * spawnDist,
          size: 24,
          speed: 2.2 + dayCount * 0.12,
          health: 75 + dayCount * 12,
          maxHealth: 75 + dayCount * 12,
          animOffset: Math.random() * 10
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
      for (let i = 0; i < 20; i++) spawnTree();
      for (let i = 0; i < 10; i++) spawnRock();
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
        player.health -= 0.65;
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

// ==========================================
// DETAYLI GELİŞMİŞ ÇİZİMLER (GRAPHICS)
// ==========================================

// Karakter Çizimi
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (player.facing === -1) ctx.scale(-1, 1);

  const bob = Math.sin(player.walkCycle) * 2;

  // Saldırı Efekti (Arc Slash)
  if (player.isAttacking) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(14, -4 + bob, 48, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }

  // Ayaklar
  ctx.fillStyle = "#1b2631";
  ctx.fillRect(-8, 10 + bob, 6, 8);
  ctx.fillRect(2, 10 - bob, 6, 8);

  // Gövde (Zırh / Kıyafet)
  ctx.fillStyle = "#2471a3";
  ctx.fillRect(-10, -10 + bob, 20, 22);
  ctx.fillStyle = "#1b4f72";
  ctx.fillRect(-10, -2 + bob, 20, 4); // Kemer

  // Kafa ve Ten
  ctx.fillStyle = "#f5cba7";
  ctx.beginPath();
  ctx.arc(0, -20 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  // Saç / Miğfer
  ctx.fillStyle = "#566573";
  ctx.beginPath();
  ctx.arc(0, -23 + bob, 11, Math.PI, Math.PI * 2);
  ctx.fill();

  // Göz
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(3, -22 + bob, 3, 3);

  // Eldeki Alet
  ctx.save();
  ctx.translate(8, -4 + bob);
  if (player.isAttacking) ctx.rotate(0.6);

  if (player.activeToolIndex === 0) {
    // Kılıç
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(0, -3, 20, 5);
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(-2, -6, 4, 11);
    ctx.fillStyle = "#784212";
    ctx.fillRect(-6, -2, 4, 4);
  } else if (player.activeToolIndex === 1) {
    // Balta
    ctx.fillStyle = "#784212";
    ctx.fillRect(-4, -2, 18, 4);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(10, -8, 6, 16);
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(8, -6, 3, 12);
  } else {
    // Kazma
    ctx.fillStyle = "#784212";
    ctx.fillRect(-4, -2, 18, 4);
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(14, -2, 8, -Math.PI / 2, Math.PI / 2, false);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// Şekillendirilmiş İblis Canavar Çizimi
function drawMonster(m) {
  ctx.save();
  ctx.translate(m.x, m.y);

  // Can Barı
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-18, -32, 36, 5);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-18, -32, (36 * m.health) / m.maxHealth, 5);

  // Karanlık Aura / Titreşim
  const pulse = Math.sin(Date.now() * 0.008 + m.animOffset) * 2;

  // Canavar Gövdesi (Sivri hatlı)
  ctx.fillStyle = "#5c0b0b";
  ctx.beginPath();
  ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#871515";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  // Boynuzlar
  ctx.fillStyle = "#2c0404";
  ctx.beginPath();
  ctx.moveTo(-10, -12); ctx.lineTo(-18, -24); ctx.lineTo(-4, -16); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -12); ctx.lineTo(18, -24); ctx.lineTo(4, -16); ctx.fill();

  // Parlayan Gözler
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.arc(-5, -4, 4, 0, Math.PI * 2);
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-4, -5, 2, 2);
  ctx.fillRect(6, -5, 2, 2);

  // Sivri Ağız / Dişler
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-7, 4); ctx.lineTo(-4, 10); ctx.lineTo(-1, 4);
  ctx.moveTo(-1, 4); ctx.lineTo(2, 10); ctx.lineTo(5, 4);
  ctx.fill();

  ctx.restore();
}

// Şekillendirilmiş Katmanlı Ağaç Çizimi
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
    ctx.fillRect(px - 20, py - 52, 40, 6);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(px - 20, py - 52, (40 * t.hp) / t.maxHp, 6);
  }

  // Kökler ve Gövde
  ctx.fillStyle = "#4a2c11";
  ctx.beginPath();
  ctx.moveTo(px - 9, py);
  ctx.lineTo(px - 14, py + 26);
  ctx.lineTo(px + 14, py + 26);
  ctx.lineTo(px + 9, py);
  ctx.fill();

  // Gövde dokusu
  ctx.fillStyle = "#38200b";
  ctx.fillRect(px - 3, py + 4, 6, 16);

  // 3 Katmanlı Canlı Yaprak Tacı
  const leafColor1 = t.type === 0 ? "#196f3d" : "#1e8449";
  const leafColor2 = t.type === 0 ? "#27ae60" : "#2ecc71";

  // Alt Yaprak Katmanı
  ctx.fillStyle = leafColor1;
  ctx.beginPath();
  ctx.arc(px, py - 4, 30, 0, Math.PI * 2);
  ctx.fill();

  // Orta Yaprak Katmanı
  ctx.fillStyle = leafColor2;
  ctx.beginPath();
  ctx.arc(px - 8, py - 14, 22, 0, Math.PI * 2);
  ctx.arc(px + 8, py - 14, 22, 0, Math.PI * 2);
  ctx.fill();

  // Üst Tepe Işıltısı
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.arc(px - 4, py - 20, 12, 0, Math.PI * 2);
  ctx.fill();
}

// Şekillendirilmiş Çatlaklı Kaya Çizimi
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
    ctx.fillRect(px - 18, py - 36, 36, 6);
    ctx.fillStyle = "#3498db";
    ctx.fillRect(px - 18, py - 36, (36 * r.hp) / r.maxHp, 6);
  }

  // Çokgen Kaya Gövdesi
  ctx.save();
  ctx.translate(px, py);

  ctx.fillStyle = "#566573";
  ctx.beginPath();
  ctx.moveTo(r.points[0].x, r.points[0].y);
  for (let i = 1; i < r.points.length; i++) {
    ctx.lineTo(r.points[i].x, r.points[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Işık Alan Üst Faset (Açık Gri)
  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  ctx.moveTo(r.points[1].x, r.points[1].y);
  ctx.lineTo(r.points[2].x, r.points[2].y);
  ctx.lineTo(0, 0);
  ctx.fill();

  // Gölge Alan Alt Faset (Koyu Gri)
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.moveTo(r.points[4].x, r.points[4].y);
  ctx.lineTo(r.points[5].x, r.points[5].y);
  ctx.lineTo(0, 0);
  ctx.fill();

  // Çatlak Çizgisi
  ctx.strokeStyle = "#1a252f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(2, 4);
  ctx.lineTo(8, 1);
  ctx.stroke();

  ctx.restore();
}

// Düşen Et Parçası
function drawMeat(x, y) {
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fdfefe";
  ctx.fillRect(x + 5, y - 3, 8, 6);
  ctx.beginPath();
  ctx.arc(x + 13, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Mini Harita Çizimi
function renderMinimap() {
  mctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleX = minimapCanvas.width / WORLD_WIDTH;
  const scaleY = minimapCanvas.height / WORLD_HEIGHT;

  if (base) {
    mctx.fillStyle = "#9b59b6";
    mctx.fillRect(base.x * scaleX, base.y * scaleY, 7, 7);
  }

  mctx.fillStyle = "#e74c3c";
  monsters.forEach(m => {
    mctx.fillRect(m.x * scaleX, m.y * scaleY, 3, 3);
  });

  mctx.fillStyle = "#2ecc71";
  mctx.beginPath();
  mctx.arc(player.x * scaleX, player.y * scaleY, 3.5, 0, Math.PI * 2);
  mctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Zemin Deseni
  ctx.fillStyle = isNight ? "#0d1a0d" : "#2f561d";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Harita Zemin Izgarası
  ctx.strokeStyle = isNight ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD_WIDTH; x += 120) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 120) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }

  // Harita Kırmızı Dış Sınırı
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Güvenli Sığınak Kulübesi
  if (base) {
    ctx.fillStyle = "#6e2c00";
    ctx.fillRect(base.x, base.y, base.size, base.size);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 6;
    ctx.strokeRect(base.x, base.y, base.size, base.size);

    // Kulübe Çatısı
    ctx.fillStyle = "#a04000";
    ctx.beginPath();
    ctx.moveTo(base.x - 12, base.y);
    ctx.lineTo(base.x + base.size / 2, base.y - 36);
    ctx.lineTo(base.x + base.size + 12, base.y);
    ctx.fill();

    // Güvenli Bölge Işığı
    ctx.fillStyle = "rgba(46, 204, 113, 0.2)";
    ctx.fillRect(base.x, base.y, base.size, base.size);
  }

  rocks.forEach(r => drawRock(r));
  trees.forEach(t => drawTree(t));
  meats.forEach(m => drawMeat(m.x, m.y));

  if (!isDead) drawPlayer(player.x, player.y);
  monsters.forEach(m => drawMonster(m));

  ctx.restore();

  renderMinimap();

  // Ölüm Ekranı
  if (isDead) {
    ctx.fillStyle = "rgba(5, 10, 5, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HAYATTA KALAMADIN!", canvas.width / 2, canvas.height / 2 - 35);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${dayCount}. Günde Elendin | En Yüksek: ${highScore}. Gün`, canvas.width / 2, canvas.height / 2 + 6);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "15px sans-serif";
    ctx.fillText(isMobile ? "Yeniden başlamak için ekrana dokun" : "Yeniden başlamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 48);
  }
}

window.addEventListener("touchstart", (e) => {
  initAudio();
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
