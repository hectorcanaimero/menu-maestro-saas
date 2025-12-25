import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Store } from 'lucide-react';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS = [
  { title: 'Crear Cuenta', description: 'Email y contraseña' },
  { title: 'Información Personal', description: 'Tus datos' },
  { title: 'Tu Negocio', description: 'Información de la empresa' },
  { title: 'Subdominio', description: 'URL de tu tienda' },
];

export const OnboardingLayout = ({ children, currentStep, title, description }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
            <ProgressSteps steps={ONBOARDING_STEPS} currentStep={currentStep} className="mt-6" />
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};
