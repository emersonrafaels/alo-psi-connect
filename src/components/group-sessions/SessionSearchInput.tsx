import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SessionSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SessionSearchInput = ({
  value,
  onChange,
  placeholder = "Buscar por tema ou descrição..."
}: SessionSearchInputProps) => {
  return (
    <div className="relative max-w-md mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
};