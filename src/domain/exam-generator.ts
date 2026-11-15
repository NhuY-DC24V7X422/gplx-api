// Một "slot" là một nhóm câu trong đề, vd: 8 câu về quy tắc giao thông
export interface ExamSlot {
  label: string;
  categoryCodes: string[];
  critical: boolean; // true thì lấy câu điểm liệt
  count: number;
}

export interface ExamConfig {
  totalQuestions: number;
  passScore: number;
  durationMinutes: number;
  slots: ExamSlot[];
}

export interface GenQuestion {
  number: number;
  categoryCode: string;
  licenseClasses: string[];
  isCritical: boolean;
  status?: string;
}

export interface GeneratedExam<Q> {
  questions: Q[];
  slotOf: Map<number, number>; // số câu -> thứ tự slot (-1 là câu lấy bù)
  warnings: string[];
}

// Random có seed (thuật toán mulberry32): cùng seed thì ra cùng kết quả, dễ test
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Xáo trộn mảng (Fisher-Yates), không làm thay đổi mảng gốc
function shuffle<T>(list: T[], random: () => number): T[] {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Tạo đề thi theo cấu hình của từng hạng bằng
export function generateExam<Q extends GenQuestion>(
  allQuestions: Q[],
  config: ExamConfig,
  licenseClass: string,
  random: () => number,
): GeneratedExam<Q> {
  const used = new Set<number>();
  const slotOf = new Map<number, number>();
  const chosen: Q[] = [];
  const warnings: string[] = [];

  // chỉ lấy câu đang hiển thị và thuộc hạng này
  const eligible = allQuestions.filter(
    (q) =>
      (q.status ?? 'active') === 'active' &&
      q.licenseClasses.includes(licenseClass),
  );

  let missing = 0;
  config.slots.forEach((slot, index) => {
    const candidates = eligible.filter((q) => {
      if (used.has(q.number)) return false;
      if (slot.critical) return q.isCritical;
      return !q.isCritical && slot.categoryCodes.includes(q.categoryCode);
    });
    const picked = shuffle(candidates, random).slice(0, slot.count);

    for (const q of picked) {
      used.add(q.number);
      slotOf.set(q.number, index);
      chosen.push(q);
    }

    if (picked.length < slot.count) {
      missing += slot.count - picked.length;
      warnings.push(
        `Slot "${slot.label}" thiếu ${slot.count - picked.length} câu`,
      );
    }
  });

  // slot nào thiếu câu thì lấy bù từ các câu thường còn lại
  if (missing > 0) {
    const rest = eligible.filter((q) => !used.has(q.number) && !q.isCritical);
    for (const q of shuffle(rest, random).slice(0, missing)) {
      used.add(q.number);
      slotOf.set(q.number, -1);
      chosen.push(q);
    }
  }

  return { questions: shuffle(chosen, random), slotOf, warnings };
}
