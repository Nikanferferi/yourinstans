const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const authPanel = document.getElementById('authPanel');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const deviceModeInput = document.getElementById('deviceMode');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const hudScore = document.getElementById('hudScore');
const hudBest = document.getElementById('hudBest');
const hudPlayer = document.getElementById('hudPlayer');

const settingsDialog = document.getElementById('settingsDialog');
const leaderboardView = document.getElementById('leaderboardView');
const leaderboardList = document.getElementById('leaderboardList');
const adminDialog = document.getElementById('adminDialog');
const adminGate = document.getElementById('adminGate');
const adminTools = document.getElementById('adminTools');
const adminLog = document.getElementById('adminLog');

const settings = {
  sound: true,
  animations: true,
  effects: true,
  theme: 'classic'
};

const cloud = {
  key: 'flappy_profiles_table',
  getProfiles() {
    return JSON.parse(localStorage.getItem(this.key) || '{}');
  },
  saveProfiles(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  upsertProfile(name, patch = {}) {
    const profiles = this.getProfiles();
    const original = profiles[name] || { highScore: 0, gamesPlayed: 0, device: 'unknown' };
    profiles[name] = { ...original, ...patch };
    this.saveProfiles(profiles);
    return profiles[name];
  }
};

let profile = null;
let gameState = 'start';
let score = 0;
let birdY = 260;
let birdV = 0;
let pipes = [];
let tick = 0;
let effectsPhase = 0;

const gravity = 0.35;
const jumpImpulse = -6.2;
const pipeGap = 170;
const pipeWidth = 56;
const pipeSpeed = 2.3;

function setTheme() {
  const root = document.documentElement;
  const themes = {
    classic: ['#86d4f8', '#c3f5ff'],
    sunset: ['#ff9a6a', '#ffd39e'],
    night: ['#182848', '#4b6cb7']
  };
  const [a, b] = themes[settings.theme];
  root.style.setProperty('--bg1', a);
  root.style.setProperty('--bg2', b);
}

function renderLeaderboard() {
  const rows = Object.entries(cloud.getProfiles())
    .sort((a, b) => b[1].highScore - a[1].highScore)
    .slice(0, 50);
  leaderboardList.innerHTML = rows.length
    ? rows.map(([name, row], idx) => `<li>#${idx + 1} ${name} — ${row.highScore} pts (${row.device})</li>`).join('')
    : '<li>No scores yet</li>';
}

function resetRun() {
  score = 0;
  birdY = canvas.height / 2;
  birdV = 0;
  pipes = [];
  tick = 0;
}

function spawnPipe() {
  const topHeight = 90 + Math.random() * (canvas.height - 300);
  pipes.push({ x: canvas.width + 20, topHeight, passed: false });
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (settings.effects) {
    effectsPhase += 0.01;
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#fff';
      const x = ((i * 160 + effectsPhase * 50) % (canvas.width + 100)) - 50;
      ctx.beginPath();
      ctx.arc(x, 90 + i * 12, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#7ec850';
  ctx.fillRect(0, canvas.height - 84, canvas.width, 84);

  ctx.fillStyle = '#2c9e3f';
  pipes.forEach((p) => {
    ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
    ctx.fillRect(p.x, p.topHeight + pipeGap, pipeWidth, canvas.height);
  });

  // bird with mini flap animation
  ctx.save();
  const flap = settings.animations ? Math.sin(tick / 5) * 3 : 0;
  ctx.translate(95, birdY + flap);
  ctx.rotate(Math.max(-0.3, Math.min(0.8, birdV / 8)));
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(8, -5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7e30';
  ctx.beginPath();
  ctx.moveTo(16, -2);
  ctx.lineTo(26, 1);
  ctx.lineTo(16, 4);
  ctx.fill();
  ctx.restore();
}

function beep(freq = 440, duration = 0.05) {
  if (!settings.sound) return;
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.frequency.value = freq;
  osc.start();
  gain.gain.setValueAtTime(0.08, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.stop(ac.currentTime + duration);
}

function setOverlay(text) {
  overlay.classList.remove('hidden');
  overlay.innerHTML = `<div>${text}</div>`;
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function endGame() {
  gameState = 'over';
  cloud.upsertProfile(profile.name, {
    highScore: Math.max(profile.highScore || 0, score),
    gamesPlayed: (profile.gamesPlayed || 0) + 1,
    device: profile.device
  });
  profile = { ...profile, ...cloud.getProfiles()[profile.name] };
  hudBest.textContent = profile.highScore;
  setOverlay(`Game Over<br/>Score: ${score}<br/>Tap / Space to restart`);
  beep(120, 0.2);
}

function startGameIfReady() {
  if (!profile) return;
  if (gameState === 'start' || gameState === 'over') {
    resetRun();
    gameState = 'playing';
    hideOverlay();
  }
  birdV = jumpImpulse;
  beep(540, 0.03);
}

function update() {
  tick++;
  if (gameState === 'playing') {
    birdV += gravity;
    birdY += birdV;

    if (tick % 92 === 0) spawnPipe();

    pipes.forEach((p) => {
      p.x -= pipeSpeed;
      const inBirdX = 95 + 18 > p.x && 95 - 18 < p.x + pipeWidth;
      const inPipeGap = birdY - 14 > p.topHeight && birdY + 14 < p.topHeight + pipeGap;
      if (inBirdX && !inPipeGap) endGame();

      if (!p.passed && p.x + pipeWidth < 95) {
        p.passed = true;
        score += 1;
        hudScore.textContent = score;
        beep(720, 0.04);
      }
    });

    pipes = pipes.filter((p) => p.x > -100);

    if (birdY > canvas.height - 95 || birdY < 0) endGame();
  }

  drawScene();
  requestAnimationFrame(update);
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;

  let device = deviceModeInput.value;
  if (device === 'auto') device = window.innerWidth < 800 ? 'mobile' : 'desktop';

  const row = cloud.upsertProfile(name, { device });
  profile = { name, ...row };
  hudPlayer.textContent = name;
  hudBest.textContent = profile.highScore || 0;
  hudScore.textContent = 0;

  authPanel.classList.add('hidden');
  hud.classList.remove('hidden');
  gameState = 'start';
  setOverlay('Tap / Click / Space to start');
  renderLeaderboard();
});

canvas.addEventListener('pointerdown', startGameIfReady);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    startGameIfReady();
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => settingsDialog.showModal());
document.getElementById('closeSettings').addEventListener('click', () => settingsDialog.close());
document.getElementById('soundToggle').addEventListener('change', (e) => (settings.sound = e.target.checked));
document.getElementById('animToggle').addEventListener('change', (e) => (settings.animations = e.target.checked));
document.getElementById('effectsToggle').addEventListener('change', (e) => (settings.effects = e.target.checked));
document.getElementById('themeSelect').addEventListener('change', (e) => {
  settings.theme = e.target.value;
  setTheme();
});

document.getElementById('leaderboardBtn').addEventListener('click', () => {
  renderLeaderboard();
  leaderboardView.classList.remove('hidden');
});
document.getElementById('closeLeaderboard').addEventListener('click', () => leaderboardView.classList.add('hidden'));

document.getElementById('adminBtn').addEventListener('click', () => adminDialog.showModal());
document.getElementById('closeAdmin').addEventListener('click', () => {
  adminDialog.close();
  adminGate.classList.remove('hidden');
  adminTools.classList.add('hidden');
});

document.getElementById('unlockAdmin').addEventListener('click', () => {
  if (document.getElementById('adminCode').value === '4514') {
    adminGate.classList.add('hidden');
    adminTools.classList.remove('hidden');
    adminLog.textContent = 'Admin unlocked.';
  } else {
    adminLog.textContent = 'Wrong code.';
  }
});

function adminUpdateCurrent(modifier) {
  if (!profile) return;
  const current = cloud.getProfiles()[profile.name] || { highScore: 0, gamesPlayed: 0 };
  const updated = modifier(current);
  cloud.upsertProfile(profile.name, updated);
  profile = { ...profile, ...cloud.getProfiles()[profile.name] };
  hudBest.textContent = profile.highScore;
  renderLeaderboard();
}

document.getElementById('adminResetCurrent').addEventListener('click', () => {
  adminUpdateCurrent((row) => ({ ...row, highScore: 0 }));
  adminLog.textContent = 'Current player score reset.';
});

document.getElementById('adminGiveFive').addEventListener('click', () => {
  adminUpdateCurrent((row) => ({ ...row, highScore: (row.highScore || 0) + 5 }));
  adminLog.textContent = 'Added +5 to current player high score.';
});

document.getElementById('adminAddScore').addEventListener('click', () => {
  const target = document.getElementById('adminTargetUser').value.trim();
  const delta = Number(document.getElementById('adminScoreDelta').value || 0);
  if (!target) return;
  const row = cloud.getProfiles()[target] || { highScore: 0, gamesPlayed: 0, device: 'unknown' };
  cloud.upsertProfile(target, { ...row, highScore: Math.max(0, row.highScore + delta) });
  adminLog.textContent = `Updated ${target} high score by ${delta}.`;
  renderLeaderboard();
});

document.getElementById('adminResetAll').addEventListener('click', () => {
  cloud.saveProfiles({});
  adminLog.textContent = 'All profiles reset.';
  renderLeaderboard();
});

setTheme();
setOverlay('Login above to begin');
update();
