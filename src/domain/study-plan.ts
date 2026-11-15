import { diffDays } from './vn-date';

export interface StudyPlanInput {
  unseen: number; // số câu chưa học
  due: number; // số câu đến hạn ôn lại
  examDate: string | null; // ngày thi 'YYYY-MM-DD'
  today: string;
  dailyNewGoal: number; // mục tiêu học bao nhiêu câu mới mỗi ngày
}

export interface StudyPlan {
  daysLeft: number | null;
  newToday: number; // hôm nay học bao nhiêu câu mới
  reviewToday: number; // hôm nay ôn bao nhiêu câu
  suggestMockExam: boolean; // gợi ý thi thử
  askUpdateExamDate: boolean; // hỏi người dùng cập nhật ngày thi
}

// Lộ trình học hôm nay
export function studyPlan(input: StudyPlanInput): StudyPlan {
  const reviewToday = input.due;

  // chưa đặt ngày thi, hoặc ngày thi đã qua: học theo mục tiêu mỗi ngày
  if (!input.examDate || diffDays(input.today, input.examDate) < 0) {
    return {
      daysLeft: null,
      newToday: Math.min(input.dailyNewGoal, input.unseen),
      reviewToday,
      suggestMockExam: input.unseen === 0,
      askUpdateExamDate: input.examDate !== null,
    };
  }

  // có ngày thi: chia đều số câu chưa học cho các ngày còn lại (chừa 3 ngày cuối để ôn)
  const daysLeft = Math.max(1, diffDays(input.today, input.examDate));
  const studyDays = Math.max(1, daysLeft - 3);
  const newToday = Math.min(input.unseen, Math.ceil(input.unseen / studyDays));

  return {
    daysLeft,
    newToday,
    reviewToday,
    suggestMockExam: daysLeft <= 7 || input.unseen === 0,
    askUpdateExamDate: false,
  };
}
