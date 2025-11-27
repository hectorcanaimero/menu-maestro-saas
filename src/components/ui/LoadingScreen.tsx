import { ChefHat, Loader2, Shield, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface VerificationStep {
  label: string;
  completed: boolean;
}

interface LoadingScreenProps {
  message?: string;
  variant?: "default" | "minimal" | "auth";
  steps?: VerificationStep[];
  currentStep?: string;
}

export function LoadingScreen({
  message = "Cargando...",
  variant = "default",
  steps = [],
  currentStep = ""
}: LoadingScreenProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (variant === "auth") {
    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md px-4"
        >
          {/* Animated Shield Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Shield className="w-16 h-16 mx-auto text-primary" />
          </motion.div>

          {/* Main Message */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          </div>

          {/* Verification Steps */}
          {steps.length > 0 && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 text-left"
                >
                  {step.completed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </motion.div>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={step.completed ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-primary"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <ChefHat className="w-16 h-16 mx-auto animate-pulse text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
