import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface Step {
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={className} aria-label="Progreso de configuración">
      {/* Progress bar with percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators - Desktop */}
      <nav className="hidden md:flex items-center justify-between mb-8" aria-label="Pasos">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  index < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                }`}
                aria-current={index === currentStep ? "step" : undefined}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" aria-label="Completado" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </nav>

      {/* Step indicators - Mobile (simplified) */}
      <div className="md:hidden flex items-center gap-2 mb-6" aria-label="Pasos">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= currentStep ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-label={`${step.title}${index === currentStep ? " (actual)" : index < currentStep ? " (completado)" : ""}`}
          />
        ))}
      </div>

      {/* Current step title - Mobile */}
      <div className="md:hidden mb-6">
        <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
        {steps[currentStep].description && (
          <p className="text-sm text-muted-foreground mt-1">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
}
