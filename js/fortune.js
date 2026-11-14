import {
  STEMS, STEMS_HANJA, BRANCHES, BRANCHES_HANJA, ELEMENTS, ELEMENTS_HANJA,
  BRANCH_MAIN_STEM, stemElement, dayPillar, tenGod, stemRelation, branchRelations, strengthOf,
} from './saju.js?v=5';

// ── 결정적 난수 (같은 날 같은 사람은 같은 결과) ──
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// 받침에 맞는 조사 붙이기: josa('볼펜', '으로') → '볼펜으로'
export function josa(word, pair) {
  const base = word.replace(/\([^)]*\)$/, ''); // '진(辰)' → '진' 기준으로 받침 판단
  const ch = base.charCodeAt(base.length - 1);
  const isHangul = ch >= 0xac00 && ch <= 0xd7a3;
  const jong = isHangul ? (ch - 0xac00) % 28 : 0;
  const has = jong !== 0;
  switch (pair) {
    case '이': case '가': return word + (has ? '이' : '가');
    case '을': case '를': return word + (has ? '을' : '를');
    case '은': case '는': return word + (has ? '은' : '는');
    case '과': case '와': return word + (has ? '과' : '와');
    case '으로': case '로': return word + (has && jong !== 8 ? '으로' : '로');
    case '이에요': case '예요': return word + (has ? '이에요' : '예요');
    default: return word + pair;
  }
}
const HANJA_GOD = { 비견: '比肩', 겁재: '劫財', 식신: '食神', 상관: '傷官', 편재: '偏財', 정재: '正財', 편관: '偏官', 정관: '正官', 편인: '偏印', 정인: '正印' };

// ── 오행별 행운 아이템 ──
export const LUCK = [
  { // 목
    colors: [{ name: '초록', hex: '#4f9d69' }, { name: '연두', hex: '#8cbf5a' }, { name: '청록', hex: '#2f8f83' }],
    accessories: ['나무 비즈 팔찌', '초록빛 손목시계 줄', '식물 모양 키링', '리넨 손수건'],
    stationery: ['나무 연필', '초록 형광펜', '대나무 자', '연두색 인덱스 탭'],
    numbers: [3, 8],
  },
  { // 화
    colors: [{ name: '다홍', hex: '#e05a47' }, { name: '주황', hex: '#ec8a3c' }, { name: '자주', hex: '#b0446a' }],
    accessories: ['붉은 실 팔찌', '주황색 머리끈', '루비빛 귀걸이', '빨간 양말'],
    stationery: ['빨간 펜', '주황 포스트잇', '빨간 인주', '다홍색 플래그 스티커'],
    numbers: [2, 7],
  },
  { // 토
    colors: [{ name: '노랑', hex: '#e9b93a' }, { name: '황토', hex: '#c58b3f' }, { name: '베이지', hex: '#d8bf94' }],
    accessories: ['호박색 반지', '가죽 카드지갑', '베이지 스카프', '도자기 머그잔'],
    stationery: ['노란 포스트잇', '크라프트 노트', '갈색 가죽 다이어리', '네모난 도장'],
    numbers: [5, 10],
  },
  { // 금
    colors: [{ name: '은색', hex: '#9aa5b1' }, { name: '흰색', hex: '#e9e5dc' }, { name: '금색', hex: '#c9a54a' }],
    accessories: ['은반지', '메탈 시계', '진주 귀걸이', '흰 셔츠'],
    stationery: ['메탈 클립', '은색 볼펜', '스테인리스 스테이플러', '흰 수정테이프'],
    numbers: [4, 9],
  },
  { // 수
    colors: [{ name: '남색', hex: '#2f4b8a' }, { name: '검정', hex: '#33363d' }, { name: '하늘색', hex: '#5b8fc9' }],
    accessories: ['남색 넥타이', '검정 머리핀', '물방울 모양 펜던트', '네이비 카디건'],
    stationery: ['남색 볼펜', '검정 만년필', '파란 형광펜', '투명 파일철'],
    numbers: [1, 6],
  },
];

// ── 십신별 해석 문구 (직장인 관점) ──
const GOD_TEXT = {
  비견: {
    gist: '나와 같은 기운이 들어와 뚝심이 서는 날',
    work: ['혼자 밀고 나가는 일에 힘이 붙어요.', '내 의견에 확신이 생기지만, 동료와 고집이 부딪힐 수 있어요.'],
    tip: ['협업할 땐 역할을 먼저 나누면 깔끔해요.', '오늘은 “같이 하자”보다 “이건 제가 맡을게요”가 잘 통해요.'],
  },
  겁재: {
    gist: '경쟁심이 올라오고 기운이 분산되기 쉬운 날',
    work: ['비교와 경쟁이 신경 쓰일 수 있어요.', '내 몫을 챙기려다 지출이나 에너지가 새기 쉬워요.'],
    tip: ['남의 속도보다 내 일정표를 기준으로 움직이세요.', '즉흥 결제나 내기는 오늘은 한 번 참아 두세요.'],
  },
  식신: {
    gist: '하고 싶은 말과 아이디어가 술술 나오는 날',
    work: ['기획·글쓰기·정리 업무가 손에 잘 붙어요.', '분위기를 부드럽게 만드는 힘이 있어 회의가 순해요.'],
    tip: ['미뤄 둔 문서를 오늘 끝내 보세요.', '점심은 맛있는 걸로 챙기면 오후 컨디션이 확 달라져요.'],
  },
  상관: {
    gist: '재치와 표현력이 날카로워지는 날',
    work: ['번뜩이는 아이디어가 많지만, 말이 앞서면 윗사람과 어긋날 수 있어요.', '틀을 깨는 제안이 잘 떠올라요.'],
    tip: ['피드백은 쿠션 한마디를 깔고 시작하세요.', '메일은 보내기 전에 한 번만 더 읽어 보세요.'],
  },
  편재: {
    gist: '활동 반경이 넓어지고 기회가 스치는 날',
    work: ['외근·영업·새 사람과의 연결에 운이 붙어요.', '여러 일을 동시에 굴리는 감각이 좋아요.'],
    tip: ['먼저 연락하는 쪽이 이득을 봐요.', '큰 결정보다는 가능성 탐색에 쓰기 좋은 날이에요.'],
  },
  정재: {
    gist: '차곡차곡 쌓는 일이 결실을 맺는 날',
    work: ['꼼꼼한 정산·검토·마감 업무가 잘 풀려요.', '성실하게 해 온 일이 인정받기 쉬워요.'],
    tip: ['할 일 목록을 위에서부터 하나씩 지워 보세요.', '숫자는 두 번 확인하면 칭찬으로 돌아와요.'],
  },
  편관: {
    gist: '압박과 긴장이 들어오지만 버티면 힘이 되는 날',
    work: ['갑작스런 지시나 급한 일정이 생길 수 있어요.', '책임감이 커지는 만큼 피로도 쌓이기 쉬워요.'],
    tip: ['우선순위를 셋만 정하고 나머지는 내일로 넘기세요.', '어깨에 힘을 빼고, 물 한 잔 마시고 시작해요.'],
  },
  정관: {
    gist: '질서와 신뢰가 서는, 평가에 유리한 날',
    work: ['보고·결재·공식 자리에서 좋은 인상을 남겨요.', '규칙대로 처리한 일이 깔끔하게 마무리돼요.'],
    tip: ['중요한 보고는 오늘 올리면 좋아요.', '단정한 옷차림이 신뢰를 한 칸 더 올려 줘요.'],
  },
  편인: {
    gist: '직감이 예민해지고 생각이 깊어지는 날',
    work: ['분석·리서치·문제 해결에 집중력이 좋아요.', '생각이 많아져 결정을 미루게 될 수 있어요.'],
    tip: ['떠오른 아이디어는 바로 메모해 두세요.', '혼자 집중할 시간을 30분만 확보해 보세요.'],
  },
  정인: {
    gist: '도움과 배움이 들어오는 든든한 날',
    work: ['선배나 상사의 도움을 받기 쉬워요.', '공부·교육·문서 검토에 운이 따라요.'],
    tip: ['막히는 일은 혼자 끙끙대지 말고 물어보세요.', '감사 인사 한마디가 오늘의 복을 불러요.'],
  },
};

const REL_TEXT = {
  천간합: (my, td) => `일간 ${josa(my, '과')} 오늘의 천간 ${josa(td, '이')} 합(合)을 이뤄, 사람과 일이 자연스럽게 엮이는 기운이 있어요.`,
  천간충: (my, td) => `일간 ${josa(my, '과')} 오늘의 천간 ${josa(td, '이')} 부딪혀, 생각과 방향이 엇갈리기 쉬워요.`,
  충: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${josa(td, '이')} 충(沖)을 이뤄, 말이 엇갈리거나 일정이 흔들리기 쉬운 날이에요.`,
  육합: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${josa(td, '이')} 육합(六合)이라, 마음 맞는 사람을 만나기 좋아요.`,
  삼합: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${josa(td, '이')} 반합(半合)을 이뤄, 팀워크에 힘이 실려요.`,
  형: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${td} 사이에 형(刑)이 있어, 사소한 마찰이나 실수에 주의가 필요해요.`,
  해: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${josa(td, '이')} 해(害)라서, 오해가 생기기 쉬우니 말은 분명하게 해요.`,
  파: (my, td) => `내 일지 ${josa(my, '과')} 오늘의 ${josa(td, '이')} 파(破)라서, 계획이 살짝 틀어질 수 있어요.`,
  띠충: (my, td) => `내 띠(${my})와 오늘(${td})이 충이라, 이동이나 외근 때는 시간 여유를 두세요.`,
};

const CAT_EFFECT = {
  weak: { same: 7, output: -4, wealth: -6, officer: -7, resource: 10 },
  strong: { same: -3, output: 8, wealth: 9, officer: 5, resource: -2 },
};
const GOD_BONUS = { 비견: 0, 겁재: -3, 식신: 3, 상관: -2, 편재: 1, 정재: 2, 편관: -3, 정관: 3, 편인: -1, 정인: 3 };

function band(score) {
  if (score >= 90) return '술술 풀리는 날';
  if (score >= 80) return '기세가 좋은 날';
  if (score >= 70) return '무난하게 흘러가는 날';
  if (score >= 60) return '한 템포 쉬어 가는 날';
  return '조심조심 다독이는 날';
}

// 오늘 도움이 되는 오행(간이 용신) 선택
function luckyElement(me, cat, strong, hasClash) {
  const el = stemElement(me);
  const rel = (d) => (el + d) % 5; // 0 비겁, 1 식상, 2 재, 3 관, 4 인성
  if (hasClash) return strong ? rel(1) : rel(4); // 충이 있으면 기운을 흘려보내거나 받쳐 줌
  switch (cat) {
    case 'officer': return rel(4); // 관인상생 (통관)
    case 'wealth': return strong ? rel(1) : rel(0);
    case 'output': return strong ? rel(2) : rel(4);
    case 'same': return rel(1);
    case 'resource': return strong ? rel(2) : rel(0);
    default: return rel(4);
  }
}

function sentenceJoin(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * 오늘의 운세
 * @param saju computeSaju 결과
 * @param {{y:number,m:number,d:number}} date 오늘(현지)
 * @param {string} seedKey 사용자 고유 키
 */
export function dailyFortune(saju, date, seedKey = '') {
  const today = dayPillar(date.y, date.m, date.d);
  const me = saju.day.stem;
  const r = rng(hashStr(`${seedKey}|${date.y}-${date.m}-${date.d}`));
  const str = strengthOf(saju);

  const stemGod = tenGod(me, today.stem);
  const branchGod = tenGod(me, BRANCH_MAIN_STEM[today.branch]);
  const effect = CAT_EFFECT[str.strong ? 'strong' : 'weak'];

  let score = 72;
  score += effect[stemGod.cat] + GOD_BONUS[stemGod.name];
  score += 0.5 * (effect[branchGod.cat] + GOD_BONUS[branchGod.name]);

  const myStem = `${STEMS[me]}(${STEMS_HANJA[me]})`;
  const tdStem = `${STEMS[today.stem]}(${STEMS_HANJA[today.stem]})`;
  const myBr = `${BRANCHES[saju.day.branch]}(${BRANCHES_HANJA[saju.day.branch]})`;
  const tdBr = `${BRANCHES[today.branch]}(${BRANCHES_HANJA[today.branch]})`;

  const relations = [];
  const sr = stemRelation(me, today.stem);
  if (sr?.type === '합') { score += 6; relations.push({ tag: '천간합', good: true, text: REL_TEXT.천간합(myStem, tdStem) }); }
  if (sr?.type === '충') { score -= 5; relations.push({ tag: '천간충', good: false, text: REL_TEXT.천간충(myStem, tdStem) }); }

  const W = { 충: -14, 육합: 8, 삼합: 5, 형: -6, 해: -4, 파: -3 };
  for (const br of branchRelations(saju.day.branch, today.branch)) {
    score += W[br.type];
    relations.push({ tag: br.type, good: W[br.type] > 0, text: REL_TEXT[br.type](myBr, tdBr) });
  }
  const yb = saju.year.branch;
  if (Math.abs(yb - today.branch) === 6 && Math.abs(saju.day.branch - today.branch) !== 6) {
    score -= 4;
    relations.push({ tag: '띠충', good: false, text: REL_TEXT.띠충(`${BRANCHES[yb]}띠`, `${tdBr}일`) });
  }

  score += Math.round((r() - 0.5) * 8); // 하루의 작은 흔들림 ±4
  score = Math.max(38, Math.min(97, Math.round(score)));

  const hasClash = relations.some((x) => x.tag === '충' || x.tag === '천간충');
  const luckyEl = luckyElement(me, stemGod.cat, str.strong, hasClash);
  const L = LUCK[luckyEl];
  const lucky = {
    element: luckyEl,
    color: pick(r, L.colors),
    accessory: pick(r, L.accessories),
    stationery: pick(r, L.stationery),
    number: pick(r, L.numbers),
  };

  const g = GOD_TEXT[stemGod.name];
  const strengthLine = str.strong
    ? (['output', 'wealth', 'officer'].includes(stemGod.cat)
      ? '내 일간의 힘이 넉넉한 편이라, 오늘 들어온 기운을 일로 잘 풀어낼 수 있어요.'
      : '내 일간의 힘이 넉넉한 편이라, 오늘은 기운이 넘쳐 고집으로 번지지 않게만 조절하면 돼요.')
    : (['same', 'resource'].includes(stemGod.cat)
      ? '내 일간의 힘이 여린 편이라, 오늘처럼 받쳐 주는 기운이 반가운 날이에요.'
      : '내 일간의 힘이 여린 편이라, 오늘은 욕심내기보다 체력 배분이 중요해요.');

  // 마무리 다독임
  const item = lucky.stationery;
  const col = lucky.color.name;
  const closers = hasClash
    ? [`중요한 보고는 핵심만 짧게, 행운의 ${josa(item, '으로')} 마음을 다잡아 보세요.`,
      `말이 엇갈려도 당신 탓만은 아니에요. ${col} 소품 하나 곁에 두고 천천히 가요.`]
    : score >= 80
      ? [`좋은 흐름일 때 미뤄 둔 일 하나만 해치워요. 책상 위 ${josa(item, '이')} 응원하고 있어요.`,
        `오늘의 기세, 아끼지 말고 써 보세요. 행운 담당은 ${josa(item, '이에요')}.`]
      : score >= 65
        ? [`무리하지 않아도 충분히 잘하고 있어요. ${item} 하나 챙겨 두면 든든해요.`,
          `오늘은 70점만 해도 100점이에요. 행운의 ${josa(item, '과')} 함께 가볍게 가요.`]
        : [`잘 안 풀려도 오늘 기운 탓일 뿐, 당신 탓이 아니에요. ${josa(item, '으로')} 할 일 하나만 적고 시작해요.`,
          `쉬어 가는 날도 필요해요. ${col} 소품 곁에 두고, 퇴근길엔 나를 꼭 칭찬해 주세요.`];

  const headline = `오늘은 ${STEMS[today.stem]}${BRANCHES[today.branch]}(${today.hanja})일. 내 일간 ${STEMS[me]}${ELEMENTS[stemElement(me)]}(${STEMS_HANJA[me]}${ELEMENTS_HANJA[stemElement(me)]})에게 ${stemGod.name}(${HANJA_GOD[stemGod.name]})${josa(stemGod.name, '이').slice(stemGod.name.length)} 들어오는 날이에요.`;

  const clashRel = relations.find((x) => x.tag === '충' || x.tag === '천간충');
  const summary = sentenceJoin(
    clashRel
      ? (clashRel.tag === '충'
        ? '오늘은 충(沖)이 들어 말이 엇갈리기 쉬운 날이에요.'
        : '오늘은 천간끼리 부딪혀 생각이 엇갈리기 쉬운 날이에요.')
      : pick(r, g.work),
    pick(r, g.tip),
    pick(r, closers),
  );

  const sub = (bias) => Math.max(30, Math.min(99, Math.round(score + bias + (r() - 0.5) * 10)));
  const catBias = {
    same: [0, -4, -5, 4], output: [4, 3, -2, 2], wealth: [2, 1, 8, -2],
    officer: [6, -3, 0, -6], resource: [3, 5, -3, 5],
  }[stemGod.cat];
  const relBias = hasClash ? -6 : relations.some((x) => x.good) ? 4 : 0;
  const subs = [
    { label: '업무운', value: sub(catBias[0]) },
    { label: '대인운', value: sub(catBias[1] + relBias) },
    { label: '재물운', value: sub(catBias[2]) },
    { label: '컨디션', value: sub(catBias[3]) },
  ];

  return {
    date,
    today,
    score,
    band: band(score),
    stemGod,
    branchGod,
    gist: g.gist,
    godHanja: HANJA_GOD[stemGod.name],
    headline,
    summary,
    relations,
    strength: str,
    strengthLine,
    details: { work: g.work, tips: g.tip },
    lucky,
    subs,
    elementName: `${ELEMENTS[stemElement(me)]}(${ELEMENTS_HANJA[stemElement(me)]})`,
  };
}

// ── 부적 한마디 ──
export const TALISMAN_LINES = [
  '오늘 결재는 한 번에 통과! 도장 꽝.',
  '퇴근 시간은 반드시 온다. 이것은 우주의 법칙.',
  '실수해도 괜찮아요. 수정 버전이 더 좋아지는 법이니까.',
  '오늘 마시는 커피가 유난히 맛있을 거예요.',
  '말 한마디로 천 냥 빚을 갚는 날. 칭찬부터 건네 보세요.',
  '회의가 예정보다 일찍 끝나는 기적이 찾아옵니다.',
  '받은편지함이 조용한 오후가 선물처럼 옵니다.',
  '당신 덕분에 오늘 누군가 한숨 돌렸어요.',
  '어려운 메일은 오늘 보내면 답이 순하게 와요.',
  '책상 정리 5분이 오후의 집중력 2시간을 불러와요.',
  '귀인은 의외로 가까이, 옆자리에 앉아 있어요.',
  '느려도 괜찮아요. 방향만 맞으면 도착합니다.',
  '오늘의 점심 메뉴 선택, 대성공이 예약되어 있어요.',
  '막힌 일은 산책 한 바퀴 뒤에 풀립니다.',
  '“확인했습니다” 한마디에 복이 붙어 오는 날.',
  '숨 한 번 깊게. 지금 그 걱정의 절반은 오지 않아요.',
  '작은 칭찬이 큰 성과로 돌아오는 날이에요.',
  '오늘 쓴 메모가 다음 주의 나를 구합니다.',
  '엘리베이터 문이 딱 맞춰 열리는 하루.',
  '거절도 실력이에요. 오늘은 정중하게 “다음에요”.',
  '당신의 꼼꼼함, 누군가 분명히 보고 있어요.',
  '물 한 잔이 부적보다 효과 좋을 때가 있어요. 지금 마셔요.',
  '오늘은 칼퇴의 기운이 서려 있습니다.',
  '모니터 밝기 한 칸 낮추고, 마음도 한 칸 내려놓아요.',
  '좋은 소식은 오후 세 시쯤 도착 예정.',
  '어제보다 1%만 나아도 오늘은 성공이에요.',
  '오늘 당신의 말에는 설득의 기운이 깃들어 있어요.',
  '키보드 위의 손끝에 행운이 머뭅니다. 오타도 줄어요.',
  '쉬는 시간을 지키는 것도 일 잘하는 사람의 습관.',
  '복(福)은 웃는 책상에 먼저 찾아와요.',
  '내일의 일은 내일의 나에게. 오늘은 여기까지 잘했어요.',
  '예상 못 한 간식이 책상 위에 도착할 조짐!',
  '지금 고민 중인 그 선택, 생각보다 괜찮은 쪽이에요.',
  '오늘은 프린터도 종이 걸림 없이 순순히 따라 줍니다.',
  '꼬인 일정이 스르륵 풀리는 부적, 효험 발동.',
  '마감은 지켜지고, 당신은 지켜집니다.',
  '먼저 건넨 인사가 좋은 인연으로 돌아와요.',
  '“이 정도면 됐다”가 정답인 날도 있어요.',
  '당신의 성실함이 곧 가장 센 부적입니다.',
  '한 템포 쉬면 두 템포 앞서 갑니다.',
];

export function talismanLine(seedKey, date, extra = 0) {
  const r = rng(hashStr(`talisman|${seedKey}|${date.y}-${date.m}-${date.d}|${extra}`));
  return TALISMAN_LINES[Math.floor(r() * TALISMAN_LINES.length)];
}
