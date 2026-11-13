import { applySm2, qualityOf, SM2_INITIAL } from './sm2';
import { addDays, vnDay } from './vn-date';

// Một lần trả lời của người dùng
export interface ReplayEvent {
  clientEventId: string;
  isCorrect: boolean;
  responseMs: number | null;
  answeredAt: string | Date;
}

// Tiến độ của một câu hỏi
export interface ProgressState {
  correctCount: number;
  wrongCount: number;
  consecutiveCorrect: number; // số lần đúng liên tiếp gần nhất
  inWrongBook: boolean; // đang nằm trong sổ câu sai
  ef: number;
  interval: number;
  reps: number;
  dueDate: string | null; // ngày cần ôn lại
  lastAnsweredAt: string | null;
}

export const PROGRESS_INITIAL: ProgressState = {
  correctCount: 0,
  wrongCount: 0,
  consecutiveCorrect: 0,
  inWrongBook: false,
  ...SM2_INITIAL,
  dueDate: null,
  lastAnsweredAt: null,
};

// Tính lại tiến độ một câu từ toàn bộ lịch sử trả lời.
// Kết quả không phụ thuộc thứ tự mảng đầu vào vì mình tự sắp xếp theo thời gian.
// answerChangedAt: nếu admin đã đổi đáp án đúng thì bỏ các lần trả lời trước đó.
export function replay(
  events: ReplayEvent[],
  answerChangedAt: string | Date | null,
): ProgressState {
  const cutoff = answerChangedAt
    ? new Date(answerChangedAt).getTime()
    : -Infinity;

  const sorted = events
    .map((e) => ({ ...e, time: new Date(e.answeredAt).getTime() }))
    .filter((e) => e.time >= cutoff)
    .sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      return a.clientEventId < b.clientEventId ? -1 : 1; // cùng lúc thì xếp theo id
    });

  const state: ProgressState = { ...PROGRESS_INITIAL };
  let lastSm2Day: string | null = null;

  for (const e of sorted) {
    if (e.isCorrect) {
      state.correctCount++;
      state.consecutiveCorrect++;
      // đúng 3 lần liên tiếp thì ra khỏi sổ câu sai
      if (state.consecutiveCorrect >= 3) state.inWrongBook = false;
    } else {
      state.wrongCount++;
      state.consecutiveCorrect = 0;
      state.inWrongBook = true;
    }

    // SM-2 chỉ tính 1 lần mỗi ngày (theo giờ VN), trả lời nhiều lần trong ngày không tính thêm
    const day = vnDay(e.time);
    if (day !== lastSm2Day) {
      const next = applySm2(
        { ef: state.ef, interval: state.interval, reps: state.reps },
        qualityOf(e.isCorrect, e.responseMs),
      );
      state.ef = next.ef;
      state.interval = next.interval;
      state.reps = next.reps;
      state.dueDate = addDays(day, next.interval);
      lastSm2Day = day;
    }

    state.lastAnsweredAt = new Date(e.time).toISOString();
  }

  return state;
}
