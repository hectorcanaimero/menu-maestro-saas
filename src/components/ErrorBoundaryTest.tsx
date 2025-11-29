/**
 * ErrorBoundaryTest Component
 *
 * Component for testing error boundaries in development.
 * Throws an error when the button is clicked.
 *
 * Usage:
 * Add this component temporarily to any page/component to test error boundaries:
 *
 * import { ErrorBoundaryTest } from '@/components/ErrorBoundaryTest';
 *
 * <ErrorBoundaryTest />
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error from ErrorBoundaryTest component');
  }

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setShouldThrow(true)}
        variant="destructive"
        size="sm"
        className="shadow-lg"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Test Error Boundary
      </Button>
    </div>
  );
}
