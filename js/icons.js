// 문구류 아이콘 (SVG). 색은 인자로 받음
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

export const ICONS = {
  // 연필
  pencil: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-45 24 24)">
    <rect x="8" y="17" width="26" height="14" rx="2" fill="${c}"/>
    <rect x="8" y="17" width="26" height="4.6" fill="${shade(c, 30)}"/>
    <rect x="8" y="26.4" width="26" height="4.6" fill="${shade(c, -30)}"/>
    <rect x="3" y="17" width="6" height="14" rx="2" fill="#e79aa0"/><rect x="7.5" y="17" width="2.5" height="14" fill="#c9c2b5"/>
    <path d="M34 17 L44 24 L34 31 Z" fill="#f1d3a6"/><path d="M40.5 21.6 L44 24 L40.5 26.4 Z" fill="#3b2a1d"/></g></svg>`,
  // 지우개
  eraser: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-20 24 24)">
    <rect x="6" y="15" width="36" height="18" rx="5" fill="#fff" stroke="${shade(c, -40)}" stroke-width="1.5"/>
    <rect x="17" y="13.5" width="20" height="21" rx="2" fill="${c}"/>
    <rect x="17" y="13.5" width="20" height="5" fill="${shade(c, 25)}"/>
    <path d="M21 26h12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g></svg>`,
  // 포스트잇
  sticky: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M8 8h32v22L30 40H8z" fill="${c}"/>
    <path d="M40 30H30v10z" fill="${shade(c, -35)}"/>
    <path d="M14 17h20M14 23h16" stroke="${shade(c, -55)}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg>`,
  // 클립
  clip: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(30 24 24)">
    <path d="M19 33V13a6 6 0 0 1 12 0v22a9 9 0 0 1-18 0V17" fill="none" stroke="${shade(c, -45)}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M19 33V13a6 6 0 0 1 12 0v22a9 9 0 0 1-18 0V17" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/></g></svg>`,
  // 볼펜
  pen: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-45 24 24)">
    <rect x="6" y="19" width="28" height="10" rx="4" fill="${c}"/>
    <rect x="6" y="19" width="28" height="3.4" rx="1.7" fill="${shade(c, 35)}"/>
    <rect x="10" y="15.5" width="13" height="3.5" rx="1.5" fill="${shade(c, -35)}"/>
    <path d="M34 20.5 L42 24 L34 27.5 Z" fill="#d7d2c8"/><circle cx="42.3" cy="24" r="1.3" fill="#3b2a1d"/>
    <rect x="2.5" y="21" width="4" height="6" rx="1.5" fill="${shade(c, -35)}"/></g></svg>`,
  // 압정
  pin: (c) => `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 30 L24 44" stroke="#9aa0a6" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="24" cy="29" rx="13" ry="4" fill="${shade(c, -30)}"/>
    <path d="M17 12h14l-2 15H19z" fill="${c}"/>
    <ellipse cx="24" cy="11" rx="10" ry="4.5" fill="${shade(c, 25)}"/></svg>`,
};

export const NAMES = { pencil: '연필', eraser: '지우개', sticky: '포스트잇', clip: '클립', pen: '볼펜', pin: '압정' };
