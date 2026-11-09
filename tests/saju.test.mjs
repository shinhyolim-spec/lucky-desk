import assert from 'node:assert/strict';
import { dayPillar, computeSaju, sunLongitude, jdFromKST, branchRelations, tenGod, stemRelation } from '../js/saju.js';

// 일주: 널리 알려진 기준일
assert.equal(dayPillar(2000, 1, 1).hanja, '戊午');
assert.equal(dayPillar(1900, 1, 1).hanja, '甲戌');
assert.equal(dayPillar(2024, 2, 10).hanja, '甲辰'); // 2024 설날
// 절기: 2024 입춘 2/4 17:27 KST 전후
assert.ok(sunLongitude(jdFromKST(2024, 2, 4, 17, 0)) < 315);
assert.ok(sunLongitude(jdFromKST(2024, 2, 4, 18, 0)) > 315);
// 년·월주
let s = computeSaju({ y: 2000, m: 1, d: 1, hh: 12, mm: 0 });
assert.equal(s.year.hanja, '己卯');
assert.equal(s.month.hanja, '丙子');
assert.equal(s.hour.hanja, '戊午'); // 戊일 午시 → 戊午시
s = computeSaju({ y: 2024, m: 2, d: 4, hh: 18, mm: 0 });
assert.equal(s.year.hanja, '甲辰');
assert.equal(s.month.hanja, '丙寅');
s = computeSaju({ y: 2024, m: 2, d: 4, hh: 9, mm: 0 });
assert.equal(s.year.hanja, '癸卯');
assert.equal(s.month.hanja, '乙丑');
// 시주 보정: 23:40 출생 → 다음날 자시
s = computeSaju({ y: 2000, m: 1, d: 1, hh: 23, mm: 40 });
assert.equal(s.day.hanja, '己未');
assert.equal(s.hour.hanja, '甲子');
// 관계
assert.equal(tenGod(0, 5).name, '정재'); // 甲 → 己
assert.equal(tenGod(0, 6).name, '편관'); // 甲 → 庚
assert.equal(stemRelation(0, 5).type, '합');
assert.ok(branchRelations(0, 6).some((r) => r.type === '충'));
assert.ok(branchRelations(5, 8).some((r) => r.type === '육합'));
assert.ok(branchRelations(5, 8).some((r) => r.type === '형'));
assert.ok(!branchRelations(8, 4).some((r) => r.type === '삼합')); // 申辰은 반합 아님(왕지 없음)
assert.ok(branchRelations(8, 0).some((r) => r.type === '삼합'));
console.log('today 2026-11-09:', dayPillar(2026, 11, 9).hanja);
console.log('all saju tests passed');
