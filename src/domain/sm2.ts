// Thuật toán SM-2: quyết định bao lâu nữa thì ôn lại một câu hỏi.
export interface Sm2State {
  ef: number; // độ dễ của câu (thấp nhất 1.3)
  interval: number; // số ngày đến lần ôn kế tiếp
  reps: number; // số lần đúng liên tiếp
}

export const SM2_INITIAL: Sm2State = { ef: 2.5, interval: 0, reps: 0 };

// Điểm chất lượng q: sai = 1, đúng nhanh (dưới 10 giây) = 5, đúng bình thường = 4
export function qualityOf(
  isCorrect: boolean,
  responseMs: number | null,
): number {
  if (!isCorrect) return 1;
  if (responseMs !== null && responseMs < 10_000) return 5;
  return 4;
}

export function applySm2(state: Sm2State, q: number): Sm2State {
  let { ef, interval, reps } = state;

  if (q < 3) {
    // trả lời sai: học lại từ đầu, mai ôn lại
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }

  ef = ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  if (ef < 1.3) ef = 1.3;
  ef = Math.round(ef * 1e6) / 1e6; // làm tròn để khỏi bị lệch số lẻ

  return { ef, interval, reps };
}
