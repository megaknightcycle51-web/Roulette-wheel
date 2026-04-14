/* ════════════════════════════════════════════════
   SPIN & LISTEN — script.js
   ════════════════════════════════════════════════ */

/* ─── STATE ──────────────────────────────────────── */
let sections = [
  { text: 'Section 1', weight: 2, color: '#f0c040' },
  { text: 'Section 2', weight: 1, color: '#ff5c5c' },
  { text: 'Section 3', weight: 3, color: '#5cf0a0' },
  { text: 'Section 4', weight: 1, color: '#5cb8ff' },
  { text: 'Section 5', weight: 2, color: '#d05cff' },
];

let spinning     = false;
let currentAngle = 0;

/* ─── ELEMENTS ───────────────────────────────────── */
const canvas        = document.getElementById('wheelCanvas');
const ctx           = canvas.getContext('2d');
const spinBtn       = document.getElementById('spinBtn');
const resultText    = document.getElementById('resultText');
const sectionsList  = document.getElementById('sectionsList');
const addSectionBtn = document.getElementById('addSectionBtn');
const confettiCanvas = document.getElementById('confettiCanvas');
const cctx           = confettiCanvas.getContext('2d');

/* ══════════════════════════════════════════════════
   ★  ADD YOUR TRACKS HERE  ★
   Each object needs:
     src    — path to your audio file, e.g. "music/song.mp3"
     title  — display name
     artist — artist / album (optional, leave "" if none)
   Example:
     { src: "music/song.mp3", title: "Song Name", artist: "Artist" },
══════════════════════════════════════════════════ */
const TRACKS = [
  { src: "music/track1.mp3", title: "Track One",   artist: "Artist A" },
  { src: "music/track2.mp3", title: "Track Two",   artist: "Artist B" },
  { src: "music/track3.mp3", title: "Track Three", artist: "Artist C" },
];

/* ══════════════════════════════════════════════════
   MUSIC PLAYER
══════════════════════════════════════════════════ */
const audio         = document.getElementById('audioPlayer');
const playBtn       = document.getElementById('playBtn');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const trackTitle    = document.getElementById('trackTitle');
const trackArtist   = document.getElementById('trackArtist');
const progressBar   = document.getElementById('progressBar');
const progressFill  = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const timeElapsed   = document.getElementById('timeElapsed');
const timeDuration  = document.getElementById('timeDuration');
const volumeSlider  = document.getElementById('volumeSlider');
const playlistEl    = document.getElementById('playlist');
const trackCount    = document.getElementById('trackCount');
const albumArt      = document.getElementById('albumArt');

let currentTrack = 0;
let isPlaying    = false;

function formatTime(s) {
  if (isNaN(s) || s === Infinity) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function loadTrack(idx, autoplay = false) {
  if (!TRACKS.length) return;
  currentTrack = idx;
  const t = TRACKS[idx];
  audio.src = t.src;
  trackTitle.textContent  = t.title  || 'Unknown';
  trackArtist.textContent = t.artist || '—';
  progressFill.style.width  = '0%';
  progressThumb.style.left  = '0%';
  timeElapsed.textContent   = '0:00';
  timeDuration.textContent  = '0:00';
  renderPlaylist();
  if (autoplay) playAudio();
}

function playAudio() {
  audio.play().catch(() => {});
  isPlaying = true;
  playBtn.textContent = '⏸';
  albumArt.classList.add('playing');
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = '▶';
  albumArt.classList.remove('playing');
}

playBtn.addEventListener('click', () => {
  if (!TRACKS.length) return;
  if (!audio.src || audio.src === window.location.href) { loadTrack(0, true); return; }
  isPlaying ? pauseAudio() : playAudio();
});

prevBtn.addEventListener('click', () => {
  if (!TRACKS.length) return;
  loadTrack((currentTrack - 1 + TRACKS.length) % TRACKS.length, isPlaying);
});

nextBtn.addEventListener('click', () => {
  if (!TRACKS.length) return;
  loadTrack((currentTrack + 1) % TRACKS.length, isPlaying);
});

audio.addEventListener('ended', () => {
  loadTrack((currentTrack + 1) % TRACKS.length, true);
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width  = pct + '%';
  progressThumb.style.left  = pct + '%';
  timeElapsed.textContent   = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeDuration.textContent = formatTime(audio.duration);
});

/* Click to seek */
progressBar.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

/* Volume */
audio.volume = +volumeSlider.value;
volumeSlider.addEventListener('input', () => {
  audio.volume = +volumeSlider.value;
});

/* Playlist render */
function renderPlaylist() {
  playlistEl.innerHTML = '';
  trackCount.textContent = `${TRACKS.length} track${TRACKS.length !== 1 ? 's' : ''}`;

  TRACKS.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'playlist-row' + (i === currentTrack ? ' active' : '');

    row.innerHTML = `
      <span class="pl-num">${i + 1}</span>
      <div class="pl-info">
        <div class="pl-title">${t.title || 'Unknown'}</div>
        <div class="pl-artist">${t.artist || '—'}</div>
      </div>
    `;
    row.addEventListener('click', () => loadTrack(i, true));
    playlistEl.appendChild(row);
  });
}

/* Init player */
renderPlaylist();
if (TRACKS.length) loadTrack(0, false);

/* ══════════════════════════════════════════════════
   WHEEL DRAWING
══════════════════════════════════════════════════ */
function totalWeight() {
  return sections.reduce((s, sec) => s + Math.max(+sec.weight || 1, 0.01), 0);
}

function drawWheel(rotationOffset = 0) {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R  = Math.min(cx, cy) - 8;

  ctx.clearRect(0, 0, W, H);

  if (!sections.length) {
    ctx.fillStyle = '#2a2a35';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a6a80';
    ctx.font = '18px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Add sections below', cx, cy);
    return;
  }

  const total = totalWeight();
  let startAngle = rotationOffset - Math.PI / 2; // pointer at top

  sections.forEach((sec, i) => {
    const w       = Math.max(+sec.weight || 1, 0.01);
    const slice   = (w / total) * Math.PI * 2;
    const endAngle = startAngle + slice;

    /* Slice fill */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = sec.color || '#888';
    ctx.fill();

    /* Stroke */
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Text */
    const midAngle = startAngle + slice / 2;
    const textR    = R * 0.63;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(midAngle + Math.PI / 2);

    const maxWidth = Math.max(R * (slice / Math.PI) * 1.1, 40);
    const fontSize = Math.min(18, Math.max(10, maxWidth * 0.28));
    ctx.font = `600 ${fontSize}px 'DM Sans', sans-serif`;
    ctx.fillStyle = getContrastColor(sec.color || '#888');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = truncate(sec.text || `Section ${i+1}`, 18);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur  = 4;
    ctx.fillText(label, 0, 0);
    ctx.restore();

    startAngle = endAngle;
  });

  /* Outer ring */
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(240,192,64,0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const lum = 0.299*r + 0.587*g + 0.114*b;
  return lum > 148 ? '#111' : '#fff';
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/* ══════════════════════════════════════════════════
   SPIN LOGIC
══════════════════════════════════════════════════ */
function pickWinner() {
  const total = totalWeight();
  let r = Math.random() * total;
  for (let i = 0; i < sections.length; i++) {
    r -= Math.max(+sections[i].weight || 1, 0.01);
    if (r <= 0) return i;
  }
  return sections.length - 1;
}

spinBtn.addEventListener('click', () => {
  if (spinning || sections.length < 2) return;

  spinning = true;
  spinBtn.disabled = true;
  resultText.textContent = '…';

  /* Pick winner upfront */
  const winnerIdx = pickWinner();

  /* Calculate where winner section's midpoint sits in angle space */
  const total = totalWeight();
  let accum = 0;
  for (let i = 0; i < winnerIdx; i++) {
    accum += Math.max(+sections[i].weight || 1, 0.01);
  }
  const winnerW   = Math.max(+sections[winnerIdx].weight || 1, 0.01);
  const winnerMid = accum + winnerW / 2;

  /* The pointer is at the top (angle = -π/2 in canvas terms).
     We need that angle to land at 0 in our offset system.
     Our drawWheel starts slices at (rotationOffset - π/2).
     So the winner midAngle in the wheel = (winnerMid/total) * 2π
     We want: rotationOffset - π/2 + (winnerMid/total)*2π + k*2π = -π/2 + 2π (one full spin top)
     => rotationOffset = 2πk - (winnerMid/total)*2π
  */
  const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
  const winnerAngle = (winnerMid / total) * Math.PI * 2;
  const targetAngle = extraSpins * Math.PI * 2 - winnerAngle;

  const startAngle = currentAngle;
  const totalTravel = targetAngle - (startAngle % (Math.PI * 2)) + Math.ceil(extraSpins) * Math.PI * 2;

  const duration = 4500 + Math.random() * 1000; // 4.5–5.5 s
  const startTime = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOut(progress);

    currentAngle = startAngle + totalTravel * eased;
    drawWheel(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentAngle = currentAngle % (Math.PI * 2);
      spinning = false;
      spinBtn.disabled = false;
      resultText.textContent = sections[winnerIdx].text || `Section ${winnerIdx+1}`;
      launchConfetti(sections[winnerIdx].color);
    }
  }

  requestAnimationFrame(animate);
});

/* ══════════════════════════════════════════════════
   SECTION EDITOR
══════════════════════════════════════════════════ */
const PALETTE = [
  '#f0c040','#ff5c5c','#5cf0a0','#5cb8ff','#d05cff',
  '#ff9640','#40e0d0','#ff69b4','#a8ff3e','#ffec5c'
];

function renderSections() {
  sectionsList.innerHTML = '';
  sections.forEach((sec, i) => {
    const row = document.createElement('div');
    row.className = 'section-row';

    /* Color picker */
    const colorEl = document.createElement('input');
    colorEl.type  = 'color';
    colorEl.value = sec.color || '#888888';
    colorEl.className = 'color-swatch';
    colorEl.addEventListener('input', () => {
      sections[i].color = colorEl.value;
      drawWheel(currentAngle);
    });

    /* Text */
    const textEl = document.createElement('input');
    textEl.type  = 'text';
    textEl.className = 'section-text-input';
    textEl.value = sec.text;
    textEl.placeholder = `Section ${i+1}`;
    textEl.addEventListener('input', () => {
      sections[i].text = textEl.value;
      drawWheel(currentAngle);
    });

    /* Weight */
    const weightEl = document.createElement('input');
    weightEl.type  = 'number';
    weightEl.className = 'section-weight-input';
    weightEl.value = sec.weight;
    weightEl.min   = '0.1';
    weightEl.step  = '0.5';
    weightEl.title = 'Weight (higher = more likely)';
    weightEl.addEventListener('input', () => {
      sections[i].weight = Math.max(+weightEl.value || 0.1, 0.01);
      drawWheel(currentAngle);
    });

    /* Remove */
    const removeEl = document.createElement('button');
    removeEl.className = 'remove-btn';
    removeEl.innerHTML = '×';
    removeEl.title = 'Remove';
    removeEl.addEventListener('click', () => {
      sections.splice(i, 1);
      renderSections();
      drawWheel(currentAngle);
    });

    row.append(colorEl, textEl, weightEl, removeEl);
    sectionsList.appendChild(row);
  });

  spinBtn.disabled = sections.length < 2;
}

addSectionBtn.addEventListener('click', () => {
  const color = PALETTE[sections.length % PALETTE.length];
  sections.push({ text: `Section ${sections.length + 1}`, weight: 1, color });
  renderSections();
  drawWheel(currentAngle);
  sectionsList.scrollTop = sectionsList.scrollHeight;
});

/* ══════════════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════════════ */
let particles = [];
let confettiRunning = false;

function resizeConfetti() {
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function launchConfetti(baseColor) {
  const colors = [baseColor, '#f0c040', '#ff5c5c', '#5cf0a0', '#5cb8ff', '#d05cff', '#ffffff'];
  particles = [];

  for (let i = 0; i < 180; i++) {
    particles.push({
      x:   Math.random() * confettiCanvas.width,
      y:   -10 - Math.random() * 150,
      vx:  (Math.random() - 0.5) * 5,
      vy:  2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vr:  (Math.random() - 0.5) * 0.2,
      w:   6 + Math.random() * 8,
      h:   10 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  if (!confettiRunning) {
    confettiRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  particles = particles.filter(p => p.opacity > 0.01);

  particles.forEach(p => {
    p.x  += p.vx;
    p.y  += p.vy;
    p.rot += p.vr;
    p.vy += 0.07; // gravity
    if (p.y > confettiCanvas.height * 0.7) p.opacity -= 0.025;

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.globalAlpha = Math.max(p.opacity, 0);
    cctx.fillStyle = p.color;

    if (p.shape === 'circle') {
      cctx.beginPath();
      cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      cctx.fill();
    } else {
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }

    cctx.restore();
  });

  if (particles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

/* ─── INIT ───────────────────────────────────────── */
renderSections();
drawWheel(0);

