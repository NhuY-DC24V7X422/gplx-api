import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateExam, GenQuestion, seededRandom } from './exam-generator';
import { grade } from './grade';
import { normalizeVi } from './normalize-vi';
import { predict } from './prediction';
import { replay } from './replay';
import { applySm2 } from './sm2';
import { streak } from './streak';
import { studyPlan } from './study-plan';
import { analyzeTopics } from './weak-topics';

// Test vector là các ca test lưu trong file JSON (test/vectors).
// App Flutter cũng dùng đúng các file này để chắc chắn 2 bên tính ra cùng kết quả.
function loadVectors(name: string): any[] {
  const file = join(__dirname, '../../test/vectors', `${name}.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

// chuyển mỗi ca thành [tên, ca] để it.each dùng
const cases = (name: string) => loadVectors(name).map((c) => [c.name, c]);

describe('sm2 (vector)', () => {
  it.each(cases('sm2'))('%s', (_name, c) => {
    const r = applySm2(c.input.state, c.input.q);
    expect(r.interval).toBe(c.expected.interval);
    expect(r.reps).toBe(c.expected.reps);
    expect(r.ef).toBeCloseTo(c.expected.ef, 9);
  });
});

describe('replay (vector)', () => {
  it.each(cases('replay'))('%s', (_name, c) => {
    const r = replay(c.input.events, c.input.answerChangedAt);
    const { ef, ...others } = c.expected;
    expect(r).toMatchObject(others);
    expect(r.ef).toBeCloseTo(ef, 9);
  });
});

describe('grade (vector)', () => {
  it.each(cases('grade'))('%s', (_name, c) => {
    expect(grade(c.input.items, c.input.passScore)).toEqual(c.expected);
  });
});

describe('normalizeVi (vector)', () => {
  it.each(cases('normalize'))('%s', (_name, c) => {
    expect(normalizeVi(c.input)).toBe(c.expected);
  });
});

describe('predict (vector)', () => {
  it.each(cases('prediction'))('%s', (_name, c) => {
    const r = predict(c.input.attempts, c.input.coverage);
    expect(r.level).toBe(c.expected.level);
    expect(r.reasons).toEqual(c.expected.reasons);
  });
});

describe('streak (vector)', () => {
  it.each(cases('streak'))('%s', (_name, c) => {
    expect(streak(c.input.dayCounts, c.input.today)).toEqual(c.expected);
  });
});

describe('analyzeTopics (vector)', () => {
  it.each(cases('weak_topics'))('%s', (_name, c) => {
    const result = analyzeTopics(c.input.categories, c.input.events);
    for (const [category, expected] of Object.entries<any>(c.expected)) {
      const r = result[category];
      expect(r.answered).toBe(expected.answered);
      expect(r.enoughData).toBe(expected.enoughData);
      expect(r.weak).toBe(expected.weak);
      expect(r.weight).toBeCloseTo(expected.weight, 9);
      if (expected.accuracy === null) expect(r.accuracy).toBeNull();
      else expect(r.accuracy).toBeCloseTo(expected.accuracy, 9);
    }
  });
});

describe('studyPlan (vector)', () => {
  it.each(cases('study_plan'))('%s', (_name, c) => {
    expect(studyPlan(c.input)).toEqual(c.expected);
  });
});

describe('generateExam (vector)', () => {
  it.each(cases('exam'))('%s', (_name, c) => {
    // dựng kho câu hỏi giả từ mô tả trong vector
    const pool: GenQuestion[] = [];
    let number = 1;
    for (const p of c.input.pool) {
      for (let i = 0; i < p.count; i++) {
        pool.push({
          number: number++,
          categoryCode: p.categoryCode,
          isCritical: p.critical,
          licenseClasses: p.licenseClasses ?? ['A1', 'A', 'B'],
        });
      }
    }

    const exam = generateExam(
      pool,
      c.input.config,
      c.input.licenseClass,
      seededRandom(c.input.seed),
    );
    const numbers = exam.questions.map((q) => q.number);

    expect(numbers.length).toBe(c.expected.total);
    expect(new Set(numbers).size).toBe(numbers.length); // không trùng câu
    expect(
      exam.questions.every((q) =>
        q.licenseClasses.includes(c.input.licenseClass),
      ),
    ).toBe(true);
    expect(exam.questions.filter((q) => q.isCritical).length).toBe(
      c.expected.criticalCount,
    );
    expect(exam.warnings.length).toBe(c.expected.warnings);

    // số câu của từng slot
    const slotValues = [...exam.slotOf.values()];
    const slotCounts = c.input.config.slots.map(
      (_s: unknown, i: number) => slotValues.filter((v) => v === i).length,
    );
    expect(slotCounts).toEqual(c.expected.slotCounts);
  });
});
