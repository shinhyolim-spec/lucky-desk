// 만세력 계산 (양력 기준)
// - 일주: 율리우스 적일(JDN) 기반 60갑자 순환. (JDN + 49) % 60, 甲子 = 0
// - 년주·월주: 태양 황경(절기) 기준. 입춘(315°)에 해가 바뀌고, 절입 시각에 달이 바뀜
// - 시주: 한국 표준시(UTC+9)와 실제 태양시 차이를 감안해 30분 보정 (자시 23:30~01:30)

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

// 오행: 0 목, 1 화, 2 토, 3 금, 4 수
export const ELEMENTS = ['목', '화', '토', '금', '수'];
export const ELEMENTS_HANJA = ['木', '火', '土', '金', '水'];
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
// 지지 본기(정기) 천간
export const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];

export const stemElement = (s) => Math.floor(s / 2);
export const isYang = (s) => s % 2 === 0;

export function pillar(stem, branch) {
  return {
    stem,
    branch,
    name: STEMS[stem] + BRANCHES[branch],
    hanja: STEMS_HANJA[stem] + BRANCHES_HANJA[branch],
  };
}

// 양력 날짜(현지 달력 기준) → JDN
export function jdn(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000) + 2440588;
}

export function dayPillar(y, m, d) {
  const idx = (((jdn(y, m, d) + 49) % 60) + 60) % 60;
  return pillar(idx % 10, idx % 12);
}

// 태양의 겉보기 황경 (Meeus 저정밀식, 오차 약 0.01°)
export function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * rad;
  const lon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lon % 360) + 360) % 360;
}

// 한국 시각(KST) → 율리우스일
export function jdFromKST(y, m, d, hh = 12, mm = 0) {
  const ms = Date.UTC(y, m - 1, d, hh - 9, mm);
  return ms / 86400000 + 2440587.5;
}

// 절기 기준 월 번호: 0 = 인월(입춘~경칩), 11 = 축월(소한~입춘)
export function solarMonthIndex(jd) {
  const lon = sunLongitude(jd);
  return Math.floor((((lon - 315) % 360) + 360) % 360 / 30);
}

export function yearPillarAt(y, m, monthIdx) {
  // 1~2월인데 아직 자월/축월이면 입춘 전 → 전년도
  const sajuYear = m <= 2 && monthIdx >= 10 ? y - 1 : y;
  const s = (((sajuYear - 4) % 10) + 10) % 10;
  const b = (((sajuYear - 4) % 12) + 12) % 12;
  return { ...pillar(s, b), year: sajuYear };
}

export function monthPillarAt(yearStem, monthIdx) {
  const s = ((yearStem % 5) * 2 + 2 + monthIdx) % 10;
  const b = (monthIdx + 2) % 12;
  return pillar(s, b);
}

export function addDays(y, m, d, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

// 시지: 보정 후 시각으로 계산. 23:30 이후는 다음 날 자시로 봄
export function hourBranchOf(hh, mm) {
  const t = hh * 60 + mm - 30; // 태양시 보정
  const tt = ((t % 1440) + 1440) % 1440;
  return Math.floor((tt + 60) / 120) % 12;
}

export function hourPillar(dayStem, hourBranch) {
  return pillar(((dayStem % 5) * 2 + hourBranch) % 10, hourBranch);
}

/**
 * 사주 원국 계산
 * @param {{y:number,m:number,d:number,hh?:number|null,mm?:number|null}} b 양력 생년월일시(KST)
 */
export function computeSaju(b) {
  const hasTime = b.hh !== null && b.hh !== undefined && !Number.isNaN(b.hh);
  const hh = hasTime ? b.hh : 12;
  const mm = hasTime ? b.mm || 0 : 0;
  const jd = jdFromKST(b.y, b.m, b.d, hh, mm);
  const mIdx = solarMonthIndex(jd);
  const year = yearPillarAt(b.y, b.m, mIdx);
  const month = monthPillarAt(year.stem, mIdx);

  // 23:30 이후 출생은 일주를 다음 날로 (자시 시작)
  let [dy, dm, dd] = [b.y, b.m, b.d];
  if (hasTime && hh * 60 + mm >= 23 * 60 + 30) [dy, dm, dd] = addDays(b.y, b.m, b.d, 1);
  const day = dayPillar(dy, dm, dd);
  const hour = hasTime ? hourPillar(day.stem, hourBranchOf(hh, mm)) : null;

  return { year, month, day, hour, hasTime };
}

// ── 관계 ───────────────────────────────────────────────
export const TEN_GODS = {
  same: ['비견', '겁재'],
  output: ['식신', '상관'],
  wealth: ['편재', '정재'],
  officer: ['편관', '정관'],
  resource: ['편인', '정인'],
};
const CATS = ['same', 'output', 'wealth', 'officer', 'resource'];

// 내 일간(me) 기준으로 상대 천간(other)의 십신
export function tenGod(me, other) {
  const d = (stemElement(other) - stemElement(me) + 5) % 5;
  const cat = CATS[d];
  const samePolarity = isYang(me) === isYang(other);
  return { cat, name: TEN_GODS[cat][samePolarity ? 0 : 1] };
}

const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const STEM_COMBINE = { '0-5': 2, '1-6': 3, '2-7': 4, '3-8': 0, '4-9': 1 }; // 합화 오행
const STEM_CLASH = new Set(['0-6', '1-7', '2-8', '3-9']);
const BRANCH_COMBINE = { '0-1': 2, '2-11': 0, '3-10': 1, '4-9': 3, '5-8': 4, '6-7': 1 };
const BRANCH_HARM = new Set(['0-7', '1-6', '2-5', '3-4', '8-11', '9-10']);
const BRANCH_BREAK = new Set(['0-9', '3-6', '1-4', '7-10', '2-11', '5-8']);
const TRIADS = [
  [8, 0, 4, 4], // 신자진 수국
  [2, 6, 10, 1], // 인오술 화국
  [5, 9, 1, 3], // 사유축 금국
  [11, 3, 7, 0], // 해묘미 목국
];
const PUNISH = [
  new Set([2, 5, 8]), // 인사신 (무은지형)
  new Set([1, 10, 7]), // 축술미 (지세지형)
];

export function stemRelation(a, b) {
  const k = pairKey(a, b);
  if (k in STEM_COMBINE) return { type: '합', element: STEM_COMBINE[k] };
  if (STEM_CLASH.has(k)) return { type: '충' };
  return null;
}

export function branchRelations(a, b) {
  const out = [];
  const k = pairKey(a, b);
  if (Math.abs(a - b) === 6) out.push({ type: '충' });
  if (k in BRANCH_COMBINE) out.push({ type: '육합', element: BRANCH_COMBINE[k] });
  for (const t of TRIADS) {
    // 반합은 가운데 왕지(자·오·유·묘)가 끼어야 성립
    if (a !== b && t.slice(0, 3).includes(a) && t.slice(0, 3).includes(b) && (a === t[1] || b === t[1])) {
      out.push({ type: '삼합', element: t[3] });
    }
  }
  if (a !== b && PUNISH.some((s) => s.has(a) && s.has(b))) out.push({ type: '형' });
  if (k === '0-3') out.push({ type: '형' }); // 자묘 (무례지형)
  if (a === b && [4, 6, 9, 11].includes(a)) out.push({ type: '형', self: true }); // 자형
  if (BRANCH_HARM.has(k)) out.push({ type: '해' });
  if (BRANCH_BREAK.has(k) && !out.some((r) => r.type === '육합')) out.push({ type: '파' });
  return out;
}

// 신강/신약 간이 판정: 일간을 돕는 오행(비겁+인성) 비중
export function strengthOf(saju) {
  const me = stemElement(saju.day.stem);
  const items = [
    [stemElement(saju.year.stem), 1],
    [stemElement(saju.month.stem), 1],
    [BRANCH_ELEMENT[saju.year.branch], 1],
    [BRANCH_ELEMENT[saju.month.branch], 2.5],
    [BRANCH_ELEMENT[saju.day.branch], 1.3],
  ];
  if (saju.hour) {
    items.push([stemElement(saju.hour.stem), 1]);
    items.push([BRANCH_ELEMENT[saju.hour.branch], 1]);
  }
  let support = 0;
  let total = 0;
  for (const [el, w] of items) {
    total += w;
    const d = (el - me + 5) % 5;
    if (d === 0 || d === 4) support += w;
  }
  const ratio = support / total;
  return { ratio, strong: ratio >= 0.45, label: ratio >= 0.6 ? '신강' : ratio >= 0.45 ? '중화에 가까운 신강' : ratio >= 0.3 ? '중화에 가까운 신약' : '신약' };
}

export function elementCounts(saju) {
  const counts = [0, 0, 0, 0, 0];
  for (const p of [saju.year, saju.month, saju.day, saju.hour]) {
    if (!p) continue;
    counts[stemElement(p.stem)]++;
    counts[BRANCH_ELEMENT[p.branch]]++;
  }
  return counts;
}
