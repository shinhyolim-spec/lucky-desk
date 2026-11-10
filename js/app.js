import {
  computeSaju, STEMS, STEMS_HANJA, BRANCHES, BRANCHES_HANJA, ELEMENTS, ELEMENTS_HANJA, ZODIAC,
  BRANCH_ELEMENT, BRANCH_MAIN_STEM, stemElement, tenGod, strengthOf, elementCounts, addDays,
} from './saju.js';
import { dailyFortune, talismanLine, LUCK, hashStr, josa } from './fortune.js';
import { ICONS, NAMES } from './icons.js';
import { createScratch } from './scratch.js';
import { createMatch3 } from './match3.js';

const $ = (id) => document.getElementById(id);
const KEY = { profile: 'luckydesk.profile', talisman: 'luckydesk.talisman', match: 'luckydesk.match3' };
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가(사생활 보호 모드 등) */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* noop */ } },
};

let profile = store.get(KEY.profile);
let saju = null;
let fortune = null;
let fortuneTomorrow = null;
let tomorrowParts = null;
let dayView = 0; // 0 오늘, 1 내일
let todayKey = '';
let scratch = null;
let match = null;

function todayParts() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate(), w: t.getDay() };
}
const dateKey = (p) => `${p.y}-${p.m}-${p.d}`;
const seedKey = () => (profile ? String(hashStr(`${profile.birth}|${profile.time || ''}`)) : '');

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── 화면 전환 ──
const VIEWS = ['setup', 'today', 'talisman', 'match', 'me'];
function show(name) {
  if (!profile) name = 'setup';
  if (!VIEWS.includes(name)) name = 'today';
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
  $('tabbar').hidden = !profile;
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === name));
  if (name === 'today') renderToday();
  if (name === 'talisman') renderTalisman();
  if (name === 'match') renderMatch();
  if (name === 'me') renderMe();
  if (name === 'setup') fillSetup();
  window.scrollTo(0, 0);
}
const route = () => show(location.hash.slice(1) || 'today');
window.addEventListener('hashchange', route);

// ── 데이터 준비 ──
function prepare() {
  const t = todayParts();
  $('topDate').textContent = `${t.m}월 ${t.d}일 (${WEEK[t.w]})`;
  if (!profile) return;
  const [y, m, d] = profile.birth.split('-').map(Number);
  let hh = null, mm = null;
  if (profile.time) [hh, mm] = profile.time.split(':').map(Number);
  saju = computeSaju({ y, m, d, hh, mm });
  fortune = dailyFortune(saju, t, seedKey());
  const [ty, tm, td] = addDays(t.y, t.m, t.d, 1);
  tomorrowParts = { y: ty, m: tm, d: td, w: (t.w + 1) % 7 };
  fortuneTomorrow = dailyFortune(saju, tomorrowParts, seedKey());
  if (dateKey(t) !== todayKey) dayView = 0;
  todayKey = dateKey(t);
}

// ── 설정 ──
function fillSetup() {
  const f = $('setupForm');
  if (profile) {
    f.nick.value = profile.nick || '';
    f.birth.value = profile.birth;
    f.time.value = profile.time || '';
    f.noTime.checked = !profile.time;
  }
  f.time.disabled = f.noTime.checked;
}
$('setupForm').noTime.addEventListener('change', (e) => {
  $('setupForm').time.disabled = e.target.checked;
});
$('setupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const birth = f.birth.value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) { toast('생년월일을 입력해 주세요'); return; }
  const time = f.noTime.checked ? '' : f.time.value;
  if (!f.noTime.checked && !time) { toast('태어난 시간을 입력하거나 “몰라요”를 체크해 주세요'); return; }
  profile = { nick: f.nick.value.trim(), birth, time };
  store.set(KEY.profile, profile);
  match = null;
  prepare();
  location.hash = '#today';
  route();
});

// ── 오늘의 운세 ──
function luckyIconFor(el) {
  const map = ['pencil', 'eraser', 'sticky', 'clip', 'pen'];
  return ICONS[map[el]];
}

// 내일 보기일 때 문구의 '오늘'을 '내일'로
const dw = (str) => (dayView ? str.replace(/오늘/g, '내일') : str);

function renderDaySwitch() {
  const t = todayParts();
  [[fortune, t, '오늘'], [fortuneTomorrow, tomorrowParts, '내일']].forEach(([f, p, word], i) => {
    const btn = $(`dayBtn${i}`);
    btn.innerHTML = `<small>${word} ${p.m}/${p.d} (${WEEK[p.w]})</small><b>${f.today.name}(${f.today.hanja})일</b>`;
    btn.setAttribute('aria-selected', String(dayView === i));
  });
}
document.querySelectorAll('.day-switch button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const v = Number(btn.dataset.day);
    if (v === dayView) return;
    dayView = v;
    renderToday();
  });
});

function renderToday() {
  renderDaySwitch();
  const f = dayView ? fortuneTomorrow : fortune;
  document.querySelectorAll('#view-today .dayword').forEach((e) => { e.textContent = dayView ? '내일' : '오늘'; });
  const name = profile.nick ? `${profile.nick}님` : '오늘도 출근한 당신';
  $('greet').textContent = dayView ? `${profile.nick ? name + ', ' : ''}내일 하루를 미리 살펴볼게요` : `${name}, 좋은 아침이에요`;
  $('scoreTitle').textContent = `${dayView ? '내일' : '오늘'}은 ${f.score}점인 날`;
  $('scoreBand').textContent = `${f.band} · ${f.gist}`;

  // 점수 애니메이션
  const num = $('scoreNum');
  const target = f.score;
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 900);
    num.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const C = 2 * Math.PI * 52;
  $('gaugeFg').style.strokeDashoffset = C;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('gaugeFg').style.strokeDashoffset = C * (1 - target / 100);
  }));

  const chips = [`<span class="chip">${dayView ? '내일' : '오늘'} 일진 <b>${f.today.hanja}</b> ${f.today.name}일</span>`,
    `<span class="chip">${f.stemGod.name} <b>${f.godHanja}</b></span>`];
  for (const r of f.relations) chips.push(`<span class="chip ${r.good ? 'good' : 'bad'}">${r.tag}</span>`);
  $('iljin').innerHTML = chips.join('');

  $('headline').textContent = dw(f.headline);
  $('summary').textContent = dw(f.summary);
  $('relations').innerHTML = f.relations
    .map((r) => `<li class="${r.good ? 'good' : 'bad'}"><span class="tag">${r.tag}</span>${dw(r.text)}</li>`)
      .join('') || dw('<li>오늘은 내 일지와 크게 부딪히거나 묶이는 관계가 없어, 흐름이 담백한 편이에요.</li>');
  $('strengthLine').textContent = `${dw(f.strengthLine)} (내 일간: ${STEMS[saju.day.stem]}${f.elementName}, ${f.strength.label})`;

  $('subs').innerHTML = f.subs
    .map((s) => `<div class="sub"><span>${s.label}</span><div class="bar"><i style="width:0" data-w="${s.value}"></i></div><b>${s.value}</b></div>`)
    .join('');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('#subs .bar i').forEach((i) => { i.style.width = `${i.dataset.w}%`; });
  }));

  const L = f.lucky;
  const elName = `${ELEMENTS[L.element]}(${ELEMENTS_HANJA[L.element]})`;
  $('lucky').innerHTML = `
    <div class="luck"><span class="swatch" style="background:${L.color.hex}"></span><small>행운의 색</small><b>${L.color.name}</b></div>
    <div class="luck"><span class="ico">${luckyIconFor(L.element)(L.color.hex)}</span><small>행운의 문구류</small><b>${L.stationery}</b></div>
    <div class="luck"><span class="ico">${ICONS.pin(L.color.hex)}</span><small>행운의 액세서리</small><b>${L.accessory}</b></div>
    <div class="luck"><span class="swatch" style="background:var(--paper);display:grid;place-items:center;font-family:var(--serif);font-weight:700;color:var(--seal)">${L.number}</span><small>행운의 숫자</small><b>${L.number} <span class="muted small">· ${elName} 기운</span></b></div>`;

  const tips = [...f.details.tips];
  if (f.relations.some((r) => r.tag === '충')) tips.unshift('충이 든 날엔 구두로 한 약속도 메신저로 한 번 더 남겨 두세요.');
  if (f.relations.some((r) => r.tag === '육합' || r.tag === '천간합')) tips.unshift('합이 든 날이라 부탁이나 협조 요청이 잘 통해요.');
  tips.push(`행운의 색 ${L.color.name}: 펜, 메모지, 머그잔처럼 손 닿는 곳에 두면 충분해요.`);
  $('tips').innerHTML = tips.slice(0, 4).map((t) => `<li>${dw(t)}</li>`).join('');
}

$('shareBtn').addEventListener('click', async () => {
  const url = location.origin + location.pathname;
  const data = { title: '럭키데스크 사주책상', text: '출근길 1분, 오늘의 운세 점수 확인해 봐요!', url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(url);
    toast('링크를 복사했어요. 메신저에 붙여 넣어 주세요');
  } catch (err) {
    if (err?.name !== 'AbortError') toast(url);
  }
});

// ── 부적 ──
function renderTalisman() {
  const t = todayParts();
  let st = store.get(KEY.talisman);
  if (!st || st.date !== dateKey(t)) st = { date: dateKey(t), extra: 0, revealed: false };
  store.set(KEY.talisman, st);
  $('talismanLine').textContent = talismanLine(seedKey(), t, st.extra);
  if (!scratch) {
    scratch = createScratch($('talismanCanvas'), {
      onReveal() {
        const s = store.get(KEY.talisman);
        s.revealed = true;
        store.set(KEY.talisman, s);
        $('talismanAgain').hidden = false;
      },
    });
  }
  // 화면이 보인 뒤에 크기를 재서 그림
  requestAnimationFrame(() => {
    scratch.reset();
    if (st.revealed) scratch.showRevealed();
    $('talismanAgain').hidden = !st.revealed;
  });
}
$('talismanAgain').addEventListener('click', () => {
  const st = store.get(KEY.talisman);
  st.extra += 1;
  st.revealed = false;
  store.set(KEY.talisman, st);
  $('talismanAgain').hidden = true;
  $('talismanLine').textContent = talismanLine(seedKey(), todayParts(), st.extra);
  scratch.reset();
});

// ── 블록 맞추기 ──
function blockTypes() {
  const L = fortune.lucky;
  const keys = ['pencil', 'eraser', 'sticky', 'clip', 'pen'];
  const types = keys.map((key, el) => {
    const color = el === L.element ? L.color.hex : LUCK[el].colors[0].hex;
    const colorName = el === L.element ? L.color.name : LUCK[el].colors[0].name;
    return { key, color, label: `${colorName} ${NAMES[key]}` };
  });
  types.push({ key: 'pin', color: '#8e6bbf', label: `보라 ${NAMES.pin}` });
  return types;
}

function renderMatch() {
  const L = fortune.lucky;
  const types = blockTypes();
  const lucky = types[L.element];
  $('m3Guide').innerHTML = `오늘의 행운 블록은 <b>${lucky.label}</b>! 맞추면 블록마다 <b>+15</b> 보너스`;
  if (match && match.day === todayKey) return;
  const toastEl = $('boardToast');
  match = createMatch3($('board'), {
    types,
    luckyIndex: L.element,
    storage: {
      load() {
        const s = store.get(KEY.match) || { best: 0 };
        if (s.date !== todayKey) return { date: todayKey, score: 0, lucky: 0, best: s.best || 0 };
        return s;
      },
      save(s) { store.set(KEY.match, s); },
    },
    onChange(s) {
      $('m3Score').textContent = s.score.toLocaleString();
      $('m3Best').textContent = s.best.toLocaleString();
      $('m3Lucky').textContent = s.lucky;
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastEl.t);
      toastEl.t = setTimeout(() => toastEl.classList.remove('show'), 900);
    },
  });
  match.day = todayKey;
}
$('m3Hint').addEventListener('click', () => match?.hint());
$('m3New').addEventListener('click', () => match?.restart());

// ── 내 사주 ──
function renderMe() {
  const me = saju.day.stem;
  $('meTitle').textContent = profile.nick ? `${profile.nick}님의 사주 원국` : '내 사주 원국';
  const cols = [['시주', saju.hour], ['일주', saju.day], ['월주', saju.month], ['년주', saju.year]];
  $('pillars').innerHTML = cols.map(([label, p]) => {
    if (!p) return `<div class="pillar empty"><small>${label}</small><span class="hz"><em>시간 모름</em>?</span><span class="hz">?</span></div>`;
    const isMe = p === saju.day;
    const sg = isMe ? '일간(나)' : tenGod(me, p.stem).name;
    const bg = tenGod(me, BRANCH_MAIN_STEM[p.branch]).name;
    return `<div class="pillar ${isMe ? 'me' : ''}"><small>${label}</small>
      <span class="hz el-${stemElement(p.stem)}"><em>${sg}</em>${STEMS_HANJA[p.stem]}</span>
      <span class="hz el-${BRANCH_ELEMENT[p.branch]}">${BRANCHES_HANJA[p.branch]}<em>${bg}</em></span>
      <small>${STEMS[p.stem]}${BRANCHES[p.branch]}</small></div>`;
  }).join('');
  const t = profile.time ? `${profile.time} 출생` : '시간 모름';
  $('meBirth').textContent = `양력 ${profile.birth.replace(/-/g, '.')} ${t} · ${ZODIAC[saju.year.branch]}띠 (${saju.year.year}년 ${saju.year.name}년 기준)`;

  const counts = elementCounts(saju);
  const total = counts.reduce((a, b) => a + b, 0);
  $('elements').innerHTML = counts.map((n, i) => `<div class="sub"><span class="el-${i}">${ELEMENTS[i]}(${ELEMENTS_HANJA[i]})</span><div class="bar"><i style="width:${(n / total) * 100}%;background:currentColor" class="el-${i}"></i></div><b>${n}</b></div>`).join('');
  const s = strengthOf(saju);
  const dm = `${STEMS[me]}${ELEMENTS[stemElement(me)]}(${STEMS_HANJA[me]}${ELEMENTS_HANJA[stemElement(me)]})`;
  $('meStrength').textContent = `일간은 ${dm}${josa(ELEMENTS[stemElement(me)], '이에요').slice(1)}. 나를 돕는 기운의 비중이 ${Math.round(s.ratio * 100)}%로 ${s.label}에 가까워요.`;
}
$('editBtn').addEventListener('click', () => { location.hash = '#setup'; });
$('resetBtn').addEventListener('click', () => {
  if (!confirm('저장된 생년월일과 게임 기록을 모두 지울까요?')) return;
  Object.values(KEY).forEach(store.del);
  profile = null;
  match = null;
  location.hash = '';
  prepare();
  route();
});

// 자정이 지나 다시 열면 새 운세로
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !profile) return;
  if (dateKey(todayParts()) !== todayKey) { prepare(); route(); }
});

prepare();
route();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
