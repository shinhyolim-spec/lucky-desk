// 문구류 블록 3개 맞추기 (시간 제한 없음)
import { ICONS } from './icons.js?v=5';

const N = 8;
export const ROUND_MS = 3 * 60 * 1000; // 한 판 3분
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

export function createMatch3(board, { types, luckyIndex, storage, onChange, toast, onTime, onEnd }) {
  let grid = []; // grid[r][c] = { t, el }
  let busy = false;
  let selected = null;
  let state = { score: 0, lucky: 0, best: storage.load().best || 0 };
  let hintTimer = null;

  // ── 타이머: 첫 이동에 시작, 화면을 떠나면 일시정지 ──
  let remaining = ROUND_MS;
  let started = false, paused = false, timeUp = false, ended = false;
  let ticker = null, lastTick = 0;
  function tick() {
    const now = performance.now();
    remaining = Math.max(0, remaining - (now - lastTick));
    lastTick = now;
    onTime?.(remaining, { started, paused });
    if (remaining <= 0) {
      stopTicker();
      timeUp = true;
      if (!busy) finish();
    }
  }
  function startTicker() {
    stopTicker();
    lastTick = performance.now();
    ticker = setInterval(tick, 200);
  }
  function stopTicker() { clearInterval(ticker); ticker = null; }
  function finish() {
    if (ended) return;
    ended = true;
    clearSel();
    clearHint();
    const newBest = state.score > 0 && state.score >= state.best;
    onEnd?.({ score: state.score, lucky: state.lucky, best: state.best, newBest });
  }

  const isLucky = (t) => t === luckyIndex;

  function makeTile(t, r, c, fromRow = r) {
    const el = document.createElement('div');
    el.className = 'tile' + (isLucky(t) ? ' is-lucky' : '');
    el.innerHTML = `<div class="face">${ICONS[types[t].key](types[t].color)}</div>`;
    el.setAttribute('role', 'gridcell');
    el.setAttribute('aria-label', types[t].label);
    el.style.setProperty('--c', c);
    el.style.setProperty('--r', fromRow);
    board.appendChild(el);
    return { t, el };
  }
  const place = (tile, r, c) => {
    tile.el.style.setProperty('--r', r);
    tile.el.style.setProperty('--c', c);
  };
  const randType = () => Math.floor(Math.random() * types.length);

  function typeAt(g, r, c) {
    return r >= 0 && r < N && c >= 0 && c < N && g[r][c] ? g[r][c].t : -1;
  }

  function build() {
    board.innerHTML = '';
    let tries = 0;
    do {
      const tg = [];
      for (let r = 0; r < N; r++) {
        tg.push([]);
        for (let c = 0; c < N; c++) {
          let t;
          do {
            t = randType();
          } while (
            (c >= 2 && tg[r][c - 1] === t && tg[r][c - 2] === t) ||
            (r >= 2 && tg[r - 1][c] === t && tg[r - 2][c] === t)
          );
          tg[r].push(t);
        }
      }
      grid = tg.map((row) => row.map((t) => ({ t })));
      tries++;
    } while (!findMove() && tries < 50);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      grid[r][c] = makeTile(grid[r][c].t, r, c);
    }
  }

  // 가로·세로 3개 이상
  function findMatches(g = grid) {
    const cells = new Set();
    const runs = [];
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        const t = typeAt(g, r, c);
        let e = c + 1;
        while (e < N && typeAt(g, r, e) === t) e++;
        if (t >= 0 && e - c >= 3) {
          runs.push({ t, len: e - c });
          for (let k = c; k < e; k++) cells.add(r * N + k);
        }
        c = e;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        const t = typeAt(g, r, c);
        let e = r + 1;
        while (e < N && typeAt(g, e, c) === t) e++;
        if (t >= 0 && e - r >= 3) {
          runs.push({ t, len: e - r });
          for (let k = r; k < e; k++) cells.add(k * N + c);
        }
        r = e;
      }
    }
    return { cells, runs };
  }

  function findMove() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= N || c2 >= N) continue;
        [grid[r][c], grid[r2][c2]] = [grid[r2][c2], grid[r][c]];
        const ok = findMatches().cells.size > 0;
        [grid[r][c], grid[r2][c2]] = [grid[r2][c2], grid[r][c]];
        if (ok) return [[r, c], [r2, c2]];
      }
    }
    return null;
  }

  function addScore(n, luckyCount) {
    state.score += n;
    state.lucky += luckyCount;
    if (state.score > state.best) state.best = state.score;
    storage.save({ best: state.best });
    onChange(state);
  }

  async function resolve() {
    let combo = 1;
    for (;;) {
      const { cells, runs } = findMatches();
      if (!cells.size) break;
      const mult = 1 + (combo - 1) * 0.5;
      let base = 0;
      for (const run of runs) base += run.len >= 5 ? 100 : run.len === 4 ? 60 : 30;
      let luckyCount = 0;
      cells.forEach((i) => { if (isLucky(grid[Math.floor(i / N)][i % N].t)) luckyCount++; });
      const bonus = luckyCount * 15;
      const gained = Math.round((base + bonus) * mult);
      addScore(gained, luckyCount);
      const parts = [`+${gained}`];
      if (luckyCount) parts.push(`행운 보너스 +${Math.round(bonus * mult)}`);
      if (combo > 1) parts.push(`${combo}연쇄!`);
      toast(parts.join(' · '));

      cells.forEach((i) => grid[Math.floor(i / N)][i % N].el.classList.add('pop'));
      await wait(200);
      cells.forEach((i) => {
        const r = Math.floor(i / N), c = i % N;
        grid[r][c].el.remove();
        grid[r][c] = null;
      });

      // 중력 + 새 블록
      for (let c = 0; c < N; c++) {
        let write = N - 1;
        for (let r = N - 1; r >= 0; r--) {
          if (grid[r][c]) {
            if (write !== r) {
              grid[write][c] = grid[r][c];
              grid[r][c] = null;
              place(grid[write][c], write, c);
            }
            write--;
          }
        }
        const missing = write + 1;
        for (let r = write; r >= 0; r--) {
          grid[r][c] = makeTile(randType(), r, c, r - missing);
        }
      }
      // 새 블록이 위에서 떨어지도록 한 프레임 뒤 목표 위치 지정
      board.getBoundingClientRect();
      await new Promise(requestAnimationFrame);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) place(grid[r][c], r, c);
      await wait(260);
      combo++;
    }
    if (!findMove()) {
      toast('맞출 블록이 없어 책상을 정리할게요');
      await wait(700);
      shuffle();
    }
  }

  function shuffle() {
    let tries = 0;
    do {
      const flat = grid.flat();
      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = flat[r * N + c];
      tries++;
    } while ((findMatches().cells.size || !findMove()) && tries < 200);
    if (tries >= 200) { build(); return; }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) place(grid[r][c], r, c);
  }

  async function swap(a, b) {
    if (busy || timeUp || ended) return;
    if (!started) { started = true; startTicker(); }
    busy = true;
    clearSel();
    clearHint();
    const [r1, c1] = a, [r2, c2] = b;
    [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    place(grid[r1][c1], r1, c1);
    place(grid[r2][c2], r2, c2);
    await wait(200);
    if (!findMatches().cells.size) {
      [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
      place(grid[r1][c1], r1, c1);
      place(grid[r2][c2], r2, c2);
      board.classList.add('shake');
      await wait(300);
      board.classList.remove('shake');
    } else {
      await resolve();
    }
    busy = false;
    if (timeUp) finish(); // 시간이 끝나는 순간 진행 중이던 연쇄는 점수에 포함
  }

  function clearSel() {
    if (selected) grid[selected[0]][selected[1]]?.el.classList.remove('sel');
    selected = null;
  }
  function clearHint() {
    clearTimeout(hintTimer);
    board.querySelectorAll('.hint').forEach((e) => e.classList.remove('hint'));
  }

  // ── 입력: 탭-탭 또는 스와이프 ──
  let start = null;
  const cellFrom = (e) => {
    const rect = board.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * N);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * N);
    return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null;
  };
  board.addEventListener('pointerdown', (e) => {
    if (busy || timeUp || ended) return;
    const cell = cellFrom(e);
    if (!cell) return;
    start = { cell, x: e.clientX, y: e.clientY, moved: false };
    board.setPointerCapture?.(e.pointerId);
  });
  board.addEventListener('pointermove', (e) => {
    if (!start || start.moved || busy) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    const th = board.getBoundingClientRect().width / N * 0.35;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    start.moved = true;
    const [r, c] = start.cell;
    const t = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    if (t[0] >= 0 && t[0] < N && t[1] >= 0 && t[1] < N) swap(start.cell, t);
  });
  board.addEventListener('pointerup', () => {
    if (!start || busy) { start = null; return; }
    if (!start.moved) {
      const [r, c] = start.cell;
      if (selected && Math.abs(selected[0] - r) + Math.abs(selected[1] - c) === 1) {
        swap(selected, [r, c]);
      } else if (selected && selected[0] === r && selected[1] === c) {
        clearSel();
      } else {
        clearSel();
        selected = [r, c];
        grid[r][c].el.classList.add('sel');
      }
    }
    start = null;
  });
  board.addEventListener('pointercancel', () => { start = null; });

  build();
  onChange(state);
  onTime?.(remaining, { started, paused });

  return {
    destroy() { stopTicker(); },
    pause() {
      if (!started || paused || ended || timeUp) return;
      tick();
      stopTicker();
      paused = true;
    },
    resume() {
      if (!paused) return;
      paused = false;
      startTicker();
    },
    hint() {
      if (busy || ended || timeUp) return;
      clearHint();
      const m = findMove();
      if (!m) return;
      for (const [r, c] of m) grid[r][c].el.classList.add('hint');
      hintTimer = setTimeout(clearHint, 1600);
    },
    restart() {
      if (busy) return;
      stopTicker();
      remaining = ROUND_MS;
      started = paused = timeUp = ended = false;
      state = { ...state, score: 0, lucky: 0 };
      onChange(state);
      onTime?.(remaining, { started, paused });
      clearSel();
      clearHint();
      build();
    },
  };
}
