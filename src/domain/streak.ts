import { addDays } from './vn-date';

// Một ngày chỉ được tính vào chuỗi khi trả lời ít nhất 10 câu
export const STREAK_MIN_ANSWERS = 10;

// Tính chuỗi ngày học liên tiếp.
// dayCounts: số câu đã trả lời mỗi ngày, vd { '2026-10-20': 15 }
export function streak(
  dayCounts: Record<string, number>,
  today: string,
): { current: number; longest: number } {
  // gom các ngày đủ số câu
  const days = new Set<string>();
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count >= STREAK_MIN_ANSWERS) days.add(day);
  }

  // chuỗi hiện tại: đếm lùi từ hôm nay (hôm nay chưa học thì bắt đầu từ hôm qua)
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // chuỗi dài nhất: chỉ đếm từ ngày đầu của mỗi chuỗi
  let longest = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // không phải ngày đầu chuỗi
    let length = 1;
    while (days.has(addDays(day, length))) length++;
    if (length > longest) longest = length;
  }

  return { current, longest };
}
