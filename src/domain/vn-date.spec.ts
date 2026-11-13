import { addDays, diffDays, vnDay } from './vn-date';

describe('vnDay', () => {
  it('17:30 UTC đã sang ngày hôm sau ở Việt Nam', () => {
    expect(vnDay('2026-10-20T17:30:00Z')).toBe('2026-10-21');
  });

  it('16:59 UTC vẫn còn là hôm nay ở Việt Nam', () => {
    expect(vnDay('2026-10-20T16:59:00Z')).toBe('2026-10-20');
  });

  it('nhận được chuỗi có múi giờ +07:00', () => {
    expect(vnDay('2026-10-20T08:00:00+07:00')).toBe('2026-10-20');
  });
});

describe('addDays', () => {
  it('cộng qua tháng', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('trừ ngày', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });

  it('năm nhuận có 29/2', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('diffDays', () => {
  it('b sau a thì dương', () => {
    expect(diffDays('2026-10-20', '2026-10-27')).toBe(7);
  });

  it('b trước a thì âm', () => {
    expect(diffDays('2026-10-27', '2026-10-20')).toBe(-7);
  });

  it('cùng ngày thì bằng 0', () => {
    expect(diffDays('2026-10-20', '2026-10-20')).toBe(0);
  });
});
