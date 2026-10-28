import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Header from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, Send, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import buddyImg from "@/assets/buddy-main.png";

class SafeRender extends React.Component<
  { fallback: (error: Error, reset: () => void) => React.ReactNode; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("[BuddyInstitutionChat] render error", error); }
  reset = () => this.setState({ error: null });
  render() { return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children; }
}

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; consulting?: boolean };
const TOOL_MARK = "[[CONSULTANDO]]";

const mdComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) =>
    href?.startsWith("/") ? <Link to={href} className="text-primary underline underline-offset-2">{children}</Link>
      : <a href={href} target="_blank" rel="noreferrer">{children}</a>,
};

const SUGGESTIONS = [
  "Quantos alunos estão Sinal elevado hoje?",
  "Como está o humor médio nos últimos 15 dias comparado ao período anterior?",
  "Qual curso ou unidade merece mais atenção nas escalas?",
  "Quantos follow-ups estão vencidos e o que você sugere?",
];

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/buddy-institution-chat`;

export default function BuddyInstitutionChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } catch { /* ignore */ }
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const history: Msg[] = [...messages.filter((m) => !m.error), { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const setLast = (fn: (m: Msg) => Msg) =>
      setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch(FN_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Não consegui responder agora.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const [rawAnswer, err] = acc.split("[[ERRO]]");
        const consulting = rawAnswer.endsWith(TOOL_MARK);
        const answer = rawAnswer.split(TOOL_MARK).join("");
        setLast(() => ({ role: "assistant", content: (err ? err.trim() : answer).trim() || answer, error: !!err, consulting }));
      }
    } catch (e: any) {
      if (e?.name === "AbortError") setLast((m) => ({ ...m, content: m.content || "Resposta interrompida." }));
      else setLast(() => ({ role: "assistant", content: e?.message || "Erro ao responder.", error: true }));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-4">
          <Button asChild variant="ghost" size="icon" aria-label="Voltar">
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <img src={buddyImg} alt="Buddy" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Buddy da instituição</h1>
            <p className="text-sm text-muted-foreground">Pergunte sobre o bem-estar dos seus alunos.</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground mb-4">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          O Buddy usa apenas indicadores agregados e anonimizados. Alunos nunca são identificados e grupos com menos de 10 respondentes ficam ocultos.
        </div>

        <SafeRender fallback={(_e, reset) => (
          <Card className="p-4 text-sm space-y-3">
            <p className="text-foreground">Não consegui mostrar a resposta.</p>
            <Button size="sm" variant="outline" onClick={() => { setMessages([]); reset(); }}>Tentar de novo</Button>
          </Card>
        )}>
        <div className="flex-1 space-y-4 pb-4" aria-live="polite" translate="no">
          {messages.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <Card key={s} role="button" tabIndex={0} onClick={() => send(s)}
                  onKeyDown={(e) => e.key === "Enter" && send(s)}
                  className="p-3 text-sm cursor-pointer hover:border-primary/40 transition-colors">
                  {s}
                </Card>
              ))}
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground whitespace-pre-wrap">{m.content}</div>
              </div>
            ) : (
              <div key={i} className={`text-sm leading-relaxed ${m.error ? "text-destructive" : "text-foreground"}`}>
                {m.content ? (
                  <SafeRender key={`${i}-${loading && i === messages.length - 1 ? "s" : "d"}`}
                    fallback={() => <p className="whitespace-pre-wrap">{m.content}</p>}>
                    {loading && i === messages.length - 1 ? (
                      <p className="whitespace-pre-wrap"><span>{m.content}</span></p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown components={mdComponents as any}>{m.content}</ReactMarkdown></div>
                    )}
                  </SafeRender>
                ) : null}
                {loading && i === messages.length - 1 && (m.consulting || !m.content) && (
                  <span className="inline-flex gap-1 text-muted-foreground">{m.consulting ? "Consultando dados" : "Buddy está analisando os dados"}<span className="animate-pulse">…</span></span>
                )}
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
        </SafeRender>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="sticky bottom-4 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
            placeholder="Ex.: Como está a ansiedade média no curso de Medicina?"
            className="border-0 resize-none focus-visible:ring-0 shadow-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
          <div className="flex justify-end">
            {loading ? (
              <Button type="button" size="icon" variant="outline" onClick={() => abortRef.current?.abort()} aria-label="Parar">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
