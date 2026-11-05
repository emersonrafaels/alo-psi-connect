import { supabase } from "@/integrations/supabase/client";

export type Lang = "pt" | "en" | "es";
const LANG_KEY = "rbe-lang";
const cacheKey = (l: Lang) => `rbe-tr-${l}`;

export const getLang = (): Lang => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
  return v === "en" || v === "es" ? v : "pt";
};

/** Strings that should never be sent for translation. */
export const isTranslatable = (s: string) => {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-zÀ-ú]{2,}/.test(t)) return false;
  if (/^(https?:\/\/|www\.)\S+$/.test(t) || /^\S+@\S+\.\S+$/.test(t)) return false;
  return true;
};

const SKIP = "script,style,noscript,code,pre,textarea,input,select,[contenteditable='true'],[data-no-translate]";
const ATTRS = ["placeholder", "title", "aria-label"] as const;

// ---------- reactive store ----------
type State = { lang: Lang; loading: boolean };
let state: State = { lang: getLang(), loading: false };
const listeners = new Set<() => void>();
const emit = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };
export const subscribeLang = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const getLangState = () => state;

// ---------- caches ----------
const caches: Partial<Record<Lang, Record<string, string>>> = {};
const loaded: Partial<Record<Lang, Promise<void>>> = {};
const cacheFor = (l: Lang) => (caches[l] ??= JSON.parse(localStorage.getItem(cacheKey(l)) || "{}"));
const saveCache = (l: Lang) => { try { localStorage.setItem(cacheKey(l), JSON.stringify(caches[l])); } catch { /* quota */ } };

/** Loads human reviews, glossary and stored translations for a language (once). */
const loadLang = (l: Lang) => {
  if (l === "pt") return Promise.resolve();
  return (loaded[l] ??= Promise.all([
    supabase.from("translations" as any).select("source_text,auto_text,human_text").eq("lang", l).limit(10000),
    supabase.from("translation_glossary" as any).select("term_pt,term_target").eq("lang", l).limit(2000),
  ]).then(([t, g]) => {
    const c = cacheFor(l);
    for (const r of (t.data ?? []) as any[]) { const v = r.human_text || r.auto_text; if (v) c[r.source_text] = v; }
    for (const r of (g.data ?? []) as any[]) c[r.term_pt.trim()] = r.term_target;
    saveCache(l);
  }).catch(() => {}));
};

// ---------- DOM tracking ----------
const textOrig = new Map<Text, string>();
const written = new WeakMap<Node, string>();
const attrOrig = new Map<Element, Record<string, string>>();
let pending = new Set<string>();
let timer: number | undefined;
const inflight = new Set<string>();
let observer: MutationObserver | null = null;

const split = (s: string) => ({ lead: s.match(/^\s*/)![0], core: s.trim(), trail: s.match(/\s*$/)![0] });

const translated = (orig: string): string | null => {
  if (state.lang === "pt") return orig;
  const { lead, core, trail } = split(orig);
  if (!isTranslatable(core)) return orig;
  const hit = cacheFor(state.lang)[core];
  if (hit) return lead + hit + trail;
  pending.add(core); schedule();
  return null;
};

const applyText = (n: Text) => {
  const cur = n.nodeValue ?? "";
  if (written.get(n) !== cur) textOrig.set(n, cur); // React wrote a new value
  const orig = textOrig.get(n)!;
  const v = translated(orig);
  if (v !== null && n.nodeValue !== v) { written.set(n, v); n.nodeValue = v; }
  else if (v === null) written.set(n, cur);
};

const applyAttrs = (el: Element) => {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur == null) continue;
    const rec = attrOrig.get(el) ?? {};
    if (el.getAttribute(`data-tr-${a}`) !== cur) rec[a] = cur;
    attrOrig.set(el, rec);
    const v = translated(rec[a]);
    if (v !== null && v !== cur) { el.setAttribute(`data-tr-${a}`, v); el.setAttribute(a, v); }
    else el.setAttribute(`data-tr-${a}`, cur);
  }
};

const visitText = (n: Text) => { if (!n.parentElement?.closest(SKIP)) applyText(n); };
const visitEl = (el: Element) => { if (!el.closest("[data-no-translate]")) applyAttrs(el); };

const walk = (root: Node) => {
  if (root.nodeType === 3) return visitText(root as Text);
  if (root.nodeType !== 1) return;
  const el = root as Element;
  if (el.closest("[data-no-translate]")) return;
  visitEl(el);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null;
  while ((n = tw.nextNode())) n.nodeType === 3 ? visitText(n as Text) : visitEl(n as Element);
};

/** Re-applies the current language to every tracked node (no reload). */
const reapplyAll = () => {
  for (const [n] of textOrig) if (!n.isConnected) textOrig.delete(n);
  for (const [e] of attrOrig) if (!e.isConnected) attrOrig.delete(e);
  for (const [n] of textOrig) applyText(n);
  for (const [e] of attrOrig) applyAttrs(e);
  walk(document.body);
};

function schedule() { if (!timer) timer = window.setTimeout(flush, 120); }

async function flush() {
  timer = undefined;
  const lang = state.lang;
  if (lang === "pt") { pending.clear(); return; }
  await loadLang(lang);
  const c = cacheFor(lang);
  const srcs = [...pending].filter((s) => !c[s] && !inflight.has(s));
  pending = new Set();
  if (!srcs.length) { reapplyAll(); emit({ loading: false }); return; }
  emit({ loading: true });
  for (let i = 0; i < srcs.length; i += 40) {
    const chunk = srcs.slice(i, i + 40);
    chunk.forEach((s) => inflight.add(s));
    try {
      const { data, error } = await supabase.functions.invoke("translate-texts", { body: { lang, texts: chunk, page: window.location.pathname } });
      if (error || !data?.translations) throw error;
      chunk.forEach((s, k) => { c[s] = data.translations[k]; });
      saveCache(lang);
      if (state.lang === lang) reapplyAll();
    } catch (e) {
      console.warn("translate failed", e);
    } finally {
      chunk.forEach((s) => inflight.delete(s));
    }
  }
  if (!pending.size && !inflight.size) emit({ loading: false });
}

/** Starts observing the page once; call on app mount. */
export function startAutoTranslate(): () => void {
  if (observer) return () => {};
  document.documentElement.lang = state.lang === "pt" ? "pt-BR" : state.lang;
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") visitText(m.target as Text);
      else if (m.type === "attributes") visitEl(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  if (state.lang !== "pt") loadLang(state.lang).then(reapplyAll);
  else walk(document.body);
  // Warm the other languages in the background so switching is instant.
  window.setTimeout(() => (["en", "es"] as Lang[]).forEach((l) => l !== state.lang && loadLang(l)), 4000);
  return () => { observer?.disconnect(); observer = null; };
}

/** Switches language in place, without reloading the page. */
export async function setLanguage(l: Lang) {
  if (l === state.lang) return;
  localStorage.setItem(LANG_KEY, l);
  const root = document.documentElement;
  root.classList.add("lang-switching");
  emit({ lang: l, loading: l !== "pt" });
  document.documentElement.lang = l === "pt" ? "pt-BR" : l;
  await Promise.race([loadLang(l), new Promise((r) => setTimeout(r, 1200))]);
  reapplyAll();
  window.setTimeout(() => root.classList.remove("lang-switching"), 160);
  if (!pending.size && !inflight.size) emit({ loading: false });
  void saveLangToProfile(l);
}

/** Persists the chosen language on the signed-in user's profile (best effort). */
async function saveLangToProfile(l: Lang) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (uid) await (supabase as any).from("profiles").update({ preferred_language: l }).eq("user_id", uid);
}

let profileSyncStarted = false;
/** On sign-in, applies the language saved on the profile (or saves the current one). */
export function startProfileLangSync() {
  if (profileSyncStarted) return;
  profileSyncStarted = true;
  const sync = async (uid: string) => {
    const { data } = await (supabase as any).from("profiles").select("preferred_language").eq("user_id", uid).maybeSingle();
    const saved = data?.preferred_language as Lang | undefined;
    if (saved && saved !== "pt" && saved !== state.lang) await setLanguage(saved);
    else if ((!saved || saved === "pt") && state.lang !== "pt") await saveLangToProfile(state.lang);
  };
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) setTimeout(() => void sync(session.user.id), 0);
  });
}
