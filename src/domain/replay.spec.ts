import { replay, ReplayEvent } from './replay';

// Tạo một lần trả lời, lúc 08:00 giờ VN của ngày đã cho
function ev(
  id: string,
  day: string,
  isCorrect: boolean,
  responseMs = 15000,
): ReplayEvent {
  return {
    clientEventId: id,
    isCorrect,
    responseMs,
    answeredAt: `${day}T08:00:00+07:00`,
  };
}

describe('replay', () => {
  it('chưa trả lời lần nào thì giữ trạng thái ban đầu', () => {
    const r = replay([], null);
    expect(r.correctCount).toBe(0);
    expect(r.wrongCount).toBe(0);
    expect(r.dueDate).toBeNull();
    expect(r.ef).toBe(2.5);
  });

  it('đúng 3 lần trong cùng 1 ngày thì SM-2 chỉ tính 1 lần', () => {
    const events = [
      {
        ...ev('a', '2026-10-20', true),
        answeredAt: '2026-10-20T08:00:00+07:00',
      },
      {
        ...ev('b', '2026-10-20', true),
        answeredAt: '2026-10-20T09:00:00+07:00',
      },
      {
        ...ev('c', '2026-10-20', true),
        answeredAt: '2026-10-20T10:00:00+07:00',
      },
    ];
    const r = replay(events, null);
    expect(r.correctCount).toBe(3);
    expect(r.reps).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.dueDate).toBe('2026-10-21');
  });

  it('trả lời sai thì vào sổ câu sai', () => {
    const r = replay([ev('a', '2026-10-20', false)], null);
    expect(r.wrongCount).toBe(1);
    expect(r.inWrongBook).toBe(true);
    expect(r.dueDate).toBe('2026-10-21');
  });

  it('sai rồi đúng 3 lần liên tiếp thì ra khỏi sổ câu sai', () => {
    const events = [
      ev('a', '2026-10-20', false),
      ev('b', '2026-10-21', true),
      ev('c', '2026-10-22', true),
      ev('d', '2026-10-23', true),
    ];
    const r = replay(events, null);
    expect(r.correctCount).toBe(3);
    expect(r.wrongCount).toBe(1);
    expect(r.consecutiveCorrect).toBe(3);
    expect(r.inWrongBook).toBe(false);
    expect(r.reps).toBe(3);
    expect(r.interval).toBe(12); // round(6 x 1.96)
    expect(r.dueDate).toBe('2026-11-04');
  });

  it('mới đúng 2 lần thì vẫn còn trong sổ câu sai', () => {
    const events = [
      ev('a', '2026-10-20', false),
      ev('b', '2026-10-21', true),
      ev('c', '2026-10-22', true),
    ];
    expect(replay(events, null).inWrongBook).toBe(true);
  });

  it('thứ tự mảng đầu vào không ảnh hưởng kết quả', () => {
    const events = [
      ev('a', '2026-10-20', false),
      ev('b', '2026-10-21', true),
      ev('c', '2026-10-22', true),
      ev('d', '2026-10-23', true),
    ];
    const reversed = [...events].reverse();
    expect(replay(reversed, null)).toEqual(replay(events, null));
  });

  it('admin đổi đáp án thì bỏ các lần trả lời trước đó', () => {
    const events = [ev('a', '2026-10-20', false), ev('b', '2026-10-22', true)];
    const r = replay(events, '2026-10-21T00:00:00+07:00');
    expect(r.correctCount).toBe(1);
    expect(r.wrongCount).toBe(0);
    expect(r.inWrongBook).toBe(false);
  });
});
