import { supabase } from "@/integrations/supabase/client";

export type Lang = "pt" | "en" | "es";
const LANG_KEY = "rbe-lang";
const cacheKey = (l: Lang) => `rbe-tr-${l}`;

export const getLang = (): Lang => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
  return v === "en" || v === "es" ? v : "pt";
};
export const setLang = (l: Lang) => localStorage.setItem(LANG_KEY, l);

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

type Item = { apply: (v: string) => void; src: string };

export function startAutoTranslate(lang: Lang): () => void {
  if (lang === "pt") return () => {};
  const cache: Record<string, string> = JSON.parse(localStorage.getItem(cacheKey(lang)) || "{}");
  const original = new WeakMap<Node, string>();
  const originalAttr = new WeakMap<Element, Record<string, string>>();
  const done = new WeakMap<Node, string>(); // node -> last translated value we wrote
  let pending: Item[] = [];
  let timer: number | undefined;
  let inflight = new Set<string>();
  let stopped = false;

  const saveCache = () => {
    try { localStorage.setItem(cacheKey(lang), JSON.stringify(cache)); } catch { /* quota */ }
  };

  const queue = (src: string, apply: (v: string) => void) => {
    const core = src.trim();
    if (!isTranslatable(core)) return;
    const lead = src.match(/^\s*/)![0];
    const trail = src.match(/\s*$/)![0];
    const wrap = (v: string) => apply(lead + v + trail);
    if (cache[core]) return wrap(cache[core]);
    pending.push({ src: core, apply: wrap });
    schedule();
  };

  const visitText = (n: Text) => {
    if (n.parentElement?.closest(SKIP)) return;
    const cur = n.nodeValue ?? "";
    if (done.get(n) === cur) return;
    original.set(n, cur);
    queue(cur, (v) => { if (n.nodeValue !== v) { done.set(n, v); n.nodeValue = v; } });
  };

  const visitEl = (el: Element) => {
    if (el.closest("[data-no-translate]")) return;
    for (const a of ATTRS) {
      const cur = el.getAttribute(a);
      if (!cur || el.getAttribute(`data-tr-${a}`) === cur) continue;
      const rec = originalAttr.get(el) ?? {};
      rec[a] = cur; originalAttr.set(el, rec);
      queue(cur, (v) => { el.setAttribute(`data-tr-${a}`, v); el.setAttribute(a, v); });
    }
  };

  const walk = (root: Node) => {
    if (root.nodeType === 3) return visitText(root as Text);
    if (root.nodeType !== 1) return;
    const el = root as Element;
    if (el.matches(SKIP) && !el.matches("input,textarea")) return;
    visitEl(el);
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n: Node | null;
    while ((n = tw.nextNode())) n.nodeType === 3 ? visitText(n as Text) : visitEl(n as Element);
  };

  const flush = async () => {
    timer = undefined;
    const batch = pending; pending = [];
    const bySrc = new Map<string, Item[]>();
    for (const it of batch) {
      if (cache[it.src]) { it.apply(cache[it.src]); continue; }
      bySrc.set(it.src, [...(bySrc.get(it.src) ?? []), it]);
    }
    const srcs = [...bySrc.keys()].filter((s) => !inflight.has(s));
    for (let i = 0; i < srcs.length; i += 40) {
      const chunk = srcs.slice(i, i + 40);
      chunk.forEach((s) => inflight.add(s));
      try {
        const { data, error } = await supabase.functions.invoke("translate-texts", { body: { lang, texts: chunk } });
        if (error || !data?.translations) throw error;
        chunk.forEach((s, k) => { cache[s] = data.translations[k]; });
        saveCache();
        if (!stopped) chunk.forEach((s) => bySrc.get(s)?.forEach((it) => it.apply(cache[s])));
      } catch (e) {
        console.warn("translate failed", e);
      } finally {
        chunk.forEach((s) => inflight.delete(s));
      }
    }
    // Items waiting on another in-flight request get retried later.
    const waiting = batch.filter((it) => !cache[it.src] && inflight.has(it.src));
    if (waiting.length && !stopped) { pending.push(...waiting); timer = window.setTimeout(flush, 800); }
  };

  const schedule = () => { if (!timer) timer = window.setTimeout(flush, 120); };

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") visitText(m.target as Text);
      else if (m.type === "attributes") visitEl(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  walk(document.body);
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });

  return () => {
    stopped = true;
    obs.disconnect();
    if (timer) clearTimeout(timer);
  };
}
