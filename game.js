const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Mini Harita
const minimapCanvas = document.getElementById("minimapCanvas");
const mctx = minimapCanvas.getContext("2d");

const WORLD_WIDTH = 4400;
const WORLD_HEIGHT = 3200;

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
const playerNameInput = document.getElementById("player-name-input");
const achBanner = document.getElementById("achievement-banner");
const achDesc = document.getElementById("ach-desc");

// 10 Günlük Başarımlar
const ACHIEVEMENTS = [
  "1. Gün: Hayat Adamı (Kurtlar Yakında!)",
  "2. Gün: Zorluklara Göğüs Germek",
  "3. Gün: Vahşi Kurtların Efendisi",
  "4. Gün: Ayıların Hükümdarlığı Başladı!",
  "5. Gün: Yarı Yolu Devirdik! (KONTROL NOKTASI)",
  "6. Gün: Ayı Avcısı",
  "7. Gün: Karanlık İblisler Uyandı!",
  "8. Gün: Cehennem Şafağı",
  "9. Gün: Sonun Başlangıcı",
  "10. Gün: KIZINI KURTAR VE KAÇ!"
];

// Statik Göller ve Girilemeyen Antik Yapılar
const lakes = [
  { x: 1000, y: 900, rx: 220, ry: 160 },
  { x: 3200, y: 2200, rx: 260, ry: 190 },
  { x: 1300, y: 2300, rx: 180, ry: 140 }
];

const ruins = [
  { type: "tower", x: 900, y: 1800, w: 90, h: 90 },
  { type: "castle", x: 3100, y: 900, w: 140, h: 120 },
  { type: "altar", x: 2200, y: 2400, w: 110, h: 110 }
];

// Zemin Önbelleği
const groundCanvas = document.createElement("canvas");
groundCanvas.width = WORLD_WIDTH;
groundCanvas.height = WORLD_HEIGHT;
const gctx = groundCanvas.getContext("2d");

function bakeGround() {
  gctx.fillStyle = "#2a4d19";
  gctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Çimen ve çiçek pırıltıları
  for (let i = 0; i < 800; i++) {
    const gx = Math.random() * (WORLD_WIDTH - 60) + 30;
    const gy = Math.random() * (WORLD_HEIGHT - 60) + 30;
    const type = Math.floor(Math.random() * 3);
    const size = Math.random() * 4 + 4;

    if (type === 0) {
      gctx.fillStyle = "#1e3a12";
      gctx.beginPath();
      gctx.arc(gx, gy, size, 0, Math.PI * 2);
      gctx.fill();
    } else if (type === 1) {
      gctx.fillStyle = "#385e24";
      gctx.beginPath();
      gctx.ellipse(gx, gy, size + 2, size - 1, Math.PI / 4, 0, Math.PI * 2);
      gctx.fill();
    } else {
      gctx.fillStyle = "#f1c40f";
      gctx.beginPath();
      gctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
      gctx.fill();
    }
  }

  // Göllerin Sahil ve Su Çizimi
  lakes.forEach(l => {
    // Kumsal / Çamur Sınırı
    gctx.fillStyle = "#a08253";
    gctx.beginPath();
    gctx.ellipse(l.x, l.y, l.rx + 24, l.ry + 24, 0, 0, Math.PI * 2);
    gctx.fill();

    // Derin Su
    gctx.fillStyle = "#1b4f72";
    gctx.beginPath();
    gctx.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, Math.PI * 2);
    gctx.fill();

    // Sığ Su Kenarı
    gctx.fillStyle = "#2980b9";
    gctx.beginPath();
    gctx.ellipse(l.x, l.y, l.rx - 16, l.ry - 16, 0, 0, Math.PI * 2);
    gctx.fill();
  });

  // Izgara Çizgileri
  gctx.strokeStyle = "rgba(0,0,0,0.035)";
  gctx.lineWidth = 2;
  for (let x = 0; x < WORLD_WIDTH; x += 140) {
    gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, WORLD_HEIGHT); gctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 140) {
    gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(WORLD_WIDTH, y); gctx.stroke();
  }

  // Sınır Çizgisi
  gctx.strokeStyle = "#c0392b";
  gctx.lineWidth = 8;
  gctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}
bakeGround();

// Ses Motoru
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function createNoiseBuffer() {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 0.1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

const SFX = {
  chopWood: () => {
    initAudio();
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, now);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);
    } catch(e) {}
  },
  mineRock: () => {
    initAudio();
    try {
      const now = audioCtx.currentTime;
      const oscHigh = audioCtx.createOscillator();
      const gainHigh = audioCtx.createGain();
      oscHigh.type = "sine";
      oscHigh.frequency.setValueAtTime(1400, now);
      oscHigh.frequency.exponentialRampToValueAtTime(650, now + 0.12);
      gainHigh.gain.setValueAtTime(0.22, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      oscHigh.connect(gainHigh);
      gainHigh.connect(audioCtx.destination);
      oscHigh.start(now);
      oscHigh.stop(now + 0.12);

      const oscLow = audioCtx.createOscillator();
      const gainLow = audioCtx.createGain();
      oscLow.type = "square";
      oscLow.frequency.setValueAtTime(240, now);
      oscLow.frequency.exponentialRampToValueAtTime(80, now + 0.09);
      gainLow.gain.setValueAtTime(0.14, now);
      gainLow.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      oscLow.connect(gainLow);
      gainLow.connect(audioCtx.destination);
      oscLow.start(now);
      oscLow.stop(now + 0.09);
    } catch(e) {}
  },
  slash: () => {
    initAudio();
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch(e) {}
  },
  hitMonster: () => {
    initAudio();
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.11);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch(e) {}
  },
  pickup: () => {
    initAudio();
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch(e) {}
  },
  achievement: () => {
    initAudio();
    try {
      [440, 554, 659, 880].forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.2);
      });
    } catch(e) {}
  },
  victory: () => {
    initAudio();
    try {
      [523, 659, 784, 1046].forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.4);
      });
    } catch(e) {}
  },
  build: () => {
    initAudio();
    try {
      [320, 440, 600].forEach((f, idx) => {
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
    initAudio();
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, audioCtx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + 0.8);
      osc.stop(audioCtx.currentTime + 0.8);
    } catch(e) {}
  }
};

let currentDevice = "pc";
let gameRunning = false;
let isDead = false;
let gameWon = false;

// Cinsiyet Seçimi
let selectedGender = "male";
const genderMaleBtn = document.getElementById("gender-male");
const genderFemaleBtn = document.getElementById("gender-female");

genderMaleBtn.addEventListener("click", () => {
  selectedGender = "male";
  genderMaleBtn.classList.add("active-gender");
  genderFemaleBtn.classList.remove("active-gender");
});

genderFemaleBtn.addEventListener("click", () => {
  selectedGender = "female";
  genderFemaleBtn.classList.add("active-gender");
  genderMaleBtn.classList.remove("active-gender");
});

function toggleFullScreen() {
  initAudio();
  if (currentDevice === "ios") {
    document.body.classList.toggle("ios-fullscreen");
    window.scrollTo(0, 1);
    return;
  }
  const elem = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}
fullscreenBtn.addEventListener("click", toggleFullScreen);
fullscreenBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toggleFullScreen();
});

const TOOLS = [
  { name: "⚔️ Kılıç", btnIcon: "⚔️", monsterDmg: 45, treeDmg: 8, rockDmg: 5 },
  { name: "🪓 Balta", btnIcon: "🪓", monsterDmg: 12, treeDmg: 45, rockDmg: 5 },
  { name: "⛏️ Kazma", btnIcon: "⛏️", monsterDmg: 12, treeDmg: 5, rockDmg: 45 }
];

const player = {
  name: "Savaşçı",
  gender: "male",
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  size: 22,
  speed: 5.2,
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
let escapePortal = null;

// GÜNDÜZ VE GECE SÜRESİ ARTIRILDI (1 Dakika = 3600 Kare)
const CYCLE_DURATION = 3600; 
let cycleTicks = 0;
let dayCount = 1;
let isNight = false;

function triggerAchievement(index) {
  if (index >= ACHIEVEMENTS.length) return;
  achDesc.innerText = ACHIEVEMENTS[index];
  achBanner.classList.remove("hidden");
  SFX.achievement();
  setTimeout(() => {
    achBanner.classList.add("hidden");
  }, 4000);
}

function startGame(device) {
  if (gameRunning) return;
  initAudio();
  currentDevice = device;

  const inputName = playerNameInput.value.trim();
  player.name = inputName.length > 0 ? inputName : "Savaşçı";
  player.gender = selectedGender;

  deviceModal.style.display = "none";
  deviceModal.classList.add("hidden");
  gameContainer.style.display = "block";
  gameContainer.classList.remove("hidden");

  resizeCanvas();

  if (device === "android" || device === "ios") {
    mobileOverlay.classList.remove("hidden");
    pcControls.classList.add("hidden");
    setupMobileControls();

    if (device === "ios") {
      document.body.classList.add("ios-fullscreen");
      window.scrollTo(0, 1);
    } else {
      toggleFullScreen();
    }
  } else {
    mobileOverlay.classList.add("hidden");
    pcControls.classList.remove("hidden");
  }

  resetGame(true);
  gameRunning = true;
  triggerAchievement(0);
  requestAnimationFrame(gameLoop);
}

function bindStartButton(btnId, dev) {
  const btn = document.getElementById(btnId);
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startGame(dev);
  });
}
bindStartButton("btn-pc", "pc");
bindStartButton("btn-android", "android");
bindStartButton("btn-ios", "ios");

const keys = {};
window.addEventListener("keydown", (e) => {
  initAudio();
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "q") cycleTool();
  if (k === "1") { player.activeToolIndex = 0; toolCycleBtn.innerText = TOOLS[0].name; }
  if (k === "2") { player.activeToolIndex = 1; toolCycleBtn.innerText = TOOLS[1].name; }
  if (k === "3") { player.activeToolIndex = 2; toolCycleBtn.innerText = TOOLS[2].name; }
  if (k === "b") buildOrRepairBase();
  if (e.key === " " && !isDead && !gameWon) attackOrGather();
  if ((isDead || gameWon) && (e.key === "Enter" || e.key === " ")) resetGame(false);
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousedown", () => {
  initAudio();
  if (!isDead && !gameWon && gameRunning) attackOrGather();
});

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
    buildOrRepairBase();
  });
}

function attackOrGather() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12;

  const tool = TOOLS[player.activeToolIndex];
  const reach = 85;
  let hit = false;

  // 10. Gün Kapısını Kırma
  if (escapePortal && !escapePortal.broken) {
    let pdist = Math.hypot(escapePortal.x - player.x, escapePortal.y - player.y);
    if (pdist < reach + 45) {
      escapePortal.hp -= 25;
      escapePortal.shake = 8;
      hit = true;
      SFX.mineRock();
      if (escapePortal.hp <= 0) {
        escapePortal.broken = true;
        gameWon = true;
        SFX.victory();
      }
    }
  }

  // Ağaç Kırma
  if (!hit) {
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
  }

  // Taş Kırma
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

  // Canavar / Hayvan Vurma
  monsters.forEach(m => {
    let dx = m.x - player.x;
    let dy = m.y - player.y;
    let dist = Math.hypot(dx, dy);
    let inFront = (player.facing === 1 && dx > -15) || (player.facing === -1 && dx < 15);
    if (dist < reach + 14 && inFront) {
      m.health -= tool.monsterDmg;
      m.x += player.facing * 38;
      m.isChasing = true;
      hit = true;
      SFX.hitMonster();
    }
  });

  if (!hit) SFX.slash();
  updateUI();
}

// ==========================================
// AĞAÇ, TAŞ, GÖL VE YAPI ENGEL KONTROLÜ
// ==========================================
const MIN_SEPARATION = 95;

function isCollidingWithLakes(x, y, padding = 30) {
  for (let l of lakes) {
    const dx = (x - l.x) / (l.rx + padding);
    const dy = (y - l.y) / (l.ry + padding);
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

function isCollidingWithRuins(x, y, padding = 20) {
  for (let r of ruins) {
    if (
      x >= r.x - padding &&
      x <= r.x + r.w + padding &&
      y >= r.y - padding &&
      y <= r.y + r.h + padding
    ) {
      return true;
    }
  }
  return false;
}

function isPositionValid(x, y) {
  if (Math.hypot(x - WORLD_WIDTH / 2, y - WORLD_HEIGHT / 2) < 250) return false;
  if (isCollidingWithLakes(x, y, 40)) return false;
  if (isCollidingWithRuins(x, y, 40)) return false;

  for (let t of trees) {
    if (Math.hypot(x - t.x, y - t.y) < MIN_SEPARATION) return false;
  }
  for (let r of rocks) {
    if (Math.hypot(x - r.x, y - r.y) < MIN_SEPARATION) return false;
  }
  return true;
}

function spawnTree() {
  for (let attempts = 0; attempts < 35; attempts++) {
    const x = Math.random() * (WORLD_WIDTH - 260) + 130;
    const y = Math.random() * (WORLD_HEIGHT - 260) + 130;
    if (isPositionValid(x, y)) {
      trees.push({
        x: x,
        y: y,
        size: 46,
        hp: 100,
        maxHp: 100,
        shake: 0,
        leafVariation: Math.floor(Math.random() * 3)
      });
      break;
    }
  }
}

function spawnRock() {
  for (let attempts = 0; attempts < 35; attempts++) {
    const x = Math.random() * (WORLD_WIDTH - 260) + 130;
    const y = Math.random() * (WORLD_HEIGHT - 260) + 130;
    if (isPositionValid(x, y)) {
      rocks.push({
        x: x,
        y: y,
        size: 20,
        hp: 100,
        maxHp: 100,
        shake: 0,
        points: [
          { x: -16, y: 5 }, { x: -12, y: -12 }, { x: 3, y: -17 },
          { x: 16, y: -8 }, { x: 17, y: 11 }, { x: -3, y: 16 }
        ]
      });
      break;
    }
  }
}

// CHECKPOINT SİSTEMİ (<5 ise 1, >=5 ise 5. Gün)
function resetGame(forceFirstDay = false) {
  resizeCanvas();

  if (forceFirstDay) {
    dayCount = 1;
  } else {
    if (dayCount >= 5) {
      dayCount = 5;
      player.wood = Math.max(player.wood, 15);
      player.stone = Math.max(player.stone, 8);
    } else {
      dayCount = 1;
      player.wood = 0;
      player.stone = 0;
    }
  }

  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  player.health = 100;
  player.activeToolIndex = 0;
  player.isAttacking = false;
  player.attackTimer = 0;
  joystickVector = { x: 0, y: 0 };
  base = null;
  escapePortal = null;
  monsters = [];
  meats = [];
  cycleTicks = 0;
  isNight = false;
  isDead = false;
  gameWon = false;

  trees = [];
  rocks = [];
  for (let i = 0; i < 110; i++) spawnTree();
  for (let i = 0; i < 65; i++) spawnRock();

  toolCycleBtn.innerText = TOOLS[0].name;
  document.getElementById("btn-attack").innerText = TOOLS[0].btnIcon;

  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;

  dayEl.innerText = `${dayCount}/10 Gün`;
  triggerAchievement(dayCount - 1);
  updateUI();
}

// ÜS KURMA VE TAMİR SİSTEMİ (300 CAN)
function buildOrRepairBase() {
  if (isDead || gameWon) return;

  if (!base) {
    if (player.wood >= 10 && player.stone >= 5) {
      player.wood -= 10;
      player.stone -= 5;
      base = {
        x: player.x - 70,
        y: player.y - 70,
        size: 140,
        hp: 300,
        maxHp: 300
      };
      SFX.build();
      updateUI();
    }
  } else {
    // Üs zaten varsa tamir et
    if (base.hp < base.maxHp && player.wood >= 2 && player.stone >= 1) {
      player.wood -= 2;
      player.stone -= 1;
      base.hp = Math.min(base.maxHp, base.hp + 60);
      SFX.mineRock();
      updateUI();
    }
  }
}

function isInsideBase(target) {
  if (!base || base.hp <= 0) return false;
  return (
    target.x >= base.x &&
    target.x <= base.x + base.size &&
    target.y >= base.y &&
    target.y <= base.y + base.size
  );
}

function updatePlayer() {
  if (isDead || gameWon) return;

  let moveX = 0;
  let moveY = 0;
  if (keys["w"] || keys["arrowup"]) moveY -= 1;
  if (keys["s"] || keys["arrowdown"]) moveY += 1;
  if (keys["a"] || keys["arrowleft"]) { moveX -= 1; player.facing = -1; }
  if (keys["d"] || keys["arrowright"]) { moveX += 1; player.facing = 1; }

  if (currentDevice !== "pc") {
    moveX += joystickVector.x;
    moveY += joystickVector.y;
  }

  if (moveX !== 0 || moveY !== 0) {
    player.walkCycle += 0.25;
  }

  const nextX = player.x + moveX * player.speed;
  const nextY = player.y + moveY * player.speed;

  // Göl ve Yapı Çarpışma Kontrolü (İçinden yürünemez)
  if (!isCollidingWithLakes(nextX, player.y, 10) && !isCollidingWithRuins(nextX, player.y, 10)) {
    player.x = nextX;
  }
  if (!isCollidingWithLakes(player.x, nextY, 10) && !isCollidingWithRuins(player.x, nextY, 10)) {
    player.y = nextY;
  }

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
  if (isDead || gameWon) return;
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

// ==========================================
// GÜNE GÖRE YARATIK DOĞUŞU (Kurt, Ayı, İblis)
// ==========================================
function spawnNightMonsters() {
  let monsterType = "wolf";
  let count = 4 + dayCount * 2;
  let baseSpeed = 2.4;
  let baseHp = 70;

  if (dayCount >= 4 && dayCount <= 6) {
    monsterType = "bear";
    count = 3 + Math.floor(dayCount * 1.5);
    baseSpeed = 1.9;
    baseHp = 130;
  } else if (dayCount >= 7) {
    monsterType = "demon";
    count = 5 + dayCount * 2;
    baseSpeed = 2.6;
    baseHp = 110;
  }

  for (let i = 0; i < count; i++) {
    let spawnAngle = Math.random() * Math.PI * 2;
    let spawnDist = 580 + Math.random() * 320;
    monsters.push({
      type: monsterType,
      x: player.x + Math.cos(spawnAngle) * spawnDist,
      y: player.y + Math.sin(spawnAngle) * spawnDist,
      size: monsterType === "bear" ? 28 : (monsterType === "demon" ? 24 : 20),
      speed: baseSpeed + (dayCount * 0.08),
      health: baseHp + (dayCount * 10),
      maxHealth: baseHp + (dayCount * 10),
      animOffset: Math.random() * 10,
      isChasing: false,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0
    });
  }
}

function handleWorld() {
  if (isDead || gameWon) return;

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

  // Gece/Gündüz Geçişi
  if (cycleTicks >= CYCLE_DURATION) {
    cycleTicks = 0;
    isNight = !isNight;

    if (isNight) {
      SFX.night();
      spawnNightMonsters();
    } else {
      dayCount++;
      dayEl.innerText = `${dayCount}/10 Gün`;
      monsters = [];

      triggerAchievement(dayCount - 1);

      if (dayCount === 10) {
        escapePortal = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT / 2,
          hp: 150,
          maxHp: 150,
          shake: 0,
          broken: false
        };
      }

      for (let i = 0; i < 18; i++) spawnTree();
      for (let i = 0; i < 10; i++) spawnRock();
    }
  }

  const playerSafe = isInsideBase(player);

  // Canavar Çarpışma Ayrımı
  for (let i = 0; i < monsters.length; i++) {
    for (let j = i + 1; j < monsters.length; j++) {
      let m1 = monsters[i];
      let m2 = monsters[j];
      let cdx = m2.x - m1.x;
      let cdy = m2.y - m1.y;
      let cdist = Math.hypot(cdx, cdy);
      if (cdist < m1.size + m2.size) {
        let overlap = (m1.size + m2.size - cdist) / 2;
        let angle = Math.atan2(cdy, cdx);
        m1.x -= Math.cos(angle) * overlap;
        m1.y -= Math.sin(angle) * overlap;
        m2.x += Math.cos(angle) * overlap;
        m2.y += Math.sin(angle) * overlap;
      }
    }
  }

  const DETECTION_RADIUS = 350;

  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];

    if (m.health <= 0) {
      meats.push({ x: m.x, y: m.y, size: 14 });
      monsters.splice(i, 1);
      continue;
    }

    let pDist = Math.hypot(player.x - m.x, player.y - m.y);
    if (pDist < DETECTION_RADIUS) {
      m.isChasing = true;
    }

    let moveAngle;
    let currentSpeed = m.speed;

    if (m.isChasing) {
      // Hedef: Eğer oyuncu üssün içindeyse üsse yönelir, açıktaysa oyuncuya koşar
      let targetX = player.x;
      let targetY = player.y;
      if (playerSafe && base) {
        targetX = base.x + base.size / 2;
        targetY = base.y + base.size / 2;
      }
      moveAngle = Math.atan2(targetY - m.y, targetX - m.x);
    } else {
      m.wanderTimer--;
      if (m.wanderTimer <= 0) {
        m.wanderAngle = Math.random() * Math.PI * 2;
        m.wanderTimer = 60 + Math.random() * 60;
      }
      moveAngle = m.wanderAngle;
      currentSpeed = m.speed * 0.45;
    }

    let nextX = m.x + Math.cos(moveAngle) * currentSpeed;
    let nextY = m.y + Math.sin(moveAngle) * currentSpeed;

    // Göllerin içine canavarlar da giremez
    if (isCollidingWithLakes(nextX, nextY, 10)) {
      continue;
    }

    // Üsse Saldırı ve Duvar Çarpışması
    if (base && base.hp > 0) {
      let willEnterBase = (
        nextX + m.size > base.x &&
        nextX - m.size < base.x + base.size &&
        nextY + m.size > base.y &&
        nextY - m.size < base.y + base.size
      );

      if (willEnterBase) {
        // Canavar üssün dış duvarına vurur
        base.hp -= 0.15;
        if (base.hp <= 0) {
          base.hp = 0;
          SFX.mineRock(); // Yıkılma sesi
        }
      } else {
        m.x = nextX;
        m.y = nextY;
      }
    } else {
      m.x = nextX;
      m.y = nextY;
    }

    // Oyuncuya Hasar Verme (Oyuncu üs dışındaysa veya üs yıkılmışsa)
    if (!playerSafe && m.isChasing) {
      let dist = Math.hypot(player.x - m.x, player.y - m.y);
      if (dist < player.size + m.size) {
        const dmg = m.type === "bear" ? 0.95 : (m.type === "demon" ? 0.75 : 0.6);
        player.health -= dmg;
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
// ÇİZİMLER (YAPILAR, GÖLLER, HAYVANLAR)
// ==========================================

function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(player.walkCycle) * 2;

  // İsim ve Can
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 5;
  ctx.fillText(player.name, 0, -36 + bob);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-18, -31 + bob, 36, 4);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(-18, -31 + bob, (36 * player.health) / player.maxHealth, 4);

  if (player.facing === -1) ctx.scale(-1, 1);

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

  if (player.gender === "male") {
    // ERKEK SAVAŞÇI
    ctx.fillStyle = "#2471a3";
    ctx.fillRect(-10, -10 + bob, 20, 22);
    ctx.fillStyle = "#1b4f72";
    ctx.fillRect(-10, -2 + bob, 20, 4);

    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.arc(0, -20 + bob, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#566573";
    ctx.beginPath();
    ctx.arc(0, -23 + bob, 11, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    // KADIN AVCI
    ctx.fillStyle = "#922b21";
    ctx.fillRect(-9, -10 + bob, 18, 22);
    ctx.fillStyle = "#d35400";
    ctx.fillRect(-9, -2 + bob, 18, 4);

    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.arc(-2, -20 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.arc(0, -20 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d35400";
    ctx.fillRect(-14, -18 + bob, 6, 16);
  }

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(3, -22 + bob, 3, 3);

  // Alet
  ctx.save();
  ctx.translate(8, -4 + bob);
  if (player.isAttacking) ctx.rotate(0.6);

  if (player.activeToolIndex === 0) {
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(0, -3, 22, 5);
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(-2, -6, 4, 11);
    ctx.fillStyle = "#784212";
    ctx.fillRect(-6, -2, 4, 4);
  } else if (player.activeToolIndex === 1) {
    ctx.fillStyle = "#784212";
    ctx.fillRect(-4, -2, 18, 4);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(10, -8, 6, 16);
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(8, -6, 3, 12);
  } else {
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

function drawPortal(p) {
  let shakeOffset = 0;
  if (p.shake > 0) {
    shakeOffset = (Math.random() - 0.5) * p.shake;
    p.shake--;
  }

  const px = p.x + shakeOffset;
  const py = p.y;

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(px - 40, py - 85, 80, 8);
  ctx.fillStyle = "#f1c40f";
  ctx.fillRect(px - 40, py - 85, (80 * p.hp) / p.maxHp, 8);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KAPIYI KIR VE KIZINI KURTAR!", px, py - 95);

  ctx.fillStyle = "#34495e";
  ctx.fillRect(px - 36, py - 60, 72, 80);

  const pulse = Math.sin(Date.now() * 0.006) * 5;
  ctx.fillStyle = "rgba(142, 68, 173, 0.85)";
  ctx.beginPath();
  ctx.arc(px, py - 20, 26 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(px, py - 28, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(px - 6, py - 21, 12, 16);
}

// TERK EDİLMİŞ GİRİLEMEYEN YAPILAR
function drawRuins() {
  ruins.forEach(r => {
    // Zemin Gölgesi
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(r.x + 8, r.y + 8, r.w, r.h);

    if (r.type === "tower") {
      // Ahşap Gözetleme Kulesi
      ctx.fillStyle = "#4a2912";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "#321a08";
      ctx.fillRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
      ctx.fillStyle = "#784212";
      ctx.fillRect(r.x + 18, r.y + 18, r.w - 36, r.h - 36);
    } else if (r.type === "castle") {
      // Yıkık Taş Zindan / Kale
      ctx.fillStyle = "#566573";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(r.x + 12, r.y + 12, r.w - 24, r.h - 24);
      // Mazgallar
      ctx.fillStyle = "#7f8c8d";
      for (let i = 0; i < r.w; i += 28) {
        ctx.fillRect(r.x + i, r.y - 8, 16, 8);
      }
    } else {
      // Antik Taş Sunak (Altar / Stonehenge)
      ctx.fillStyle = "#7f8c8d";
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c3e50";
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// BELİRGİN VE DETAYLI KURT & AYI & İBLİS ÇİZİMLERİ
function drawMonster(m) {
  ctx.save();
  ctx.translate(m.x, m.y);

  // Can Barı
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-18, -32, 36, 5);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-18, -32, (36 * m.health) / m.maxHealth, 5);

  const pulse = Math.sin(Date.now() * 0.008 + m.animOffset) * 2;

  if (m.type === "wolf") {
    // 1-3. GÜN: ORMAN KURDU 🐺
    // Gövde
    ctx.fillStyle = "#5d6d7e";
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 + pulse, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beyaz Göğüs Tüyü
    ctx.fillStyle = "#eaeded";
    ctx.beginPath();
    ctx.ellipse(6, 2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kafa
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.arc(12, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Sivri Kulaklar
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.moveTo(8, -11); ctx.lineTo(12, -21); ctx.lineTo(16, -11); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -9); ctx.lineTo(7, -18); ctx.lineTo(10, -9); ctx.fill();

    // Parlayan Avcı Gözü
    ctx.fillStyle = m.isChasing ? "#e74c3c" : "#f39c12";
    ctx.beginPath();
    ctx.arc(14, -6, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Kıvrık Kurt Kuyruğu
    ctx.strokeStyle = "#34495e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.lineTo(-28, 8); ctx.stroke();
  } else if (m.type === "bear") {
    // 4-6. GÜN: İRİ VAHŞİ AYI 🐻
    // İri Kaslı Ayı Gövdesi
    ctx.fillStyle = "#3e1e0d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 + pulse, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sırt Yelesi
    ctx.fillStyle = "#2c1306";
    ctx.beginPath();
    ctx.ellipse(-4, -6, 18, 12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Kafa ve Açık Renk Burun
    ctx.fillStyle = "#3e1e0d";
    ctx.beginPath();
    ctx.arc(15, -4, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7d5032";
    ctx.beginPath();
    ctx.ellipse(22, -2, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yuvarlak Ayı Kulakları
    ctx.fillStyle = "#2c1306";
    ctx.beginPath();
    ctx.arc(11, -16, 5, 0, Math.PI * 2);
    ctx.arc(18, -15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Kırmızı Öfkeli Gözler
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(17, -6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Sivri Beyaz Pençeler
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(8, 15, 4, 6);
    ctx.fillRect(15, 15, 4, 6);
  } else {
    // 7-10. GÜN: KARANLIK GÖLGE İBLİSİ 👹
    ctx.fillStyle = "#4a0000";
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#780000";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Boynuzlar
    ctx.fillStyle = "#1a0000";
    ctx.beginPath();
    ctx.moveTo(-9, -10); ctx.lineTo(-17, -23); ctx.lineTo(-3, -15); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -10); ctx.lineTo(17, -23); ctx.lineTo(3, -15); ctx.fill();

    // Alevli Gözler
    ctx.fillStyle = m.isChasing ? "#ff0000" : "#f39c12";
    ctx.beginPath();
    ctx.arc(-4, -4, 4, 0, Math.PI * 2);
    ctx.arc(5, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Dişler
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-6, 4); ctx.lineTo(-3, 10); ctx.lineTo(0, 4);
    ctx.moveTo(0, 4); ctx.lineTo(3, 10); ctx.lineTo(6, 4);
    ctx.fill();
  }

  ctx.restore();
}

function drawTree(t) {
  let shakeOffset = 0;
  if (t.shake > 0) {
    shakeOffset = (Math.random() - 0.5) * t.shake;
    t.shake--;
  }

  const px = t.x + shakeOffset;
  const py = t.y;

  if (t.hp < t.maxHp) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(px - 22, py - 68, 44, 6);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(px - 22, py - 68, (44 * t.hp) / t.maxHp, 6);
  }

  // Zemin Gölgesi
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(px, py + 30, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kökler ve Kalın Gövde
  ctx.fillStyle = "#4a2912";
  ctx.beginPath();
  ctx.moveTo(px - 10, py - 12);
  ctx.lineTo(px - 20, py + 30);
  ctx.lineTo(px - 8, py + 26);
  ctx.lineTo(px, py + 30);
  ctx.lineTo(px + 8, py + 26);
  ctx.lineTo(px + 20, py + 30);
  ctx.lineTo(px + 10, py - 12);
  ctx.fill();

  // Gövde Dokusu ve Dallanma
  ctx.strokeStyle = "#321a08";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px - 4, py + 4); ctx.lineTo(px - 6, py + 24);
  ctx.moveTo(px + 4, py + 6); ctx.lineTo(px + 6, py + 25);
  ctx.moveTo(px - 6, py - 10); ctx.lineTo(px - 16, py - 26);
  ctx.moveTo(px + 6, py - 10); ctx.lineTo(px + 16, py - 26);
  ctx.stroke();

  // Katmanlı Yaprak Kümeleri
  const c1 = t.leafVariation === 0 ? "#145a32" : (t.leafVariation === 1 ? "#196f3d" : "#0e4d26");
  const c2 = t.leafVariation === 0 ? "#1e8449" : (t.leafVariation === 1 ? "#27ae60" : "#177538");
  const c3 = t.leafVariation === 0 ? "#2ecc71" : (t.leafVariation === 1 ? "#58d68d" : "#28b463");

  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(px, py - 16, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.arc(px - 16, py - 26, 26, 0, Math.PI * 2);
  ctx.arc(px + 16, py - 26, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c3;
  ctx.beginPath();
  ctx.arc(px, py - 38, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.beginPath();
  ctx.arc(px - 6, py - 44, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(r) {
  let shakeOffset = 0;
  if (r.shake > 0) {
    shakeOffset = (Math.random() - 0.5) * r.shake;
    r.shake--;
  }

  const px = r.x + shakeOffset;
  const py = r.y;

  if (r.hp < r.maxHp) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(px - 18, py - 32, 36, 5);
    ctx.fillStyle = "#3498db";
    ctx.fillRect(px - 18, py - 32, (36 * r.hp) / r.maxHp, 5);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(px, py);

  ctx.fillStyle = "#424949";
  ctx.beginPath();
  ctx.moveTo(r.points[0].x, r.points[0].y);
  for (let i = 1; i < r.points.length; i++) {
    ctx.lineTo(r.points[i].x, r.points[i].y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  ctx.moveTo(r.points[1].x, r.points[1].y);
  ctx.lineTo(r.points[2].x, r.points[2].y);
  ctx.lineTo(0, 0);
  ctx.fill();

  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.moveTo(r.points[4].x, r.points[4].y);
  ctx.lineTo(r.points[5].x, r.points[5].y);
  ctx.lineTo(0, 0);
  ctx.fill();

  ctx.strokeStyle = "#17202a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, -4); ctx.lineTo(2, 3); ctx.lineTo(7, 0);
  ctx.stroke();

  ctx.restore();
}

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

function renderMinimap() {
  mctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleX = minimapCanvas.width / WORLD_WIDTH;
  const scaleY = minimapCanvas.height / WORLD_HEIGHT;

  // Göller (Mavi)
  mctx.fillStyle = "#2980b9";
  lakes.forEach(l => {
    mctx.beginPath();
    mctx.ellipse(l.x * scaleX, l.y * scaleY, l.rx * scaleX, l.ry * scaleY, 0, 0, Math.PI * 2);
    mctx.fill();
  });

  // Üs (Mor)
  if (base && base.hp > 0) {
    mctx.fillStyle = "#9b59b6";
    mctx.fillRect(base.x * scaleX, base.y * scaleY, 7, 7);
  }

  // 10. Gün Kapısı (Sarı)
  if (escapePortal && !escapePortal.broken) {
    mctx.fillStyle = "#f1c40f";
    mctx.fillRect(escapePortal.x * scaleX - 3, escapePortal.y * scaleY - 3, 8, 8);
  }

  // Canavarlar (Kırmızı)
  mctx.fillStyle = "#e74c3c";
  monsters.forEach(m => {
    mctx.fillRect(m.x * scaleX, m.y * scaleY, 3, 3);
  });

  // Oyuncu (Yeşil)
  mctx.fillStyle = "#2ecc71";
  mctx.beginPath();
  mctx.arc(player.x * scaleX, player.y * scaleY, 3.5, 0, Math.PI * 2);
  mctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.drawImage(groundCanvas, 0, 0);

  // Terk Edilmiş Yapıları Çiz
  drawRuins();

  if (isNight) {
    ctx.fillStyle = "rgba(5, 12, 5, 0.65)";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // CAN BARLI ÜS (EV)
  if (base && base.hp > 0) {
    // Ev Can Barı
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(base.x, base.y - 18, base.size, 8);
    ctx.fillStyle = base.hp > 100 ? "#2ecc71" : "#e74c3c";
    ctx.fillRect(base.x, base.y - 18, (base.size * base.hp) / base.maxHp, 8);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Sığınak Canı: ${Math.floor(base.hp)}/${base.maxHp}`, base.x + base.size / 2, base.y - 24);

    // Ev Gövdesi
    ctx.fillStyle = "#6e2c00";
    ctx.fillRect(base.x, base.y, base.size, base.size);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 6;
    ctx.strokeRect(base.x, base.y, base.size, base.size);

    ctx.fillStyle = "#a04000";
    ctx.beginPath();
    ctx.moveTo(base.x - 12, base.y);
    ctx.lineTo(base.x + base.size / 2, base.y - 36);
    ctx.lineTo(base.x + base.size + 12, base.y);
    ctx.fill();

    ctx.fillStyle = "rgba(46, 204, 113, 0.2)";
    ctx.fillRect(base.x, base.y, base.size, base.size);
  }

  if (escapePortal && !escapePortal.broken) {
    drawPortal(escapePortal);
  }

  rocks.forEach(r => drawRock(r));
  trees.forEach(t => drawTree(t));
  meats.forEach(m => drawMeat(m.x, m.y));

  if (!isDead && !gameWon) drawPlayer(player.x, player.y);
  monsters.forEach(m => drawMonster(m));

  ctx.restore();

  renderMinimap();

  // ZAFER EKRANI
  if (gameWon) {
    ctx.fillStyle = "rgba(10, 25, 10, 0.95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎉 KIZINI KURTARDIN! 🎉", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#2ecc71";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`${player.name}, 10 Günlük Kabusu Sona Erdirdin!`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Bu lanetli diyardan sağ salim kaçmayı başardınız.", canvas.width / 2, canvas.height / 2 + 45);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "14px sans-serif";
    ctx.fillText(currentDevice !== "pc" ? "Yeniden oynamak için ekrana dokun" : "Yeniden oynamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 90);
  }

  // ÖLÜM EKRANI
  if (isDead) {
    ctx.fillStyle = "rgba(5, 10, 5, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HAYATTA KALAMADIN!", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 20px sans-serif";
    if (dayCount >= 5) {
      ctx.fillText(`${dayCount}. Günde Elendin! ➔ (5. Gün Checkpoint'ten Başlayacaksın)`, canvas.width / 2, canvas.height / 2 + 5);
    } else {
      ctx.fillText(`${dayCount}. Günde Elendin! ➔ (1. Günden Yeniden Başlayacaksın)`, canvas.width / 2, canvas.height / 2 + 5);
    }

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "15px sans-serif";
    ctx.fillText(currentDevice !== "pc" ? "Yeniden başlamak için ekrana dokun" : "Yeniden başlamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 50);
  }
}

window.addEventListener("touchstart", (e) => {
  initAudio();
  if (isDead || gameWon) {
    e.preventDefault();
    resetGame(false);
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
