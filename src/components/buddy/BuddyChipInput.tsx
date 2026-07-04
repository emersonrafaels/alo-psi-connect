import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  suggestions?: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
};

export function BuddyChipInput({ suggestions = [], value, onChange, placeholder = "Adicionar...", max }: Props) {
  const [input, setInput] = useState("");
  const toggle = (t: string) => {
    if (value.includes(t)) onChange(value.filter((v) => v !== t));
    else if (!max || value.length < max) onChange([...value, t]);
  };
  const add = () => {
    const t = input.trim();
    if (!t) return;
    if (!value.includes(t) && (!max || value.length < max)) onChange([...value, t]);
    setInput("");
  };
  return (
    <div className="space-y-3 min-w-0 max-w-full">
      {value.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-sm shadow-sm animate-in fade-in zoom-in-95 [overflow-wrap:anywhere]">
              <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{t}</span>
              <button type="button" onClick={() => toggle(t)} className="shrink-0 rounded-full hover:bg-primary-foreground/20 p-0.5" aria-label={`Remover ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-2">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "max-w-full px-3 py-1.5 rounded-full text-sm border transition-all hover:scale-[1.02] text-left whitespace-normal [overflow-wrap:anywhere]",
                "bg-card hover:bg-primary/10 border-border/70 text-foreground/80"
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex min-w-0 flex-col min-[420px]:flex-row gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-9 min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex min-h-9 w-full min-[420px]:w-auto shrink-0 items-center justify-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-3 text-sm"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
