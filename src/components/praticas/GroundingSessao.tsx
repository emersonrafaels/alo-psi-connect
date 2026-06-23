import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  largeLabels?: boolean;
  /** Modo: observar, marcar itens (checkbox local) ou escrever palavras. */
  modo?: "observar" | "marcar itens" | "escrever palavras";
  onConcluir?: () => void;
}

const PASSOS = [
  { numero: 5, sentido: "coisas que você vê", emoji: "👁️" },
  { numero: 4, sentido: "coisas que você toca ou sente", emoji: "✋" },
  { numero: 3, sentido: "sons que você ouve", emoji: "👂" },
  { numero: 2, sentido: "cheiros ao seu redor", emoji: "👃" },
  { numero: 1, sentido: "sabor na boca", emoji: "👅" },
];

export const GroundingSessao = ({ largeLabels = false, modo = "observar", onConcluir }: Props) => {
  const [idx, setIdx] = useState(0);
  const [marcados, setMarcados] = useState<boolean[]>([]);
  const [texto, setTexto] = useState("");
  const passo = PASSOS[idx];

  const proximo = () => {
    if (idx >= PASSOS.length - 1) {
      onConcluir?.();
      return;
    }
    setIdx(idx + 1);
    setMarcados([]);
    setTexto("");
  };

  const titleClass = largeLabels
    ? "font-serif text-5xl sm:text-7xl tracking-wide font-semibold drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]"
    : "font-serif text-3xl sm:text-5xl tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]";

  return (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-md" style={{ minHeight: "min(22rem, 42vh)" }}>
      <div className="flex items-center gap-1.5 mb-6">
        {PASSOS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-all ${
              i < idx ? "bg-primary-foreground/90" : i === idx ? "bg-primary-foreground/70" : "bg-primary-foreground/20"
            }`}
          />
        ))}
      </div>
      <p className="text-6xl mb-4" aria-hidden>{passo.emoji}</p>
      <h2 className={titleClass}>{passo.numero}</h2>
      <p className="mt-3 text-base sm:text-lg opacity-90 max-w-xs">{passo.sentido}</p>

      {modo === "marcar itens" && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: passo.numero }).map((_, i) => {
            const on = marcados[i];
            return (
              <button
                key={i}
                onClick={() => {
                  const copy = [...marcados];
                  copy[i] = !on;
                  setMarcados(copy);
                }}
                className={`h-10 w-10 rounded-full border-2 transition-all ${
                  on ? "bg-primary-foreground/90 border-primary-foreground" : "border-primary-foreground/40"
                }`}
                aria-label={`Item ${i + 1}`}
              />
            );
          })}
        </div>
      )}

      {modo === "escrever palavras" && (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Escreva ${passo.numero} ${passo.sentido}...`}
          className="mt-6 w-full max-w-sm bg-white/10 border border-primary-foreground/30 rounded-xl p-3 text-sm placeholder:text-primary-foreground/50 text-primary-foreground resize-none"
          rows={3}
        />
      )}

      <Button
        onClick={proximo}
        size="lg"
        variant="secondary"
        className="mt-8 rounded-full px-8"
      >
        {idx >= PASSOS.length - 1 ? "Concluir" : "Próximo"}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};
