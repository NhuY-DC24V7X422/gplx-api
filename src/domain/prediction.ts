export type PredictionLevel =
  'NOT_ENOUGH_DATA' | 'NOT_READY' | 'NEAR_READY' | 'READY';
export type PredictionReason =
  'NEED_MORE_EXAMS' | 'LOW_SCORE' | 'CRITICAL_FAILS' | 'LOW_COVERAGE';

export interface AttemptLike {
  correctCount: number;
  passScore: number;
  failedByCritical: boolean;
}

export interface Prediction {
  level: PredictionLevel;
  reasons: PredictionReason[];
  examsUsed: number;
  avgRatio: number | null;
  criticalFails: number;
  coverage: number;
}

// Điểm trung bình so với điểm đậu (1.0 = vừa đủ đậu)
function averageRatio(attempts: AttemptLike[]): number {
  const total = attempts.reduce(
    (sum, a) => sum + a.correctCount / a.passScore,
    0,
  );
  return total / attempts.length;
}

// Dự đoán khả năng đậu từ 5 bài thi thử gần nhất.
// attempts xếp mới nhất trước. coverage là tỉ lệ câu đã học (0 đến 1).
export function predict(attempts: AttemptLike[], coverage: number): Prediction {
  const recent = attempts.slice(0, 5);
  const count = recent.length;
  const lowCoverage = coverage < 0.9;
  const criticalFails = recent.filter((a) => a.failedByCritical).length;

  // chưa thi đủ 3 bài thì chưa dự đoán được
  if (count < 3) {
    const reasons: PredictionReason[] = ['NEED_MORE_EXAMS'];
    if (lowCoverage) reasons.push('LOW_COVERAGE');
    return {
      level: 'NOT_ENOUGH_DATA',
      reasons,
      examsUsed: count,
      avgRatio: count > 0 ? averageRatio(recent) : null,
      criticalFails,
      coverage,
    };
  }

  const avgRatio = averageRatio(recent);
  const reasons: PredictionReason[] = [];
  if (avgRatio < 1.05) reasons.push('LOW_SCORE');
  if (criticalFails > 0) reasons.push('CRITICAL_FAILS');
  if (lowCoverage) reasons.push('LOW_COVERAGE');

  let level: PredictionLevel;
  if (avgRatio >= 1.05 && criticalFails === 0 && !lowCoverage) {
    level = 'READY';
  } else if (avgRatio >= 0.95 && criticalFails <= 1) {
    level = 'NEAR_READY';
  } else {
    level = 'NOT_READY';
  }

  return {
    level,
    reasons,
    examsUsed: count,
    avgRatio,
    criticalFails,
    coverage,
  };
}
