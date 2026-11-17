// Chuyển document trong MongoDB thành object trả về cho client.
// Chỉ lấy các trường đã phát hành, KHÔNG lấy `draft` (bản nháp của admin).

// đổi Date thành chuỗi ISO, không có thì trả null
function toIso(d: Date | null | undefined) {
  return d ? new Date(d).toISOString() : null;
}

export function toQuestionDto(q: any) {
  return {
    id: String(q._id),
    number: q.number,
    content: q.content,
    searchText: q.searchText,
    imageUrl: q.imageUrl ?? null,
    imageHash: q.imageHash ?? null,
    options: (q.options ?? []).map((o: any) => ({ key: o.key, text: o.text })),
    correctKey: q.correctKey,
    explanation: q.explanation ?? null,
    legalRef: q.legalRef ?? null,
    categoryCode: q.categoryCode,
    licenseClasses: q.licenseClasses ?? [],
    isCritical: !!q.isCritical,
    status: q.status,
    version: q.version,
    answerChangedAt: toIso(q.answerChangedAt),
  };
}

export function toCategoryDto(c: any) {
  return { code: c.code, name: c.name, order: c.order, version: c.version };
}

export function toLicenseClassDto(l: any) {
  const cfg = l.examConfig ?? {};
  return {
    code: l.code,
    name: l.name,
    description: l.description,
    order: l.order,
    examConfig: {
      totalQuestions: cfg.totalQuestions,
      passScore: cfg.passScore,
      durationMinutes: cfg.durationMinutes,
      // mỗi slot: lấy bao nhiêu câu từ chủ đề nào
      slots: (cfg.slots ?? []).map((s: any) => ({
        label: s.label,
        categoryCodes: s.categoryCodes ?? [],
        critical: !!s.critical,
        count: s.count,
      })),
    },
    version: l.version,
  };
}

export function toTrafficSignDto(s: any) {
  return {
    id: String(s._id),
    code: s.code,
    name: s.name,
    group: s.group,
    description: s.description,
    imageUrl: s.imageUrl ?? null,
    imageHash: s.imageHash ?? null,
    searchText: s.searchText,
    status: s.status,
    version: s.version,
  };
}

export function toPenaltyDto(p: any) {
  return {
    id: String(p._id),
    violation: p.violation,
    vehicleType: p.vehicleType,
    fineMin: p.fineMin,
    fineMax: p.fineMax,
    additionalPenalty: p.additionalPenalty ?? null,
    legalRef: p.legalRef,
    searchText: p.searchText,
    status: p.status,
    version: p.version,
  };
}
