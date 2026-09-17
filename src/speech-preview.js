const languages = { Русский: 'ru-RU', Английский: 'en-US', Испанский: 'es-ES', Немецкий: 'de-DE', Французский: 'fr-FR' };
const samples = {
  'ru-RU': 'Привет! Я помогу озвучить вашу идею.',
  'en-US': 'Hello! Let me bring your idea to life.',
  'es-ES': '¡Hola! Daré voz a tu idea.',
  'de-DE': 'Hallo! Ich erwecke deine Idee zum Leben.',
  'fr-FR': 'Bonjour ! Donnons vie à votre idée.',
};
export function speechProfile(name = 'Аля', language = 'Русский') {
  return { lang: languages[language] || 'ru-RU', pitch: name === 'Рома' ? .8 : name === 'Чарли' ? 1.35 : 1.07, rate: name === 'Чарли' ? 1.07 : .97 };
}
export function previewVoice(name, language, onEnd) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) throw new Error('В этом браузере недоступно прослушивание голоса.');
  window.speechSynthesis.cancel();
  const profile = speechProfile(name, language);
  const utterance = new SpeechSynthesisUtterance(samples[profile.lang]);
  Object.assign(utterance, profile);
  const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith(profile.lang.split('-')[0]));
  if (voice) utterance.voice = voice;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}
