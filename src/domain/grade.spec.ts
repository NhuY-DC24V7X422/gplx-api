import { grade, GradeItem } from './grade';

// Tạo n câu, trong đó `right` câu chọn đúng, còn lại chọn sai
function makeItems(n: number, right: number, criticalIndex = -1): GradeItem[] {
  return Array.from({ length: n }, (_, i) => ({
    correctKey: '1',
    selectedKey: i < right ? '1' : '2',
    isCritical: i === criticalIndex,
  }));
}

describe('grade', () => {
  it('đủ điểm đậu thì đạt', () => {
    const r = grade(makeItems(25, 21), 21);
    expect(r).toEqual({
      correctCount: 21,
      total: 25,
      passed: true,
      failedByCritical: false,
    });
  });

  it('thiếu 1 điểm thì trượt', () => {
    const r = grade(makeItems(25, 20), 21);
    expect(r.passed).toBe(false);
    expect(r.failedByCritical).toBe(false);
  });

  it('đủ điểm nhưng sai câu điểm liệt thì trượt', () => {
    // câu điểm liệt nằm ở cuối nên bị chọn sai
    const r = grade(makeItems(25, 24, 24), 21);
    expect(r.correctCount).toBe(24);
    expect(r.failedByCritical).toBe(true);
    expect(r.passed).toBe(false);
  });

  it('bỏ trống câu điểm liệt cũng là trượt', () => {
    const items = makeItems(25, 25, 0);
    items[0].selectedKey = null;
    const r = grade(items, 21);
    expect(r.failedByCritical).toBe(true);
    expect(r.passed).toBe(false);
  });

  it('bỏ trống tính là sai', () => {
    const items = makeItems(25, 25);
    items[3].selectedKey = null;
    expect(grade(items, 21).correctCount).toBe(24);
  });

  it('đúng câu điểm liệt và đủ điểm thì đạt', () => {
    const r = grade(makeItems(25, 25, 0), 21);
    expect(r.passed).toBe(true);
  });
});
