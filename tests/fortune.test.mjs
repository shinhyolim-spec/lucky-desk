import assert from 'node:assert/strict';
import { computeSaju } from '../js/saju.js';
import { dailyFortune } from '../js/fortune.js';
const s = computeSaju({ y: 1990, m: 5, d: 15, hh: 8, mm: 30 });
const scores = [];
for (let i = 0; i < 60; i++) {
  const t = new Date(Date.UTC(2026, 10, 1 + i));
  const f = dailyFortune(s, { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }, 'k');
  assert.ok(f.score >= 38 && f.score <= 97);
  scores.push(f.score);
  if (i < 3) console.log(f.today.hanja, f.score, f.band, '\n ', f.headline, '\n ', f.summary, '\n ', f.relations.map(r=>r.tag).join(','), f.lucky.color.name, f.lucky.accessory, f.lucky.stationery);
}
const a = dailyFortune(s, { y: 2026, m: 11, d: 9 }, 'k');
const b = dailyFortune(s, { y: 2026, m: 11, d: 9 }, 'k');
assert.deepEqual(a, b);
console.log('min', Math.min(...scores), 'max', Math.max(...scores), 'avg', (scores.reduce((x, y) => x + y) / scores.length).toFixed(1));
console.log('fortune tests passed');
