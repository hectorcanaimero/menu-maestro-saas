import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  percentage: number;
}

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (!password) {
    return { score: 0, label: "Muy débil", color: "bg-red-500", percentage: 0 };
  }

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
  if (/\d/.test(password)) score++; // Has number
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Has special char

  // Cap at 4
  score = Math.min(score, 4);

  const levels = [
    { score: 0, label: "Muy débil", color: "bg-red-500", percentage: 0 },
    { score: 1, label: "Débil", color: "bg-orange-500", percentage: 25 },
    { score: 2, label: "Regular", color: "bg-yellow-500", percentage: 50 },
    { score: 3, label: "Fuerte", color: "bg-blue-500", percentage: 75 },
    { score: 4, label: "Muy fuerte", color: "bg-green-500", percentage: 100 },
  ];

  return levels[score];
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password);

  // Requirements
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Una mayúscula", met: /[A-Z]/.test(password) },
    { label: "Una minúscula", met: /[a-z]/.test(password) },
    { label: "Un número", met: /\d/.test(password) },
  ];

  if (!password) {
    return null;
  }

  return (
    <div className={className} id="password-strength" aria-live="polite">
      <div className="space-y-2">
        {/* Strength bar */}
        <div className="flex items-center gap-2">
          <Progress
            value={strength.percentage}
            className="h-2 flex-1"
            indicatorClassName={strength.color}
          />
          <span className="text-xs font-medium min-w-[80px] text-right">
            {strength.label}
          </span>
        </div>

        {/* Requirements checklist */}
        <ul className="space-y-1" aria-label="Requisitos de contraseña">
          {requirements.map((req, index) => (
            <li
              key={index}
              className={`flex items-center gap-2 text-xs transition-colors ${
                req.met ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {req.met ? (
                <CheckCircle2 className="h-3 w-3" aria-label="Cumplido" />
              ) : (
                <Circle className="h-3 w-3" aria-label="Pendiente" />
              )}
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
