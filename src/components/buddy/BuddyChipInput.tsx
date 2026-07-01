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
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-sm shadow-sm animate-in fade-in zoom-in-95">
              {t}
              <button type="button" onClick={() => toggle(t)} className="rounded-full hover:bg-primary-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all hover:scale-[1.02]",
                "bg-card hover:bg-primary/10 border-border/70 text-foreground/80"
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-9"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-3 text-sm"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
