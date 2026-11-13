import { applySm2, qualityOf, SM2_INITIAL } from './sm2';

describe('qualityOf', () => {
  it('sai thì được 1 điểm', () => {
    expect(qualityOf(false, 3000)).toBe(1);
  });

  it('đúng dưới 10 giây thì được 5 điểm', () => {
    expect(qualityOf(true, 5000)).toBe(5);
  });

  it('đúng từ 10 giây trở lên thì được 4 điểm', () => {
    expect(qualityOf(true, 10_000)).toBe(4);
  });

  it('đúng nhưng không có thời gian thì được 4 điểm', () => {
    expect(qualityOf(true, null)).toBe(4);
  });
});

describe('applySm2', () => {
  it('câu mới trả lời đúng: mai ôn lại', () => {
    expect(applySm2(SM2_INITIAL, 4)).toEqual({ ef: 2.5, interval: 1, reps: 1 });
  });

  it('đúng lần 2: 6 ngày sau ôn lại', () => {
    const r = applySm2({ ef: 2.5, interval: 1, reps: 1 }, 4);
    expect(r).toEqual({ ef: 2.5, interval: 6, reps: 2 });
  });

  it('đúng lần 3: interval = 6 x 2.5 = 15', () => {
    const r = applySm2({ ef: 2.5, interval: 6, reps: 2 }, 4);
    expect(r).toEqual({ ef: 2.5, interval: 15, reps: 3 });
  });

  it('trả lời nhanh (q = 5) thì ef tăng', () => {
    expect(applySm2(SM2_INITIAL, 5).ef).toBe(2.6);
  });

  it('trả lời sai thì học lại từ đầu và ef giảm', () => {
    const r = applySm2({ ef: 2.5, interval: 15, reps: 3 }, 1);
    expect(r).toEqual({ ef: 1.96, interval: 1, reps: 0 });
  });

  it('ef không xuống dưới 1.3', () => {
    const r = applySm2({ ef: 1.3, interval: 1, reps: 0 }, 1);
    expect(r.ef).toBe(1.3);
  });
});
