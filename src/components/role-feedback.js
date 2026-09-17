export const REVIEW_MAX_LENGTH = 500;
export const REVIEW_ASPECTS = ["Точные ответы", "Экономит время", "Хорошие тексты", "Понимает задачу", "Легко работать", "Много идей"];

export function createRoleReview({ text = "", aspects = [] }, date = new Date()) {
  const cleanText = String(text).trim().slice(0, REVIEW_MAX_LENGTH);
  const cleanAspects = [...new Set(aspects)].filter(aspect => REVIEW_ASPECTS.includes(aspect));
  if (!cleanText && !cleanAspects.length) return null;
  return { name: "Вы", date: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }), text: cleanText, aspects: cleanAspects };
}

export function saveRoleReview(reviews, roleId, review) {
  const previous = Array.isArray(reviews[roleId]) ? reviews[roleId] : [];
  return { ...reviews, [roleId]: [review, ...previous.filter(item => item?.name !== "Вы")] };
}
