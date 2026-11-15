import {
  ExamConfig,
  generateExam,
  GenQuestion,
  seededRandom,
} from './exam-generator';

// Đề nhỏ: 2 câu quy tắc + 1 câu điểm liệt
const config: ExamConfig = {
  totalQuestions: 3,
  passScore: 2,
  durationMinutes: 5,
  slots: [
    { label: 'Quy tắc', categoryCodes: ['RULES'], critical: false, count: 2 },
    { label: 'Điểm liệt', categoryCodes: [], critical: true, count: 1 },
  ],
};

function makePool(): GenQuestion[] {
  const pool: GenQuestion[] = [];
  for (let n = 1; n <= 10; n++) {
    pool.push({
      number: n,
      categoryCode: 'RULES',
      licenseClasses: ['A1', 'B'],
      isCritical: false,
    });
  }
  for (let n = 11; n <= 15; n++) {
    pool.push({
      number: n,
      categoryCode: 'RULES',
      licenseClasses: ['A1', 'B'],
      isCritical: true,
    });
  }
  return pool;
}

describe('seededRandom', () => {
  it('cùng seed thì ra cùng dãy số', () => {
    const a = seededRandom(123);
    const b = seededRandom(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('số random nằm trong khoảng từ 0 đến dưới 1', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 100; i++) {
      const x = random();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('generateExam', () => {
  it('cùng seed thì ra cùng đề', () => {
    const a = generateExam(makePool(), config, 'A1', seededRandom(1));
    const b = generateExam(makePool(), config, 'A1', seededRandom(1));
    expect(a.questions.map((q) => q.number)).toEqual(
      b.questions.map((q) => q.number),
    );
  });

  it('câu điểm liệt chỉ nằm ở slot điểm liệt', () => {
    const exam = generateExam(makePool(), config, 'A1', seededRandom(5));
    const critical = exam.questions.filter((q) => q.isCritical);
    expect(critical.length).toBe(1);
    expect(exam.slotOf.get(critical[0].number)).toBe(1);
  });

  it('không có câu của hạng này thì báo thiếu', () => {
    const exam = generateExam(makePool(), config, 'A', seededRandom(1));
    expect(exam.questions.length).toBe(0);
    expect(exam.warnings.length).toBe(2);
  });

  it('bỏ qua câu bị ẩn', () => {
    const pool = makePool().map((q) => ({ ...q, status: 'hidden' }));
    const exam = generateExam(pool, config, 'A1', seededRandom(1));
    expect(exam.questions.length).toBe(0);
  });
});
