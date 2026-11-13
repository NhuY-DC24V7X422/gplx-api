export interface GradeItem {
  correctKey: string; // đáp án đúng
  selectedKey: string | null; // đáp án người dùng chọn (null = bỏ trống)
  isCritical: boolean; // câu điểm liệt
}

export interface GradeResult {
  correctCount: number;
  total: number;
  passed: boolean;
  failedByCritical: boolean;
}

// Chấm bài thi: bỏ trống tính là sai.
// Sai câu điểm liệt thì trượt dù đủ điểm.
export function grade(items: GradeItem[], passScore: number): GradeResult {
  const isRight = (item: GradeItem) =>
    item.selectedKey !== null && item.selectedKey === item.correctKey;

  const correctCount = items.filter(isRight).length;
  const failedByCritical = items.some(
    (item) => item.isCritical && !isRight(item),
  );
  const passed = correctCount >= passScore && !failedByCritical;

  return { correctCount, total: items.length, passed, failedByCritical };
}
