/** Leitura em voz alta no padrão do protótipo V11: pt-BR, rate .96, até ~900 caracteres. */
let listeners: Array<() => void> = [];

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

const pickVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /pt-BR/i.test(v.lang)) || voices.find((v) => /^pt/i.test(v.lang)) || null;
};

if (speechSupported()) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices());
}

export const cancelSpeech = () => {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const l = listeners;
  listeners = [];
  l.forEach((fn) => fn());
};

export const collectText = (root: Element | null, extra: string[] = []) => {
  const parts: string[] = [...extra.filter(Boolean)];
  root?.querySelectorAll("h2, h3, p").forEach((el) => {
    const t = el.textContent?.trim();
    if (t && !parts.includes(t) && parts.join(" ").length < 850) parts.push(t);
  });
  return parts.join(". ").slice(0, 900);
};

export const speak = (text: string, onEnd: () => void) => {
  cancelSpeech();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 0.96;
  const v = pickVoice();
  if (v) u.voice = v;
  listeners.push(onEnd);
  u.onend = u.onerror = () => {
    listeners = listeners.filter((fn) => fn !== onEnd);
    onEnd();
  };
  window.speechSynthesis.speak(u);
};
