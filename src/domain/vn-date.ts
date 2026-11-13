// Việt Nam là UTC+7, không có giờ mùa hè
const VN_OFFSET_MS = 7 * 3600 * 1000;

// Lấy ngày theo giờ Việt Nam, dạng 'YYYY-MM-DD'
export function vnDay(input: string | Date | number): string {
  const time = new Date(input).getTime();
  return new Date(time + VN_OFFSET_MS).toISOString().slice(0, 10);
}

// Cộng n ngày vào 'YYYY-MM-DD' (n âm thì là trừ)
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Số ngày từ a đến b (b - a)
export function diffDays(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
