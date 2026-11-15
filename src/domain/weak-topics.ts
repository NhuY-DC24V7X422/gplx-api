export interface TopicEvent {
  categoryCode: string;
  isCorrect: boolean;
  answeredAt: string | Date;
}

export interface TopicStat {
  answered: number; // số câu đã tính (tối đa 30 gần nhất)
  accuracy: number | null; // tỉ lệ đúng, null nếu chưa trả lời câu nào
  enoughData: boolean;
  weight: number; // trọng số khi chọn câu cho đề ôn: chủ đề càng yếu càng cao
  weak: boolean;
}

const WINDOW = 30; // chỉ xét 30 câu gần nhất của mỗi chủ đề
const MIN_ANSWERS = 10; // ít hơn 10 câu thì chưa đủ để kết luận
const WEAK_BELOW = 0.8; // đúng dưới 80% là yếu

const round = (x: number) => Math.round(x * 1e6) / 1e6;

// Phân tích từng chủ đề xem chủ đề nào yếu
export function analyzeTopics(
  categories: string[],
  events: TopicEvent[],
): Record<string, TopicStat> {
  const result: Record<string, TopicStat> = {};

  for (const category of categories) {
    // lấy các câu gần nhất của chủ đề này
    const recent = events
      .filter((e) => e.categoryCode === category)
      .sort(
        (a, b) =>
          new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime(),
      )
      .slice(0, WINDOW);

    const answered = recent.length;
    const accuracy =
      answered > 0
        ? round(recent.filter((e) => e.isCorrect).length / answered)
        : null;
    const enoughData = answered >= MIN_ANSWERS;

    let weight = 1.0;
    if (enoughData && accuracy !== null) weight = round(1 - accuracy + 0.1);

    const weak = enoughData && accuracy !== null && accuracy < WEAK_BELOW;
    result[category] = { answered, accuracy, enoughData, weight, weak };
  }

  return result;
}
