import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, X, User, RefreshCw } from "lucide-react";

/**
 * Demo component to control Chatwoot widget programmatically
 * This is for demonstration purposes only - remove in production
 */
export const ChatwootControl = () => {
  const handleOpen = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
    } else {
      console.warn('Chatwoot not loaded yet');
    }
  };

  const handleClose = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('close');
    }
  };

  const handleSetUser = () => {
    if (window.$chatwoot) {
      window.$chatwoot.setUser('demo-user-123', {
        email: 'demo@example.com',
        name: 'Demo User',
        phone_number: '+1234567890',
      });
      console.log('User set successfully');
    }
  };

  const handleSetAttributes = () => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes({
        store_name: 'Test Store',
        subscription: 'premium',
        last_order: new Date().toISOString(),
      });
      console.log('Custom attributes set');
    }
  };

  const handleReset = () => {
    if (window.$chatwoot) {
      window.$chatwoot.reset();
      console.log('Chatwoot reset');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chatwoot Control Panel
        </CardTitle>
        <CardDescription>
          Demo controls for testing Chatwoot widget functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Button onClick={handleOpen} className="flex-1" variant="default">
            <MessageCircle className="mr-2 h-4 w-4" />
            Open Widget
          </Button>
          <Button onClick={handleClose} className="flex-1" variant="outline">
            <X className="mr-2 h-4 w-4" />
            Close Widget
          </Button>
        </div>

        <Button onClick={handleSetUser} className="w-full" variant="secondary">
          <User className="mr-2 h-4 w-4" />
          Set Demo User
        </Button>

        <Button onClick={handleSetAttributes} className="w-full" variant="secondary">
          Set Custom Attributes
        </Button>

        <Button onClick={handleReset} className="w-full" variant="destructive">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Widget
        </Button>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="mb-2 font-semibold">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open widget to start a conversation</li>
            <li>Set user info to identify customers</li>
            <li>Custom attributes provide context to support</li>
            <li>Reset clears all data and state</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
