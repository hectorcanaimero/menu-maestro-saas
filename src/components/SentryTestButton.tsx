/**
 * Sentry Test Button Component
 *
 * This component is for TESTING ONLY.
 * Use it to verify Sentry integration is working correctly.
 * Remove or disable this component in production.
 */

import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

export const SentryTestButton = () => {
  const testError = () => {
    try {
      // Intentionally throw an error to test Sentry
      throw new Error("Test Error: Sentry Integration Test");
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error);
      toast.error("Error enviado a Sentry! Revisa tu dashboard.");
    }
  };

  const testMessage = () => {
    Sentry.captureMessage("Test Message from Sentry Test Button", "info");
    toast.success("Mensaje enviado a Sentry!");
  };

  const testPerformance = async () => {
    const transaction = Sentry.startTransaction({
      name: "Test Performance Transaction",
      op: "test",
    });

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    transaction.finish();
    toast.success("Performance transaction enviado a Sentry!");
  };

  const testBreadcrumb = () => {
    Sentry.addBreadcrumb({
      category: "test",
      message: "Test breadcrumb from Sentry Test Button",
      level: "info",
    });
    toast.success("Breadcrumb agregado! Generará un error para verlo...");

    // Throw an error to see the breadcrumb
    setTimeout(() => {
      try {
        throw new Error("Error to show breadcrumb");
      } catch (error) {
        Sentry.captureException(error);
      }
    }, 1000);
  };

  // Note: User Feedback widget removed - using Chatwoot for support
  // See src/pages/admin/AdminDashboard.tsx for Chatwoot integration

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-bold text-sm mb-2">🧪 Sentry Tests</h3>
      <div className="flex flex-col gap-2">
        <Button onClick={testError} variant="destructive" size="sm">
          Test Error
        </Button>
        <Button onClick={testMessage} variant="secondary" size="sm">
          Test Message
        </Button>
        <Button onClick={testPerformance} variant="secondary" size="sm">
          Test Performance
        </Button>
        <Button onClick={testBreadcrumb} variant="secondary" size="sm">
          Test Breadcrumb
        </Button>
      </div>
    </div>
  );
};
