// 부적 긁기: 캔버스 덮개를 문질러 지우면 아래 메시지가 드러남
export function createScratch(canvas, { onReveal }) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let w = 0, h = 0, dpr = 1;
  let drawing = false, last = null, moves = 0, revealed = false;

  function drawCover() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // 황지(노란 부적 종이)
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f4d771');
    g.addColorStop(1, '#e6bb45');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 종이 결
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(150,100,20,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 18 + 2, 1);
    }
    const red = '#b8281f';
    ctx.strokeStyle = red;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.fillStyle = red;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const serif = "'Gowun Batang', 'Noto Serif KR', serif";
    ctx.font = `700 ${w * 0.11}px ${serif}`;
    ctx.fillText('勅令', w / 2, h * 0.12);

    // 가운데 큰 글자 + 부적 선
    ctx.font = `700 ${w * 0.32}px ${serif}`;
    ctx.fillText('福', w / 2, h * 0.32);
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const cx = w / 2;
    ctx.moveTo(cx, h * 0.55);
    for (let i = 0; i < 6; i++) {
      const y = h * (0.57 + i * 0.045);
      ctx.quadraticCurveTo(cx + (i % 2 ? -1 : 1) * w * 0.22, y, cx, y + h * 0.022);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, h * 0.56);
    ctx.lineTo(cx + w * 0.22, h * 0.56);
    ctx.moveTo(cx - w * 0.16, h * 0.84);
    ctx.lineTo(cx + w * 0.16, h * 0.84);
    ctx.stroke();
    // 인장
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - w * 0.09, h * 0.865, w * 0.18, w * 0.18 * 0.62);
    ctx.font = `700 ${w * 0.065}px ${serif}`;
    ctx.fillText('大吉', cx, h * 0.865 + w * 0.056);

    // 안내 문구
    ctx.fillStyle = 'rgba(80,30,10,.75)';
    ctx.font = `700 ${Math.max(13, w * 0.05)}px 'Gowun Dodum', sans-serif`;
    ctx.fillText('여기를 문질러 보세요', cx, h * 0.495);

    revealed = false;
    moves = 0;
    canvas.classList.remove('gone');
    return true;
  }

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function scratchLine(a, b) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = Math.max(26, w * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function clearedRatio() {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] < 40) clear++;
    }
    return clear / total;
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    canvas.classList.add('gone');
    navigator.vibrate?.(30);
    onReveal?.();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (revealed) return;
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture?.(e.pointerId);
    scratchLine(last, { x: last.x + 0.1, y: last.y });
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing || revealed) return;
    const p = pos(e);
    scratchLine(last, p);
    last = p;
    if (++moves % 10 === 0 && clearedRatio() > 0.5) reveal();
  });
  const end = () => {
    if (drawing && !revealed && clearedRatio() > 0.5) reveal();
    drawing = false;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    reset: drawCover,
    showRevealed() { revealed = true; canvas.classList.add('gone'); },
    get revealed() { return revealed; },
  };
}
