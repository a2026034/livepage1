const targets = Array.from(document.querySelectorAll("h1, h5, p, li, th, td, .typing"))
  .filter(target => !target.querySelector("h1, h5, p, li, th, td"));
const characters = targets.flatMap(target =>
  Array.from(target.textContent, character => ({ target, character }))
);
targets.forEach(target => {
  target.textContent = "";
  target.classList.add("typing-target");
});

let visibleCount = 0;
let currentTarget = null;
const visibleCharacters = [];
let bootComplete = false;
let paragraphSoundBuffer = [];
let paragraphLoopTimer = null;
let beatLayerCount = 0;
let beatPhase = 0;
let generationCount = 0;
let allTextDisplayed = false;
let lifeDensity = 0;

const bootFrames = [
  ["[=]", "起動中"],
  ["[=/]", "起動中"],
  ["[=-]", "光を生成中"],
  ["[=\\]", "光を生成中"],
  ["[==|]", "天と海を生成中"],
  ["[==/]", "天と海を生成中"],
  ["[===-]", "陸を生成中"],
  ["[===\\]", "陸を生成中"],
  ["[===|]", "生命を生成中"],
  ["[===/]", "生命を生成中"],
  ["[===-]", "生命を生成中"],
  ["[====\\]", "太陽、月、星星を生成中"],
  ["[====|]", "太陽、月、星星を生成中"],
  ["[====/]", "太陽、月、星星を生成中"],
  ["[=====-]", "生命を生成中"],
  ["[=====\\]", "生命を生成中"],
  ["[=====|]", "生命を生成中"],
  ["[=====|]", "生命を生成中"],
  ["[=======]", "準備完了"] 
];

const bootScreen = document.getElementById("boot-screen");
const bootLines = document.getElementById("boot-lines");
let bootFrameIndex = 0;

function showBootFrame() {
  const [glyphText, statusText] = bootFrames[bootFrameIndex];
  const line = document.createElement("div");
  const glyph = document.createElement("span");
  const status = document.createElement("span");
  line.className = "boot-line";
  glyph.className = "boot-glyph";
  glyph.textContent = glyphText;
  status.className = "boot-status";
  if (statusText === "準備完了") status.classList.add("is-ready");
  status.textContent = ` ${statusText}`;
  line.append(glyph, status);
  bootLines.replaceChildren(line);
  bootFrameIndex++;

  if (bootFrameIndex < bootFrames.length) {
    window.setTimeout(showBootFrame, 130);
  } else {
    window.setTimeout(() => {
      bootScreen.classList.add("is-done");
      window.setTimeout(() => {
        bootScreen.remove();
        bootComplete = true;
      }, 300);
    }, 400);
  }
}

const bootSound = new Audio("sounds/Dial_up_modem_noises.ogg");
const bootAudioContext = new AudioContext();
const masterGain = bootAudioContext.createGain();
masterGain.gain.value = 0.7;
const bootAudioGain = bootAudioContext.createGain();
bootAudioGain.gain.value = 1.0;
const keyAudioGain = bootAudioContext.createGain();
keyAudioGain.gain.value = 0.5;
bootAudioContext.createMediaElementSource(bootSound).connect(bootAudioGain);
bootAudioGain.connect(masterGain);
keyAudioGain.connect(masterGain);
masterGain.connect(bootAudioContext.destination);

const keySoundProfiles = {
  " ": { type: "triangle", frequency: 180, endFrequency: 140, duration: 0.18, filter: 900 },
  p: { type: "sine", frequency: 500, endFrequency: 700, duration: 0.5, filter: 3000 },
  s: { type: "sawtooth", frequency: 4000, endFrequency: 620, duration: 0.3, filter: 3500 },
  t: { type: "triangle", frequency: 500, endFrequency: 500, duration: 0.15, filter: 1100 },
  c: { type: "square", frequency: 1000, endFrequency: 2600, duration: 0.1, filter: 4000 },
  l: { type: "triangle", frequency: 450, endFrequency: 3000, duration: 0.9999, filter: 9999 },
  d: { type: "sine", frequency: 500, endFrequency: 2200, duration: 0.16, filter: 5000 },
  j: { type: "sawtooth", frequency: 5000, endFrequency: 733, duration: 0.19, filter: 5000 },
  v: { type: "triangle", frequency: 993, endFrequency: 784, duration: 0.5, filter: 2100 },
  n: { type: "sine", frequency: 2000, endFrequency: 60, duration: 0.22, filter: 70000 },
  m: { type: "square", frequency: 262, endFrequency: 262, duration: 0.11, filter: 5000 }
};

function playKeySound(key) {
  const context = bootAudioContext;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const normalizedKey = key.toLowerCase();
  const profile = keySoundProfiles[normalizedKey];

  if (key === "Backspace") {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(760, start);
    oscillator.frequency.exponentialRampToValueAtTime(110, start + 0.13);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, start);
    filter.frequency.exponentialRampToValueAtTime(500, start + 0.13);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.75, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    oscillator.connect(filter).connect(gain).connect(keyAudioGain);
    oscillator.start(start);
    oscillator.stop(start + 0.15);
    return;
  }

  if (/^[0-9]$/.test(key)) {
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1500 + Number(key) * 35, start);
    filter.type = "highpass";
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.65, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.045);
    oscillator.connect(filter).connect(gain).connect(keyAudioGain);
    oscillator.start(start);
    oscillator.stop(start + 0.05);
    return;
  }

  const selectedProfile = profile || keySoundProfiles.t;
  oscillator.type = selectedProfile.type;
  oscillator.frequency.setValueAtTime(selectedProfile.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(selectedProfile.endFrequency, start + selectedProfile.duration);
  filter.type = "lowpass";
  filter.frequency.value = selectedProfile.filter;
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(0.55, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, start + selectedProfile.duration);
  oscillator.connect(filter).connect(gain).connect(keyAudioGain);
  oscillator.start(start);
  oscillator.stop(start + selectedProfile.duration + 0.01);
}

function getKeySoundDuration(key) {
  if (key === "Backspace") return 0.15;
  if (/^[0-9]$/.test(key)) return 0.05;
  const normalizedKey = key === " " ? " " : key.toLowerCase();
  const profile = keySoundProfiles[normalizedKey] || keySoundProfiles.t;
  return profile.duration + 0.02;
}

function recordParagraphSound(key, event) {
  if (!key) return;
  if (key === "Enter") return;
  if (event && (event.ctrlKey || event.metaKey || event.altKey)) return;
  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"].includes(key)) return;
  if (key.length !== 1 && key !== "Backspace") return;
  paragraphSoundBuffer.push(key);
}

function playParagraphLoop() {
  if (!paragraphSoundBuffer.length) return;

  const sequence = paragraphSoundBuffer.slice();
  const sequenceDuration = sequence.reduce((total, key) => total + getKeySoundDuration(key), 0);
  const loopPeriod = Math.max(sequenceDuration, 0.1);

  if (paragraphLoopTimer) {
    window.clearInterval(paragraphLoopTimer);
  }

  const scheduleSequence = () => {
    let elapsed = 0;
    sequence.forEach(key => {
      window.setTimeout(() => playKeySound(key), elapsed * 1000);
      elapsed += getKeySoundDuration(key);
    });
  };

  scheduleSequence();
  paragraphLoopTimer = window.setInterval(scheduleSequence, loopPeriod * 1000);
}

function refreshBeatLayer() {
  beatLayerCount = Math.min(Math.max(beatLayerCount, 1), 8);
  if (beatLayerCount > 0) {
    masterGain.gain.value = 0.18 + beatLayerCount * 0.04;
  }
}

function triggerBeatPulse() {
  if (!bootAudioContext) return;
  const now = bootAudioContext.currentTime;
  const densityFactor = Math.min(1, lifeDensity || 0);
  const baseFreq = 48 + densityFactor * 120 + beatLayerCount * 8;
  const osc = bootAudioContext.createOscillator();
  const gain = bootAudioContext.createGain();
  const filter = bootAudioContext.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(baseFreq, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300 + densityFactor * 1800 + beatLayerCount * 120, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12 + densityFactor * 0.1, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15 + beatLayerCount * 0.01);
  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.16 + beatLayerCount * 0.015);

  if ((beatPhase + 1) % 4 === 0) {
    const clickOsc = bootAudioContext.createOscillator();
    const clickGain = bootAudioContext.createGain();
    clickOsc.type = "square";
    clickOsc.frequency.setValueAtTime(1100 + densityFactor * 2200, now);
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    clickOsc.connect(clickGain).connect(masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }

  beatPhase = (beatPhase + 1) % 16;
}

function triggerCellSeed(x, y) {
  const now = bootAudioContext.currentTime;
  const osc = bootAudioContext.createOscillator();
  const gain = bootAudioContext.createGain();
  const filter = bootAudioContext.createBiquadFilter();
  const xNorm = x / Math.max(1, window.innerWidth / 12);
  const yNorm = 1 - y / Math.max(1, window.innerHeight / 12);
  const pitch = 200 + xNorm * 500 + yNorm * 300 + lifeDensity * 160;
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch, now);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600 + lifeDensity * 2600, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05 + lifeDensity * 0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.22);
}

let bootSoundStarted = false;
let bootSoundPending = false;

function playBootSound() {
  if (bootSoundStarted || bootSoundPending) return;
  bootSoundPending = true;
  Promise.all([bootAudioContext.resume(), bootSound.play()]).then(() => {
    bootSoundStarted = true;
    window.removeEventListener("pointerdown", playBootSound);
    window.removeEventListener("keydown", playBootSound);
  }).catch(() => {}).finally(() => {
    bootSoundPending = false;
  });
}

window.addEventListener("pointerdown", playBootSound);
window.addEventListener("keydown", playBootSound);
playBootSound();
showBootFrame();

function setCurrentTarget(target) {
  if (currentTarget) currentTarget.classList.remove("is-current");
  currentTarget = target;
  if (currentTarget) currentTarget.classList.add("is-current");
}

function appendNextCharacter() {
  if (visibleCount >= characters.length) return false;

  const nextCharacter = characters[visibleCount];
  const character = document.createElement("span");
  character.className = "typing-character";
  character.textContent = nextCharacter.character;
  nextCharacter.target.append(character);
  visibleCharacters.push(character);
  setCurrentTarget(nextCharacter.target);
  visibleCount++;
  if (visibleCount >= characters.length && !allTextDisplayed) {
    allTextDisplayed = true;
    playParagraphLoop();
  }
  return true;
}

setCurrentTarget(targets[0]);

window.addEventListener("keydown", event => {
  if (!bootComplete) return;

  if (event.key === "Enter") {
    event.preventDefault();
    playKeySound(event.key);
    beatLayerCount = Math.min(beatLayerCount + 1, 8);
    refreshBeatLayer();
    if (!currentTarget) return;

    const currentLine = currentTarget.closest("tr") || currentTarget;
    while (visibleCount < characters.length) {
      const nextLine = characters[visibleCount].target.closest("tr") || characters[visibleCount].target;
      if (nextLine !== currentLine) break;
      appendNextCharacter();
    }
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    recordParagraphSound(event.key, event);
    playKeySound(event.key);
    if (visibleCount > 0) {
      visibleCount--;
      visibleCharacters.pop().remove();
      setCurrentTarget(visibleCharacters.length
        ? visibleCharacters[visibleCharacters.length - 1].parentElement
        : targets[0]);
    }
    return;
  } else if (event.ctrlKey || event.metaKey || event.altKey || ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
  }

  recordParagraphSound(event.key, event);
  playKeySound(event.key === " " ? " " : event.key);
  appendNextCharacter();
});

(() => {
  const CELL = 12;
  const INTERVAL = 120;

  const canvas = document.getElementById('life-bg');
  const ctx = canvas.getContext('2d');
  let cols = 0, rows = 0, grid = new Uint8Array(0), next = new Uint8Array(0);
  let dirty = true, last = 0, prev = null;
  let pointerPressed = false, pointerDragging = false, shiftPressed = false;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nc = Math.ceil(w / CELL), nr = Math.ceil(h / CELL);
    const ng = new Uint8Array(nc * nr);
    for (let y = 0; y < Math.min(rows, nr); y++)
      for (let x = 0; x < Math.min(cols, nc); x++)
        ng[y * nc + x] = grid[y * cols + x];
    cols = nc; rows = nr; grid = ng; next = new Uint8Array(nc * nr);
    dirty = true;
  }

  function step() {
    for (let y = 0; y < rows; y++) {
      const yu = ((y - 1 + rows) % rows) * cols, yc = y * cols, yd = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const xl = (x - 1 + cols) % cols, xr = (x + 1) % cols;
        const n = grid[yu + xl] + grid[yu + x] + grid[yu + xr]
                + grid[yc + xl] + grid[yc + xr]
                + grid[yd + xl] + grid[yd + x] + grid[yd + xr];
        next[yc + x] = (n === 3 || (n === 2 && grid[yc + x])) ? 1 : 0;
      }
    }
    [grid, next] = [next, grid];
    let living = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i]) living++;
    lifeDensity = living / Math.max(1, grid.length);
    generationCount++;
    if (generationCount % 2 === 0) {
      triggerBeatPulse();
    }
    dirty = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pointerDragging || shiftPressed) {
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const alive = grid[y * cols + x];
          ctx.fillStyle = alive ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(alive ? '1' : '0', x * CELL + CELL / 2, y * CELL + CELL / 2);
        }
      }
    } else {
      ctx.fillStyle = 'rgba(67, 59, 59, 0.4)';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y * cols + x]) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }
    dirty = false;
  }

  function paint(cx, cy) {
    let x0 = prev ? prev[0] : cx, y0 = prev ? prev[1] : cy;
    const dx = Math.abs(cx - x0), dy = -Math.abs(cy - y0);
    const sx = x0 < cx ? 1 : -1, sy = y0 < cy ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) {
        const idx = y0 * cols + x0;
        if (!grid[idx]) {
          grid[idx] = 1;
          triggerCellSeed(x0 * CELL, y0 * CELL);
        }
      }
      if (x0 === cx && y0 === cy) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    prev = [cx, cy];
    dirty = true;
  }

  window.addEventListener('pointermove', e => {
    if (pointerPressed) { pointerDragging = true; dirty = true; }
    paint(Math.floor(e.clientX / CELL), Math.floor(e.clientY / CELL));
  });
  window.addEventListener('pointerleave', () => { prev = null; });
  window.addEventListener('pointerdown', () => { prev = null; pointerPressed = true; pointerDragging = false; dirty = true; });
  window.addEventListener('pointerup', () => { pointerPressed = false; pointerDragging = false; dirty = true; });
  window.addEventListener('pointercancel', () => { pointerPressed = false; pointerDragging = false; dirty = true; });
  window.addEventListener('keydown', e => {
    if (e.key === 'Shift') { shiftPressed = true; dirty = true; }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'Shift') { shiftPressed = false; dirty = true; }
  });
  window.addEventListener('blur', () => { pointerPressed = false; pointerDragging = false; shiftPressed = false; dirty = true; });
  window.addEventListener('resize', resize);

  function loop(t) {
    if (!document.hidden && t - last >= INTERVAL) { last = t; step(); }
    if (dirty) draw();
    requestAnimationFrame(loop);
  }

  resize();
  requestAnimationFrame(loop);
})();