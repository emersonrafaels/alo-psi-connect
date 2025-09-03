import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(requirements).forEach(req => {
      if (req) score++;
    });

    return { score, requirements };
  };

  const { score, requirements } = getPasswordStrength(password);
  
  const getStrengthText = () => {
    if (score <= 2) return "Fraca";
    if (score <= 3) return "Média";
    if (score <= 4) return "Forte";
    return "Muito forte";
  };

  const getStrengthColor = () => {
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Força da senha:</span>
        <span className={cn("text-sm font-medium", {
          "text-red-500": score <= 2,
          "text-yellow-500": score === 3,
          "text-blue-500": score === 4,
          "text-green-500": score === 5,
        })}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full",
              score >= level ? getStrengthColor() : "bg-muted"
            )}
          />
        ))}
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className={cn("flex items-center gap-1", requirements.length && "text-green-600")}>
          <span>{requirements.length ? "✓" : "○"}</span>
          <span>Pelo menos 8 caracteres</span>
        </div>
        <div className={cn("flex items-center gap-1", requirements.uppercase && "text-green-600")}>
          <span>{requirements.uppercase ? "✓" : "○"}</span>
          <span>Uma letra maiúscula</span>
        </div>
        <div className={cn("flex items-center gap-1", requirements.lowercase && "text-green-600")}>
          <span>{requirements.lowercase ? "✓" : "○"}</span>
          <span>Uma letra minúscula</span>
        </div>
        <div className={cn("flex items-center gap-1", requirements.number && "text-green-600")}>
          <span>{requirements.number ? "✓" : "○"}</span>
          <span>Um número</span>
        </div>
        <div className={cn("flex items-center gap-1", requirements.special && "text-green-600")}>
          <span>{requirements.special ? "✓" : "○"}</span>
          <span>Um caractere especial</span>
        </div>
      </div>
    </div>
  );
};