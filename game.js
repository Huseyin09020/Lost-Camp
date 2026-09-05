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

// ==========================================
// HARİTA ÖLÇÜLERİ
// ==========================================
let currentMap = 1; // 1: Orman / Doğa, 2: Cehennem
let WORLD_WIDTH = 4400;
let WORLD_HEIGHT = 3200;

// UI Elementleri
const healthEl = document.getElementById("health-val");
const maxHealthEl = document.getElementById("max-health-val");
const mapNameEl = document.getElementById("map-name-val");
const dayEl = document.getElementById("day-val");
const timeEl = document.getElementById("time-val");

const woodStat = document.getElementById("wood-stat");
const stoneStat = document.getElementById("stone-stat");
const woodEl = document.getElementById("wood-val");
const stoneEl = document.getElementById("stone-val");

const copperStat = document.getElementById("copper-stat");
const silverStat = document.getElementById("silver-stat");
const ironStat = document.getElementById("iron-stat");
const goldStat = document.getElementById("gold-stat");
const copperEl = document.getElementById("copper-val");
const silverEl = document.getElementById("silver-val");
const ironEl = document.getElementById("iron-val");
const goldEl = document.getElementById("gold-val");

const deviceModal = document.getElementById("device-modal");
const gameContainer = document.getElementById("game-container");
const mobileOverlay = document.getElementById("mobile-overlay");
const pcControls = document.getElementById("pc-controls");
const fullscreenBtn = document.getElementById("btn-fullscreen");
const toolCycleBtn = document.getElementById("btn-tool-cycle");
const playerNameInput = document.getElementById("player-name-input");
const achBanner = document.getElementById("achievement-banner");
const achDesc = document.getElementById("ach-desc");
const welcomeToast = document.getElementById("welcome-toast");

// Diyalog ve Üretim Elementleri
const storyDialogue = document.getElementById("story-dialogue");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");
const dialogueCloseBtn = document.getElementById("dialogue-close-btn");

const craftingModal = document.getElementById("crafting-modal");
const btnCraftMenu = document.getElementById("btn-craft-menu");
const btnCraftTouch = document.getElementById("btn-craft-touch");
const craftCloseBtn = document.getElementById("craft-close-btn");

// Hatıra Defteri Elementleri
const guestbookModal = document.getElementById("guestbook-modal");
const commentAuthor = document.getElementById("comment-author");
const commentMessage = document.getElementById("comment-message");
const btnSubmitComment = document.getElementById("btn-submit-comment");
const commentsContainer = document.getElementById("comments-container");
const btnPlayAgain = document.getElementById("btn-play-again");

// ==========================================
// BAŞARIMLAR (1. VE 2. HARİTA)
// ==========================================
const MAP1_ACHIEVEMENTS = [
  "1. Gün: Hayat Adamı (Kurtlar Yakında!)",
  "2. Gün: Zorluklara Göğüs Germek",
  "3. Gün: Vahşi Kurtların Efendisi",
  "4. Gün: Ayıların Hükümdarlığı Başladı!",
  "5. Gün: Yarı Yolu Devirdik! (KONTROL NOKTASI)",
  "6. Gün: Ayı Avcısı",
  "7. Gün: Karanlık İblisler Uyandı!",
  "8. Gün: Cehennem Şafağı",
  "9. Gün: Sonun Başlangıcı",
  "10. Gün: KIZINI KURTARDIN! Cehennem Kapısı Açıldı!"
];

const MAP2_ACHIEVEMENTS = [
  "1. Gün: Cehenneme Ayak Bastın!",
  "2. Gün: Maden Avcısı (Altın & Demir)",
  "3. Gün: Kıyamet Yaklaşıyor",
  "4. Gün: Ateş ve Kül Ustası",
  "5. Gün: Fırtına Öncesi Sessizlik",
  "6. Gün: DİKKAT! Zehirli Yılan İstilası!",
  "7. Gün: Yılanların Zehrine Direniş",
  "8. Gün: Kurtuluş! İMAN TAŞI Belirdi!",
  "9. Gün: Kutsal Zırh ve Silahlar",
  "10. Gün: Cehennem Lordunun Ayak Sesleri",
  "11. Gün: BÜYÜK BOSS SAVAŞI & ZAFER!"
];

// ==========================================
// ZEMİN VE STATİK HARİTA ÖGELERİ
// ==========================================
const lakes = [
  { x: 1050, y: 950, rx: 240, ry: 170 },
  { x: 3250, y: 2250, rx: 280, ry: 200 },
  { x: 1350, y: 2350, rx: 200, ry: 150 }
];

const ruins = [
  { type: "tower", x: 900, y: 1800, w: 90, h: 90 },
  { type: "castle", x: 3100, y: 900, w: 140, h: 120 },
  { type: "altar", x: 2200, y: 2400, w: 110, h: 110 }
];

// Cehennem Lav Gölleri
const lavaLakes = [
  { x: 1200, y: 1100, rx: 320, ry: 220 },
  { x: 3800, y: 2400, rx: 360, ry: 240 },
  { x: 2600, y: 1600, rx: 250, ry: 180 },
  { x: 1500, y: 2800, rx: 280, ry: 200 }
];

// Zemin Önbellekleri
const groundCanvas1 = document.createElement("canvas");
groundCanvas1.width = 4400;
groundCanvas1.height = 3200;
const gctx1 = groundCanvas1.getContext("2d");

const groundCanvas2 = document.createElement("canvas");
groundCanvas2.width = 5200;
groundCanvas2.height = 3800;
const gctx2 = groundCanvas2.getContext("2d");

function bakeGround1() {
  gctx1.fillStyle = "#264817";
  gctx1.fillRect(0, 0, 4400, 3200);

  for (let i = 0; i < 900; i++) {
    const gx = Math.random() * (4400 - 60) + 30;
    const gy = Math.random() * (3200 - 60) + 30;
    const type = Math.floor(Math.random() * 3);
    const size = Math.random() * 4 + 4;
    gctx1.fillStyle = type === 0 ? "#1b3510" : (type === 1 ? "#335721" : "#f1c40f");
    gctx1.beginPath();
    gctx1.arc(gx, gy, size, 0, Math.PI * 2);
    gctx1.fill();
  }

  lakes.forEach(l => {
    gctx1.fillStyle = "#a88956";
    gctx1.beginPath();
    gctx1.ellipse(l.x, l.y, l.rx + 28, l.ry + 28, 0, 0, Math.PI * 2);
    gctx1.fill();
    gctx1.fillStyle = "#16a085";
    gctx1.beginPath();
    gctx1.ellipse(l.x, l.y, l.rx + 8, l.ry + 8, 0, 0, Math.PI * 2);
    gctx1.fill();
    gctx1.fillStyle = "#1a5276";
    gctx1.beginPath();
    gctx1.ellipse(l.x, l.y, l.rx - 14, l.ry - 14, 0, 0, Math.PI * 2);
    gctx1.fill();
    gctx1.fillStyle = "#0e2f44";
    gctx1.beginPath();
    gctx1.ellipse(l.x, l.y, l.rx - 45, l.ry - 45, 0, 0, Math.PI * 2);
    gctx1.fill();
  });

  gctx1.strokeStyle = "#c0392b";
  gctx1.lineWidth = 8;
  gctx1.strokeRect(0, 0, 4400, 3200);
}
bakeGround1();

function bakeGround2() {
  // Cehennem Zemin Rengi (Koyu Obsidyen & Volkanik Taş)
  gctx2.fillStyle = "#1a0805";
  gctx2.fillRect(0, 0, 5200, 3800);

  // Közler ve Lav Pırıltıları
  for (let i = 0; i < 1200; i++) {
    const gx = Math.random() * (5200 - 60) + 30;
    const gy = Math.random() * (3800 - 60) + 30;
    const type = Math.floor(Math.random() * 3);
    const size = Math.random() * 3.5 + 2;
    gctx2.fillStyle = type === 0 ? "#e74c3c" : (type === 1 ? "#d35400" : "#f39c12");
    gctx2.beginPath();
    gctx2.arc(gx, gy, size, 0, Math.PI * 2);
    gctx2.fill();
  }

  // Lav Gölleri
  lavaLakes.forEach(l => {
    // Siyah Bazalt Sahil
    gctx2.fillStyle = "#0a0402";
    gctx2.beginPath();
    gctx2.ellipse(l.x, l.y, l.rx + 30, l.ry + 30, 0, 0, Math.PI * 2);
    gctx2.fill();

    // Dış Koyu Lav
    gctx2.fillStyle = "#962d00";
    gctx2.beginPath();
    gctx2.ellipse(l.x, l.y, l.rx + 10, l.ry + 10, 0, 0, Math.PI * 2);
    gctx2.fill();

    // İç Parlayan Akışkan Lav
    gctx2.fillStyle = "#d35400";
    gctx2.beginPath();
    gctx2.ellipse(l.x, l.y, l.rx - 15, l.ry - 15, 0, 0, Math.PI * 2);
    gctx2.fill();

    // Merkez Sarı Ateş
    gctx2.fillStyle = "#f39c12";
    gctx2.beginPath();
    gctx2.ellipse(l.x, l.y, l.rx - 50, l.ry - 50, 0, 0, Math.PI * 2);
    gctx2.fill();
  });

  gctx2.strokeStyle = "#e74c3c";
  gctx2.lineWidth = 10;
  gctx2.strokeRect(0, 0, 5200, 3800);
}
bakeGround2();

// ==========================================
// SES MOTORU & CEHENNEM AMBİYANSI
// ==========================================
let audioCtx = null;
let nightMusicTimer = null;
let isNightMusicPlaying = false;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playWelcomeMelody() {
  initAudio();
  try {
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.09);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.09 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.09);
      osc.stop(audioCtx.currentTime + i * 0.09 + 0.35);
    });
  } catch(e) {}
}

function playTensionBeat() {
  if (!audioCtx || !isNight || isDead || gameWon) return;
  try {
    const now = audioCtx.currentTime;
    const baseFreq = currentMap === 2 ? 45 : 65; // Cehennemde daha tok ve ürkütücü

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = currentMap === 2 ? "sawtooth" : "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq / 2, now + 0.2);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
  } catch(e) {}
}

function startNightTensionMusic() {
  if (isNightMusicPlaying) return;
  isNightMusicPlaying = true;
  playTensionBeat();
  nightMusicTimer = setInterval(() => {
    if (isNight && !isDead && !gameWon) {
      playTensionBeat();
    } else {
      stopNightTensionMusic();
    }
  }, 1100);
}

function stopNightTensionMusic() {
  isNightMusicPlaying = false;
  if (nightMusicTimer) {
    clearInterval(nightMusicTimer);
    nightMusicTimer = null;
  }
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
  poisonHiss: () => {
    initAudio();
    try {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2500, audioCtx.currentTime);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch(e) {}
  },
  portalHum: () => {
    initAudio();
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(280, audioCtx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch(e) {}
  },
  imanPower: () => {
    initAudio();
    try {
      [261, 329, 392, 523, 659, 784, 1046].forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.1);
        osc.stop(audioCtx.currentTime + idx * 0.1 + 0.4);
      });
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
  }
};

// ==========================================
// OYUNCU DURUMU & ENVANTER
// ==========================================
let currentDevice = "pc";
let gameRunning = false;
let isDead = false;
let gameWon = false;

const TOOLS = [
  { id: "sword", name: "⚔️ Kılıç", btnIcon: "⚔️", monsterDmg: 45, treeDmg: 8, rockDmg: 5, oreDmg: 5 },
  { id: "axe", name: "🪓 Balta", btnIcon: "🪓", monsterDmg: 12, treeDmg: 45, rockDmg: 5, oreDmg: 5 },
  { id: "pickaxe", name: "⛏️ Kazma", btnIcon: "⛏️", monsterDmg: 12, treeDmg: 5, rockDmg: 45, oreDmg: 40 }
];

const player = {
  name: "Savaşçı",
  gender: "male",
  x: 2200,
  y: 1600,
  size: 22,
  speed: 5.2,
  health: 100,
  maxHealth: 100,

  // 1. Harita Kaynakları
  wood: 0,
  stone: 0,

  // 2. Harita Madenleri
  copper: 0,
  silver: 0,
  iron: 0,
  gold: 0,

  // Ekipmanlar
  hasIronSword: false,
  hasIronPick: false,
  hasGoldHelm: false,
  hasGoldChest: false,
  hasGoldPants: false,
  hasGoldBoots: false,
  isBlessed: false, // İman Taşı kırılınca açılan kutsal güç

  activeToolIndex: 0,
  facing: 1,
  isAttacking: false,
  attackTimer: 0,
  walkCycle: 0,

  // Zehir Durumu
  isPoisoned: false,
  poisonTimer: 0,
  poisonTickTimer: 0
};

// ==========================================
// OYUN DÜNYASI NESNELERİ
// ==========================================
let trees = [];
let rocks = [];
let ores = [];       // Bakır, Gümüş, Demir, Altın maden kayaları
let monsters = [];
let meats = [];
let base = null;
let escapePortal = null; // 1. Harita Zaman Kapısı
let hellGate = null;     // 1. Haritanın sağındaki Cehennem Geçidi
let imanStone = null;    // 2. Harita İman Taşı (2000 HP)
let hellBoss = null;     // 2. Harita 11. Gün Boss'u

const CYCLE_DURATION = 3600; // 60 saniye (1 dk gündüz, 1 dk gece)
let cycleTicks = 0;
let dayCount = 1;
let isNight = false;

// Joystick & Kamera
let joystickVector = { x: 0, y: 0 };
const camera = { x: 0, y: 0 };

// ==========================================
// HİKAYE & KONUŞMA BALONLARI SİSTEMİ
// ==========================================
function showDialogue(speaker, text, avatar = "🧙‍♂️") {
  dialogueSpeaker.innerText = speaker;
  dialogueText.innerText = text;
  document.getElementById("dialogue-avatar").innerText = avatar;
  storyDialogue.classList.remove("hidden");
}

dialogueCloseBtn.addEventListener("click", () => {
  storyDialogue.classList.add("hidden");
});

function checkStoryDialogues() {
  if (currentMap === 1) {
    if (dayCount === 1 && cycleTicks === 60) {
      showDialogue("Yaşlı Muhafız", `Hoş geldin ${player.name}! Kızın ormanın derinliklerinde Zaman Kapısı'nda hapsedildi. Ağaçlardan odun, kayalardan taş topla ve B tuşu ile güvenli bir sığınak kur. Gece olmadan hazırlan!`, "🧙‍♂️");
    } else if (dayCount === 3 && cycleTicks === 60) {
      showDialogue("Kızının Ruhu", "Baba! Kurtlar güçleniyor, dikkat et! Sığınağına çekil ve kapıyı içeriden tut!", "👧");
    }
  } else if (currentMap === 2) {
    if (dayCount === 1 && cycleTicks === 60) {
      showDialogue("Cehennem İnzivası", `Cehennem Diyarına Hoş Geldin! Burada canın 300'dür ancak geceleri canın yenilenmez, sadece sabahları dolar. Altın ve demir toplayarak zırh ve silah yap. 6. gün zehirli yılanlar istila edecek!`, "🔥");
    } else if (dayCount === 6 && cycleTicks === 60) {
      showDialogue("İç Ses", "DİKKAT! Zehirli cehennem yılanları yaklaşıyor! Seni ısırırlarsa zehir saniyelerce canını yakar. 8. güne kadar hayatta kal!", "🐍");
    } else if (dayCount === 8 && cycleTicks === 60) {
      showDialogue("Kutsal Ses", "Yılan istilası bitti! Haritanın ortasında İMAN TAŞI belirdi. Onu sadece Demir Kazma kırabilir. Kırınca ilahi güce kavuşacaksın!", "✨");
    } else if (dayCount === 11 && cycleTicks === 60) {
      showDialogue("Cehennem Lordu", "Kızını benden asla alamayacaksın ölümlü! Gel ve cehennemin gerçek alevleriyle tanış!", "👹");
    }
  }
}

// ==========================================
// BAŞARIM SİSTEMİ
// ==========================================
function triggerAchievement(index) {
  const list = currentMap === 1 ? MAP1_ACHIEVEMENTS : MAP2_ACHIEVEMENTS;
  if (index >= list.length) return;
  achDesc.innerText = list[index];
  achBanner.classList.remove("hidden");
  SFX.achievement();
  setTimeout(() => {
    achBanner.classList.add("hidden");
  }, 4500);
}

// ==========================================
// HARİTA DEĞİŞİMİ: 1. MAP ➔ 2. MAP (CEHENNEM)
// ==========================================
function transitionToHellMap() {
  currentMap = 2;
  WORLD_WIDTH = 5200;
  WORLD_HEIGHT = 3800;

  mapNameEl.innerText = "2. Harita: Cehennem";
  mapNameEl.style.color = "#e74c3c";

  // Arayüzü Maden Moduna Çevir
  woodStat.classList.add("hidden");
  stoneStat.classList.add("hidden");
  copperStat.classList.remove("hidden");
  silverStat.classList.remove("hidden");
  ironStat.classList.remove("hidden");
  goldStat.classList.remove("hidden");

  // Cehennem Can ve Stat Ayarları
  player.maxHealth = 300;
  player.health = 300;
  player.x = 2600;
  player.y = 1900;

  dayCount = 1;
  cycleTicks = 0;
  isNight = false;
  base = null;
  escapePortal = null;
  hellGate = null;
  monsters = [];
  meats = [];
  trees = [];
  rocks = [];
  ores = [];

  // Cehennem Madenlerini Dağıt
  for (let i = 0; i < 90; i++) spawnOre("copper");
  for (let i = 0; i < 75; i++) spawnOre("silver");
  for (let i = 0; i < 60; i++) spawnOre("iron");
  for (let i = 0; i < 45; i++) spawnOre("gold");

  SFX.portalHum();
  triggerAchievement(0);
  updateUI();
}

// Maden Üretimi (Cehennem)
function spawnOre(type) {
  for (let attempts = 0; attempts < 35; attempts++) {
    const x = Math.random() * (WORLD_WIDTH - 300) + 150;
    const y = Math.random() * (WORLD_HEIGHT - 300) + 150;
    if (isCollidingWithLava(x, y, 45)) continue;

    ores.push({
      type: type,
      x: x,
      y: y,
      size: 22,
      hp: 100,
      maxHp: 100,
      shake: 0
    });
    break;
  }
}

function isCollidingWithLava(x, y, padding = 30) {
  for (let l of lavaLakes) {
    const dx = (x - l.x) / (l.rx + padding);
    const dy = (y - l.y) / (l.ry + padding);
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

// ==========================================
// ÜRETİM / CRAFTING MENÜSÜ FONKSİYONLARI
// ==========================================
function toggleCraftingModal() {
  if (currentMap !== 2) {
    alert("Üretim atölyesi 2. Bölüm (Cehennem) madenlerinde kullanılabilir!");
    return;
  }
  craftingModal.classList.toggle("hidden");
  updateCraftingButtons();
}

btnCraftMenu.addEventListener("click", toggleCraftingModal);
btnCraftTouch.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toggleCraftingModal();
});
craftCloseBtn.addEventListener("click", () => craftingModal.classList.add("hidden"));

function updateCraftingButtons() {
  document.getElementById("craft-helm-btn").disabled = player.gold < 15 || player.hasGoldHelm;
  document.getElementById("craft-chest-btn").disabled = player.gold < 25 || player.hasGoldChest;
  document.getElementById("craft-pants-btn").disabled = player.gold < 18 || player.hasGoldPants;
  document.getElementById("craft-boots-btn").disabled = player.gold < 12 || player.hasGoldBoots;
  document.getElementById("craft-sword-btn").disabled = player.iron < 20 || player.hasIronSword;
  document.getElementById("craft-pick-btn").disabled = player.iron < 20 || player.hasIronPick;
}

document.getElementById("craft-helm-btn").addEventListener("click", () => {
  if (player.gold >= 15 && !player.hasGoldHelm) {
    player.gold -= 15;
    player.hasGoldHelm = true;
    player.maxHealth += 100;
    player.health += 100;
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

document.getElementById("craft-chest-btn").addEventListener("click", () => {
  if (player.gold >= 25 && !player.hasGoldChest) {
    player.gold -= 25;
    player.hasGoldChest = true;
    player.maxHealth += 200;
    player.health += 200;
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

document.getElementById("craft-pants-btn").addEventListener("click", () => {
  if (player.gold >= 18 && !player.hasGoldPants) {
    player.gold -= 18;
    player.hasGoldPants = true;
    player.maxHealth += 120;
    player.health += 120;
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

document.getElementById("craft-boots-btn").addEventListener("click", () => {
  if (player.gold >= 12 && !player.hasGoldBoots) {
    player.gold -= 12;
    player.hasGoldBoots = true;
    player.maxHealth += 80;
    player.health += 80;
    player.speed += 1.0;
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

document.getElementById("craft-sword-btn").addEventListener("click", () => {
  if (player.iron >= 20 && !player.hasIronSword) {
    player.iron -= 20;
    player.hasIronSword = true;
    TOOLS[0].monsterDmg = 90;
    TOOLS[0].name = "🗡️ Üst Düzey Demir Kılıç";
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

document.getElementById("craft-pick-btn").addEventListener("click", () => {
  if (player.iron >= 20 && !player.hasIronPick) {
    player.iron -= 20;
    player.hasIronPick = true;
    TOOLS[2].oreDmg = 85;
    TOOLS[2].name = "⛏️ Üst Düzey Demir Kazma";
    SFX.build();
    updateUI();
    updateCraftingButtons();
  }
});

// ==========================================
// CİHAZ VE GİRİŞ KONTROLLERİ
// ==========================================
let welcomeTriggered = false;
function triggerWelcome() {
  if (welcomeTriggered) return;
  welcomeTriggered = true;
  welcomeToast.classList.remove("hidden");
  playWelcomeMelody();
  setTimeout(() => welcomeToast.classList.add("hidden"), 4500);
}
window.addEventListener("pointerdown", triggerWelcome, { once: true });

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
  if (k === "c") toggleCraftingModal();
  if (k === "1") { player.activeToolIndex = 0; toolCycleBtn.innerText = TOOLS[0].name; }
  if (k === "2") { player.activeToolIndex = 1; toolCycleBtn.innerText = TOOLS[1].name; }
  if (k === "3") { player.activeToolIndex = 2; toolCycleBtn.innerText = TOOLS[2].name; }
  if (k === "b") buildOrRepairBase();
  if (e.key === " " && !isDead && !gameWon) attackOrGather();
  if (isDead && (e.key === "Enter" || e.key === " ")) resetGame(false);
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

// ==========================================
// SALDIRI VE KAYNAK TOPLAMA MEKANİĞİ
// ==========================================
function attackOrGather() {
  if (player.isAttacking) return;
  player.isAttacking = true;
  player.attackTimer = 12;

  const tool = TOOLS[player.activeToolIndex];
  const reach = 85;
  let hit = false;

  // 1. Harita Zaman Kapısını Kırma
  if (currentMap === 1 && escapePortal && !escapePortal.broken) {
    let pdist = Math.hypot(escapePortal.x - player.x, escapePortal.y - player.y);
    if (pdist < reach + 45) {
      escapePortal.hp -= 25;
      escapePortal.shake = 8;
      hit = true;
      SFX.mineRock();
      if (escapePortal.hp <= 0) {
        escapePortal.broken = true;
        // Haritanın en sağında Cehennem Kapısı belirir
        hellGate = { x: WORLD_WIDTH - 180, y: WORLD_HEIGHT / 2, size: 70 };
        showDialogue("Kızın", "Baba başardın! Ama cehennem lordu ruhumu çekiyor! Haritanın en sağındaki geçide koş!", "👧");
        SFX.victory();
      }
    }
  }

  // 2. Harita İMAN TAŞI Kırma (2000 HP - Sadece Demir Kazma)
  if (currentMap === 2 && imanStone && !imanStone.broken) {
    let idist = Math.hypot(imanStone.x - player.x, imanStone.y - player.y);
    if (idist < reach + 50) {
      if (player.hasIronPick && tool.id === "pickaxe") {
        imanStone.hp -= 60;
        imanStone.shake = 8;
        hit = true;
        SFX.mineRock();
        if (imanStone.hp <= 0) {
          imanStone.broken = true;
          player.isBlessed = true;
          player.maxHealth = 1000;
          player.health = 1000;
          TOOLS[0].monsterDmg = 180; // Kutsal Kılıç
          TOOLS[0].name = "✨ Kutsal İman Kılıcı";
          SFX.imanPower();
          showDialogue("İlahi Nur", "İMAN TAŞI PARÇALANDI! Zırhların ve silahların ilahi güce kavuştu, canın 1000'e çıktı! Artık Cehennem Lordu ile yüzleşmeye hazırsın!", "🌟");
        }
      } else {
        alert("Bu kutsal taşı sadece 'Üst Düzey Demir Kazma' kırabilir! Demir toplayıp atölyede üret!");
      }
    }
  }

  // 2. Harita BOSS Vurma
  if (currentMap === 2 && hellBoss && hellBoss.hp > 0) {
    let bdist = Math.hypot(hellBoss.x - player.x, hellBoss.y - player.y);
    if (bdist < reach + hellBoss.size) {
      const dmg = player.isBlessed ? (tool.monsterDmg * 1.5) : (tool.monsterDmg * 0.4);
      hellBoss.hp -= dmg;
      hellBoss.shake = 8;
      hit = true;
      SFX.hitMonster();
      if (hellBoss.hp <= 0) {
        hellBoss.hp = 0;
        gameWon = true;
        stopNightTensionMusic();
        SFX.victory();
        openGuestbook();
      }
    }
  }

  // Cehennem Madenlerini Kırma (Bakır, Gümüş, Demir, Altın)
  if (!hit && currentMap === 2) {
    for (let i = ores.length - 1; i >= 0; i--) {
      let o = ores[i];
      let odist = Math.hypot(o.x - player.x, o.y - player.y);
      if (odist < reach + o.size) {
        o.hp -= tool.oreDmg;
        o.shake = 6;
        hit = true;
        SFX.mineRock();
        if (o.hp <= 0) {
          if (o.type === "copper") player.copper += 3;
          if (o.type === "silver") player.silver += 2;
          if (o.type === "iron") player.iron += 2;
          if (o.type === "gold") player.gold += 1;
          ores.splice(i, 1);
          SFX.pickup();
        }
        break;
      }
    }
  }

  // Ağaç Kırma (Map 1)
  if (!hit && currentMap === 1) {
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

  // Taş Kırma (Map 1)
  if (!hit && currentMap === 1) {
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

  // Canavar / Yılan Vurma
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
// CANAVAR VE YILAN DOĞUŞLARI
// ==========================================
function spawnNightMonsters() {
  if (currentMap === 1) {
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
  } else if (currentMap === 2) {
    // 2. Harita: Cehennem Yaratıkları & 6-8. Gün Yılan İstilası
    let isSnakeDay = dayCount >= 6 && dayCount <= 8;
    let count = isSnakeDay ? 12 : 7;

    for (let i = 0; i < count; i++) {
      let spawnAngle = Math.random() * Math.PI * 2;
      let spawnDist = 600 + Math.random() * 350;
      let mType = isSnakeDay ? "snake" : "hellhound";

      monsters.push({
        type: mType,
        x: player.x + Math.cos(spawnAngle) * spawnDist,
        y: player.y + Math.sin(spawnAngle) * spawnDist,
        size: mType === "snake" ? 18 : 25,
        speed: mType === "snake" ? 3.1 : 2.7,
        health: mType === "snake" ? 45 : 140,
        maxHealth: mType === "snake" ? 45 : 140,
        animOffset: Math.random() * 10,
        isChasing: true,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0
      });
    }
  }
}

// ==========================================
// CEHENNEM BOSS DOĞUŞU (11. GÜN)
// ==========================================
function spawnHellBoss() {
  hellBoss = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2 - 100,
    size: 70,
    hp: 3500,
    maxHp: 3500,
    speed: 2.2,
    shake: 0,
    attackCooldown: 0
  };
  SFX.nightWarning();
}

// ==========================================
// HARİTA VE OYUN DÖNGÜSÜ GÜNCELLEMESİ
// ==========================================
function handleWorld() {
  if (isDead || gameWon) return;

  cycleTicks++;
  checkStoryDialogues();

  // Zehir Mekaniği (3 Saniye, 3-3-3 Hasar)
  if (player.isPoisoned) {
    player.poisonTimer--;
    player.poisonTickTimer++;
    if (player.poisonTickTimer >= 60) {
      player.poisonTickTimer = 0;
      player.health -= 3;
      if (player.health <= 0) {
        player.health = 0;
        handleDeath();
      }
      updateUI();
    }
    if (player.poisonTimer <= 0) {
      player.isPoisoned = false;
    }
  }

  // Cehennem Geçidi Kontrolü (1. Haritanın Sağındaki Kapı)
  if (currentMap === 1 && hellGate) {
    let gdist = Math.hypot(hellGate.x - player.x, hellGate.y - player.y);
    if (gdist < hellGate.size) {
      transitionToHellMap();
      return;
    }
  }

  const remainingTicks = CYCLE_DURATION - cycleTicks;
  const remainingSeconds = Math.ceil(remainingTicks / 60);
  const minStr = Math.floor(remainingSeconds / 60);
  const secStr = (remainingSeconds % 60).toString().padStart(2, "0");

  timeEl.innerText = isNight ? `Gece 🌙 (${minStr}:${secStr})` : `Gündüz ☀️ (${minStr}:${secStr})`;
  timeEl.style.color = isNight ? "#e74c3c" : "#2ecc71";

  // Gece / Gündüz Döngüsü
  if (cycleTicks >= CYCLE_DURATION) {
    cycleTicks = 0;
    isNight = !isNight;

    if (isNight) {
      startNightTensionMusic();
      spawnNightMonsters();
    } else {
      stopNightTensionMusic();
      dayCount++;
      dayEl.innerText = `${dayCount}. Gün`;
      monsters = [];

      // CEHENNEM KURALI: Geceleri can dolmaz, sadece sabah tam fullenir!
      if (currentMap === 2) {
        player.health = player.maxHealth;
        player.isPoisoned = false;
      }

      triggerAchievement(dayCount - 1);

      // 1. Harita 10. Gün Portalı
      if (currentMap === 1 && dayCount === 10) {
        escapePortal = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT / 2,
          hp: 150,
          maxHp: 150,
          shake: 0,
          broken: false
        };
      }

      // 2. Harita 8. Gün İMAN TAŞI Belirmesi (2000 HP)
      if (currentMap === 2 && dayCount === 8) {
        imanStone = {
          x: WORLD_WIDTH / 2,
          y: WORLD_HEIGHT / 2,
          hp: 2000,
          maxHp: 2000,
          shake: 0,
          broken: false
        };
      }

      // 2. Harita 11. Gün BOSS Belirmesi
      if (currentMap === 2 && dayCount === 11) {
        spawnHellBoss();
      }

      if (currentMap === 1) {
        for (let i = 0; i < 18; i++) spawnTree();
        for (let i = 0; i < 10; i++) spawnRock();
      }
    }
  }

  // Cehennem Boss Yapay Zekası
  if (currentMap === 2 && hellBoss && hellBoss.hp > 0) {
    let bAngle = Math.atan2(player.y - hellBoss.y, player.x - hellBoss.x);
    hellBoss.x += Math.cos(bAngle) * hellBoss.speed;
    hellBoss.y += Math.sin(bAngle) * hellBoss.speed;

    let bdist = Math.hypot(player.x - hellBoss.x, player.y - hellBoss.y);
    if (bdist < hellBoss.size + player.size) {
      hellBoss.attackCooldown++;
      if (hellBoss.attackCooldown >= 45) {
        hellBoss.attackCooldown = 0;
        player.health -= 35; // Boss darbesi
        if (player.health <= 0) {
          player.health = 0;
          handleDeath();
        }
        updateUI();
      }
    }
  }

  // Canavarlar ve Yılanların Hareketi
  const playerSafe = isInsideBase(player);

  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];

    if (m.health <= 0) {
      meats.push({ x: m.x, y: m.y, size: 14 });
      monsters.splice(i, 1);
      continue;
    }

    let pDist = Math.hypot(player.x - m.x, player.y - m.y);
    if (pDist < 400) m.isChasing = true;

    let moveAngle;
    let currentSpeed = m.speed;

    if (m.isChasing) {
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

    m.x += Math.cos(moveAngle) * currentSpeed;
    m.y += Math.sin(moveAngle) * currentSpeed;

    // Oyuncuya Saldırı
    if (!playerSafe && m.isChasing) {
      let dist = Math.hypot(player.x - m.x, player.y - m.y);
      if (dist < player.size + m.size) {
        if (m.type === "snake") {
          // YILAN ÖZEL SALDIRISI: İlk vuruş 10 hasar, yılanın kendisi hasar alır, 3 sn zehirler
          player.health -= 10;
          m.health -= 20; // Saldıran yılan hırpalanır
          player.isPoisoned = true;
          player.poisonTimer = 180; // 3 saniye (60 fps * 3)
          player.poisonTickTimer = 0;
          SFX.poisonHiss();
        } else {
          const dmg = m.type === "bear" ? 0.95 : (m.type === "demon" ? 0.75 : 0.6);
          player.health -= dmg;
        }

        if (player.health <= 0) {
          player.health = 0;
          handleDeath();
        }
        updateUI();
      }
    }
  }
}

// ==========================================
// ÖLÜM VE CEZA MEKANİĞİ
// ==========================================
function handleDeath() {
  isDead = true;
  stopNightTensionMusic();

  // Envanterdeki kaynakların yarısı kaybolur!
  player.wood = Math.floor(player.wood / 2);
  player.stone = Math.floor(player.stone / 2);
  player.copper = Math.floor(player.copper / 2);
  player.silver = Math.floor(player.silver / 2);
  player.iron = Math.floor(player.iron / 2);
  player.gold = Math.floor(player.gold / 2);
}

function resetGame(forceFirstDay = false) {
  resizeCanvas();
  stopNightTensionMusic();
  isDead = false;
  gameWon = false;

  if (currentMap === 2) {
    // 2. Harita Checkpoint Kuralı:
    // Boss gününde ölürse İman Taşı'nı kazdığı güçlü ana döner
    if (dayCount >= 11 || player.isBlessed) {
      dayCount = 8;
      player.health = player.maxHealth;
      player.isBlessed = true;
      player.maxHealth = 1000;
      player.health = 1000;
      TOOLS[0].monsterDmg = 180;
    } else {
      dayCount = 1;
      player.maxHealth = 300;
      player.health = 300;
    }
  } else {
    // 1. Harita Checkpoint Kuralı (<5 ise 1, >=5 ise 5. Gün)
    if (dayCount >= 5 && !forceFirstDay) {
      dayCount = 5;
    } else {
      dayCount = 1;
    }
    player.maxHealth = 100;
    player.health = 100;
  }

  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  player.isPoisoned = false;
  base = null;
  escapePortal = null;
  hellGate = null;
  imanStone = null;
  hellBoss = null;
  monsters = [];
  meats = [];
  cycleTicks = 0;
  isNight = false;

  if (currentMap === 1) {
    trees = [];
    rocks = [];
    for (let i = 0; i < 110; i++) spawnTree();
    for (let i = 0; i < 65; i++) spawnRock();
  }

  dayEl.innerText = `${dayCount}. Gün`;
  triggerAchievement(dayCount - 1);
  updateUI();
}

// ==========================================
// HATIRA DEFTERİ & GELİŞTİRİCİ YORUMLARI
// ==========================================
function openGuestbook() {
  guestbookModal.classList.remove("hidden");
  renderGuestbookComments();
}

function loadGuestbookComments() {
  const saved = localStorage.getItem("survival_guestbook_comments");
  if (saved) {
    return JSON.parse(saved);
  }
  // Varsayılan Geliştirici Mesajı
  return [
    { author: "Hüseyin (Oyun Geliştiricisi)", message: "Oyunu sonuna kadar oynayıp kızını kurtardığın için tebrik ederim! Yorumlarını ve tavsiyelerini buraya yazabilirsin, hepsini okuyorum!" }
  ];
}

function renderGuestbookComments() {
  const comments = loadGuestbookComments();
  commentsContainer.innerHTML = "";
  comments.forEach(c => {
    const card = document.createElement("div");
    card.className = "comment-card";
    card.innerHTML = `<div class="comment-card-author">👤 ${escapeHtml(c.author)}:</div><div class="comment-card-msg">${escapeHtml(c.message)}</div>`;
    commentsContainer.appendChild(card);
  });
}

btnSubmitComment.addEventListener("click", () => {
  const author = commentAuthor.value.trim();
  const msg = commentMessage.value.trim();
  if (author.length === 0 || msg.length === 0) {
    alert("Lütfen adınızı ve mesajınızı yazın!");
    return;
  }
  const comments = loadGuestbookComments();
  comments.unshift({ author: author, message: msg });
  localStorage.setItem("survival_guestbook_comments", JSON.stringify(comments));
  commentMessage.value = "";
  renderGuestbookComments();
  alert("Mesajınız Hatıra Defterine kaydedildi!");
});

btnPlayAgain.addEventListener("click", () => {
  guestbookModal.classList.add("hidden");
  currentMap = 1;
  WORLD_WIDTH = 4400;
  WORLD_HEIGHT = 3200;
  mapNameEl.innerText = "1. Harita";
  mapNameEl.style.color = "#fff";
  woodStat.classList.remove("hidden");
  stoneStat.classList.remove("hidden");
  copperStat.classList.add("hidden");
  silverStat.classList.add("hidden");
  ironStat.classList.add("hidden");
  goldStat.classList.add("hidden");
  resetGame(true);
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

// ==========================================
// ÇİZİMLER (CEHENNEM, YILAN, İMAN TAŞI, BOSS)
// ==========================================
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(player.walkCycle) * 2;

  // Zehir Efekti Yeşil Işıltı
  if (player.isPoisoned) {
    ctx.strokeStyle = "#2ecc71";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, bob, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Kutsal İman Gücü Parıltısı
  if (player.isBlessed) {
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#f1c40f";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, bob, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // İsim ve Can Barı
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.name, 0, -36 + bob);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-22, -31 + bob, 44, 5);
  ctx.fillStyle = player.isPoisoned ? "#2ecc71" : "#e74c3c";
  ctx.fillRect(-22, -31 + bob, (44 * player.health) / player.maxHealth, 5);

  if (player.facing === -1) ctx.scale(-1, 1);

  if (player.isAttacking) {
    ctx.strokeStyle = player.isBlessed ? "#f1c40f" : "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(14, -4 + bob, 48, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }

  ctx.fillStyle = "#1b2631";
  ctx.fillRect(-8, 10 + bob, 6, 8);
  ctx.fillRect(2, 10 - bob, 6, 8);

  // Gövde Zırhı
  ctx.fillStyle = player.hasGoldChest ? "#f39c12" : (player.gender === "male" ? "#2471a3" : "#922b21");
  ctx.fillRect(-10, -10 + bob, 20, 22);

  // Kafa
  ctx.fillStyle = "#f5cba7";
  ctx.beginPath();
  ctx.arc(0, -20 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  // Kask / Miğfer
  ctx.fillStyle = player.hasGoldHelm ? "#f1c40f" : "#566573";
  ctx.beginPath();
  ctx.arc(0, -23 + bob, 11, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(3, -22 + bob, 3, 3);

  // Alet
  ctx.save();
  ctx.translate(8, -4 + bob);
  if (player.isAttacking) ctx.rotate(0.6);

  if (player.activeToolIndex === 0) {
    ctx.fillStyle = player.hasIronSword ? "#bdc3c7" : "#ecf0f1";
    ctx.fillRect(0, -3, 24, 5);
  } else if (player.activeToolIndex === 1) {
    ctx.fillStyle = "#784212";
    ctx.fillRect(-4, -2, 18, 4);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(10, -8, 6, 16);
  } else {
    ctx.fillStyle = "#784212";
    ctx.fillRect(-4, -2, 18, 4);
    ctx.fillStyle = player.hasIronPick ? "#34495e" : "#95a5a6";
    ctx.beginPath();
    ctx.arc(14, -2, 9, -Math.PI / 2, Math.PI / 2, false);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// 2. Harita İMAN TAŞI Çizimi (2000 HP)
function drawImanStone(st) {
  let shakeOffset = (Math.random() - 0.5) * st.shake;
  if (st.shake > 0) st.shake--;

  const px = st.x + shakeOffset;
  const py = st.y;

  // Can Barı
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(px - 50, py - 90, 100, 10);
  ctx.fillStyle = "#f1c40f";
  ctx.fillRect(px - 50, py - 90, (100 * st.hp) / st.maxHp, 10);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`KUTSAL İMAN TAŞI (${st.hp}/${st.maxHp})`, px, py - 100);

  // Parlayan Kutsal Monolit Taş
  ctx.shadowColor = "#f1c40f";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.moveTo(px, py - 70);
  ctx.lineTo(px + 35, py + 20);
  ctx.lineTo(px - 35, py + 20);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

// 2. Harita BOSS Çizimi
function drawHellBoss(b) {
  ctx.save();
  ctx.translate(b.x, b.y);

  // Boss Can Barı
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(-60, -90, 120, 12);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(-60, -90, (120 * b.hp) / b.maxHp, 12);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`CEHENNEM LORDU (${b.hp}/${b.maxHp})`, 0, -105);

  // Dev İblis Gövdesi
  ctx.fillStyle = "#780000";
  ctx.beginPath();
  ctx.arc(0, 0, b.size, 0, Math.PI * 2);
  ctx.fill();

  // Alevli Boynuzlar
  ctx.fillStyle = "#e67e22";
  ctx.beginPath();
  ctx.moveTo(-25, -40); ctx.lineTo(-45, -85); ctx.lineTo(-10, -55); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(25, -40); ctx.lineTo(45, -85); ctx.lineTo(10, -55); ctx.fill();

  // Yanan Kırmızı Gözler
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(-18, -15, 10, 0, Math.PI * 2);
  ctx.arc(18, -15, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ZEHİRLİ YILAN ÇİZİMİ (6-8. Gün)
function drawSnake(m) {
  ctx.save();
  ctx.translate(m.x, m.y);

  // Can Barı
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-14, -20, 28, 4);
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(-14, -20, (28 * m.health) / m.maxHealth, 4);

  // Kıvrılan Yeşil Zehirli Gövde
  ctx.strokeStyle = "#27ae60";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(-8, -10, 0, 0);
  ctx.quadraticCurveTo(8, 10, 16, 0);
  ctx.stroke();

  // Kafa ve Çatallı Dil
  ctx.fillStyle = "#1e8449";
  ctx.beginPath();
  ctx.arc(18, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(24, 0); ctx.lineTo(30, -3);
  ctx.moveTo(24, 0); ctx.lineTo(30, 3);
  ctx.stroke();

  ctx.restore();
}

function drawMonster(m) {
  if (m.type === "snake") {
    drawSnake(m);
    return;
  }

  ctx.save();
  ctx.translate(m.x, m.y);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(-18, -32, 36, 5);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-18, -32, (36 * m.health) / m.maxHealth, 5);

  const pulse = Math.sin(Date.now() * 0.008 + m.animOffset) * 2;

  if (m.type === "wolf") {
    ctx.fillStyle = "#5d6d7e";
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 + pulse, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.arc(12, -4, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (m.type === "bear") {
    ctx.fillStyle = "#3e1e0d";
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 + pulse, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#4a0000";
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 1. Haritanın Sağındaki Cehennem Geçidi (Kırmızı Portalı)
function drawHellGate(g) {
  ctx.save();
  ctx.translate(g.x, g.y);

  const pulse = Math.sin(Date.now() * 0.005) * 8;
  ctx.shadowColor = "#e74c3c";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(0, 0, g.size + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.arc(0, 0, (g.size - 15) + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CEHENNEM GEÇİDİ ➔", 0, -g.size - 15);
  ctx.restore();
}

// Maden Kayaları Çizimi (Bakır, Gümüş, Demir, Altın)
function drawOre(o) {
  let shakeOffset = (Math.random() - 0.5) * o.shake;
  if (o.shake > 0) o.shake--;

  const px = o.x + shakeOffset;
  const py = o.y;

  ctx.save();
  ctx.translate(px, py);

  ctx.fillStyle = "#2c1e19";
  ctx.beginPath();
  ctx.arc(0, 0, o.size, 0, Math.PI * 2);
  ctx.fill();

  // Maden Rengi Pırıltısı
  let oreColor = "#d35400"; // Bakır
  if (o.type === "silver") oreColor = "#bdc3c7";
  if (o.type === "iron") oreColor = "#7f8c8d";
  if (o.type === "gold") oreColor = "#f1c40f";

  ctx.fillStyle = oreColor;
  ctx.beginPath();
  ctx.arc(-4, -4, 6, 0, Math.PI * 2);
  ctx.arc(5, 3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateUI() {
  healthEl.innerText = Math.max(0, Math.floor(player.health));
  maxHealthEl.innerText = player.maxHealth;

  woodEl.innerText = player.wood;
  stoneEl.innerText = player.stone;

  copperEl.innerText = player.copper;
  silverEl.innerText = player.silver;
  ironEl.innerText = player.iron;
  goldEl.innerText = player.gold;
}

// ==========================================
// RENDER DÖNGÜSÜ
// ==========================================
function renderMinimap() {
  mctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleX = minimapCanvas.width / WORLD_WIDTH;
  const scaleY = minimapCanvas.height / WORLD_HEIGHT;

  if (currentMap === 1) {
    mctx.fillStyle = "#2980b9";
    lakes.forEach(l => {
      mctx.beginPath();
      mctx.ellipse(l.x * scaleX, l.y * scaleY, l.rx * scaleX, l.ry * scaleY, 0, 0, Math.PI * 2);
      mctx.fill();
    });
  } else {
    mctx.fillStyle = "#d35400";
    lavaLakes.forEach(l => {
      mctx.beginPath();
      mctx.ellipse(l.x * scaleX, l.y * scaleY, l.rx * scaleX, l.ry * scaleY, 0, 0, Math.PI * 2);
      mctx.fill();
    });
  }

  mctx.fillStyle = "#e74c3c";
  monsters.forEach(m => mctx.fillRect(m.x * scaleX, m.y * scaleY, 3, 3));

  mctx.fillStyle = "#2ecc71";
  mctx.beginPath();
  mctx.arc(player.x * scaleX, player.y * scaleY, 3.5, 0, Math.PI * 2);
  mctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  if (currentMap === 1) {
    ctx.drawImage(groundCanvas1, 0, 0);
    drawRuins();
    if (escapePortal && !escapePortal.broken) drawPortal(escapePortal);
    if (hellGate) drawHellGate(hellGate);
    rocks.forEach(r => drawRock(r));
    trees.forEach(t => drawTree(t));
  } else {
    ctx.drawImage(groundCanvas2, 0, 0);
    ores.forEach(o => drawOre(o));
    if (imanStone && !imanStone.broken) drawImanStone(imanStone);
    if (hellBoss && hellBoss.hp > 0) drawHellBoss(hellBoss);
  }

  if (base && base.hp > 0) drawBaseStructure(base);
  meats.forEach(m => drawMeat(m.x, m.y));

  if (!isDead && !gameWon) drawPlayer(player.x, player.y);
  monsters.forEach(m => drawMonster(m));

  if (isNight) {
    ctx.fillStyle = currentMap === 1 ? "rgba(5, 10, 18, 0.72)" : "rgba(35, 5, 2, 0.78)";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  ctx.restore();
  renderMinimap();

  // ÖLÜM EKRANI
  if (isDead) {
    ctx.fillStyle = "rgba(5, 5, 5, 0.94)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HAYATTA KALAMADIN!", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("Envanterindeki maden ve kaynakların yarısı kayboldu!", canvas.width / 2, canvas.height / 2 + 5);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "14px sans-serif";
    ctx.fillText(currentDevice !== "pc" ? "Yeniden başlamak için ekrana dokun" : "Yeniden başlamak için BOŞLUK veya ENTER'a bas", canvas.width / 2, canvas.height / 2 + 50);
  }
}

// Eksik Çizim Yardımcı Fonksiyonları (Tree, Rock, Portal, Base, Meat)
function drawTree(t) {
  ctx.fillStyle = "#4a2912";
  ctx.fillRect(t.x - 8, t.y, 16, 26);
  ctx.fillStyle = "#1e8449";
  ctx.beginPath();
  ctx.arc(t.x, t.y - 12, 32, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(r) {
  ctx.fillStyle = "#566573";
  ctx.beginPath();
  ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
  ctx.fill();
}

function drawPortal(p) {
  ctx.fillStyle = "#8e44ad";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KAPIYI KIR!", p.x, p.y - 45);
}

function drawBaseStructure(b) {
  ctx.fillStyle = "#543013";
  ctx.fillRect(b.x, b.y, b.size, b.size - 12);
  ctx.fillStyle = "#873600";
  ctx.beginPath();
  ctx.moveTo(b.x - 12, b.y + 6);
  ctx.lineTo(b.x + b.size / 2, b.y - 42);
  ctx.lineTo(b.x + b.size + 12, b.y + 6);
  ctx.fill();
}

function drawMeat(x, y) {
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawRuins() {
  ruins.forEach(r => {
    ctx.fillStyle = "#4a2912";
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });
}

function buildOrRepairBase() {
  if (currentMap !== 1) {
    alert("Cehennem diyarında ahşap sığınak kurulamaz! Madenlerle zırh üretmelisin!");
    return;
  }
  if (!base) {
    if (player.wood >= 10 && player.stone >= 5) {
      player.wood -= 10;
      player.stone -= 5;
      base = { x: player.x - 75, y: player.y - 75, size: 150, hp: 300, maxHp: 300 };
      SFX.build();
      updateUI();
    }
  }
}

function isInsideBase(target) {
  if (!base || base.hp <= 0) return false;
  return target.x >= base.x && target.x <= base.x + base.size && target.y >= base.y && target.y <= base.y + base.size;
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

  if (moveX !== 0 || moveY !== 0) player.walkCycle += 0.25;

  const nextX = player.x + moveX * player.speed;
  const nextY = player.y + moveY * player.speed;

  if (currentMap === 1) {
    player.x = Math.max(player.size, Math.min(WORLD_WIDTH - player.size, nextX));
    player.y = Math.max(player.size, Math.min(WORLD_HEIGHT - player.size, nextY));
  } else {
    if (!isCollidingWithLava(nextX, player.y, 8)) player.x = nextX;
    if (!isCollidingWithLava(player.x, nextY, 8)) player.y = nextY;
  }

  if (player.isAttacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) player.isAttacking = false;
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

function spawnTree() {
  trees.push({ x: Math.random() * (WORLD_WIDTH - 200) + 100, y: Math.random() * (WORLD_HEIGHT - 200) + 100, size: 40, hp: 100, maxHp: 100, shake: 0 });
}
function spawnRock() {
  rocks.push({ x: Math.random() * (WORLD_WIDTH - 200) + 100, y: Math.random() * (WORLD_HEIGHT - 200) + 100, size: 22, hp: 100, maxHp: 100, shake: 0 });
}

window.addEventListener("touchstart", (e) => {
  initAudio();
  if (isDead) {
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
