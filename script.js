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

const bootFrames = [
  ["[===]", "起動中"],
  ["[==/]", "起動中"],
  ["[==-]", "光を生成中"],
  ["[==\\]", "光を生成中"],
  ["[==|]", "天を生成中"],
  ["[==/]", "天を生成中"],
  ["[==-]", "陸を生成中"],
  ["[==\\]", "陸を生成中"],
  ["[==|]", "生命を生成中"],
  ["[====/]", "生命を生成中"],
  ["[====-]", "生命を生成中"],
  ["[====\\]", "太陽、月、星星を生成中"],
  ["[====|]", "太陽、月、星星を生成中"],
  ["[======/]", "太陽、月、星星を生成中"],
  ["[======-]", "生命を生成中"],
  ["[======\\]", "生命を生成中"],
  ["[======|]", "生命を生成中"],
  ["[===========]", "準備完了"]
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
  return true;
}

setCurrentTarget(targets[0]);

window.addEventListener("keydown", event => {
  if (!bootComplete) return;
  if (event.key === "Enter") {
    event.preventDefault();
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

  appendNextCharacter();
});

(() => {
  const CELL = 12;
  const INTERVAL = 120;

  const canvas = document.getElementById('life-bg');
  const ctx = canvas.getContext('2d');
  let cols = 0, rows = 0, grid = new Uint8Array(0), next = new Uint8Array(0);
  let dirty = true, last = 0, prev = null;

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
    dirty = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (grid[y * cols + x]) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    dirty = false;
  }

  function paint(cx, cy) {
    let x0 = prev ? prev[0] : cx, y0 = prev ? prev[1] : cy;
    const dx = Math.abs(cx - x0), dy = -Math.abs(cy - y0);
    const sx = x0 < cx ? 1 : -1, sy = y0 < cy ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) grid[y0 * cols + x0] = 1;
      if (x0 === cx && y0 === cy) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    prev = [cx, cy];
    dirty = true;
  }

  window.addEventListener('pointermove', e => paint(Math.floor(e.clientX / CELL), Math.floor(e.clientY / CELL)));
  window.addEventListener('pointerleave', () => { prev = null; });
  window.addEventListener('pointerdown', () => { prev = null; });
  window.addEventListener('resize', resize);

  function loop(t) {
    if (!document.hidden && t - last >= INTERVAL) { last = t; step(); }
    if (dirty) draw();
    requestAnimationFrame(loop);
  }

  resize();
  requestAnimationFrame(loop);
})();