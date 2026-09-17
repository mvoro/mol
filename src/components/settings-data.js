export const SETTINGS_ROLES = [
  "Без роли",
  "Сценарист Reels",
  "Threads Мейкер",
  "Прогрев в Stories",
  "Инста Карусели",
  "Сценарист сторителлинга",
  "Смысловая упаковка",
  "Генератор Лид-магнитов",
  "Телеграм Копирайтер",
  "Конструктор воронок",
  "Анализ ЦА",
  "CustDev Аналитик",
  "Промпт Инженер",
  "Нумеролог",
  "Астролог",
  "PR-менеджер",
  "SEO-специалист",
  "SMM-менеджер",
  "Бизнес-аналитик",
  "Контент-менеджер",
  "Контент-менеджер маркетплейсов",
  "Копирайтер",
  "Маркетолог",
  "Психолог",
  "Рерайтер",
];

export const SETTINGS_TITLES = {
  main: "Настройки чата",
  speed: "Скорость ответа",
  role: "Выберите роль",
  ratio: "Соотношение сторон",
  quality: "Качество",
  count: "Количество",
  duration: "Длительность",
  voice: "Голос",
  language: "Язык",
};

export function getSettingsOptions(mode, menu) {
  if (menu === "speed")
    return [
      { value: "Быстро", description: "Мгновенный ответ (по умолчанию)" },
      { value: "Оптимально", description: "Баланс скорости и глубины" },
      { value: "Глубоко", description: "Максимальное размышление, дороже" },
    ];
  if (menu === "voice")
    return [
      { value: "Аля", description: "Тёплый, универсальный", icon: "play" },
      { value: "Рома", description: "Спокойный, низкий тембр", icon: "play" },
      { value: "Чарли", description: "Высокий и звонкий", icon: "play" },
    ];
  if (menu === "language")
    return [
      "Русский",
      "Английский",
      "Испанский",
      "Немецкий",
      "Французский",
    ].map((value) => ({ value, icon: "globe" }));
  if (menu === "count")
    return ["1 шт", "2 шт", "3 шт", "4 шт"].map((value) => ({
      value,
      icon: "copy",
    }));
  if (menu === "ratio")
    return (
      mode === "video"
        ? ["16:9", "9:16", "1:1", "4:3", "3:4"]
        : ["Авто", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"]
    ).map((value) => ({
      value,
      icon: `ratio-${value}`,
      hint:
        value === "16:9"
          ? "YouTube"
          : value === "9:16"
            ? mode === "video"
              ? "Reels/Shorts"
              : "Reels/Stories"
            : undefined,
    }));
  if (menu === "quality")
    return (
      mode === "video"
        ? [
            ["720p", 0],
            ["1080p", 500],
            ["1440p", 1000],
            ["4K", 2000],
          ]
        : [
            ["1K", 250],
            ["2K", 500],
            ["3K", 750],
            ["4K", 1000],
            ["8K", 2000],
          ]
    ).map(([value, boost]) => ({ value, boost, icon: "diamond" }));
  if (menu === "duration")
    return (
      mode === "audio"
        ? [
            ["Авто", 0, "по тексту"],
            ["30 с", 0],
            ["1 мин", 300],
            ["2 мин", 600],
            ["3 мин", 900],
          ]
        : [
            ["5 с", 0],
            ["10 с", 500],
            ["15 с", 1000],
            ["20 с", 1500],
          ]
    ).map(([value, boost, hint]) => ({ value, boost, hint, icon: "timer" }));
  return [];
}

export const SETTINGS_DEFAULTS = {
  auto: { speed: "Быстро", role: "Без роли" },
  text: { role: "Без роли" },
  image: { ratio: "Авто", quality: "1K", count: "1 шт" },
  video: { ratio: "16:9", duration: "5 с", quality: "720p" },
  audio: { voice: "Аля", language: "Русский", duration: "Авто" },
};
