import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import { H2, Body } from "@/components/ui/typography";
import { useChatwoot } from "@/hooks/useChatwoot";
import { useStore } from "@/contexts/StoreContext";

/**
 * AdminDashboard Component
 *
 * Auth is handled by ProtectedRoute wrapper in App.tsx
 * This component only needs to fetch user email for display
 */
const AdminDashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const { store } = useStore();

  // Initialize Chatwoot widget for admin support
  const chatwoot = useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: true,
    position: 'right',
    locale: 'es',
  });

  useEffect(() => {
    getUserEmail();
  }, [store]); // Re-run when store is loaded

  const getUserEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUserEmail(session.user.email);

      // Identify user in Chatwoot for better support
      if (chatwoot && session.user) {
        chatwoot.setUser(session.user.id, {
          email: session.user.email,
          name: store?.name || session.user.user_metadata?.name || session.user.email,
        });

        // Add context attributes
        chatwoot.setCustomAttributes({
          user_type: 'store_admin',
          role: 'admin',
          store_name: store?.name || 'Unknown Store',
          logged_in_at: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <AdminLayout userEmail={userEmail}>
      <div className="space-y-4 sm:space-y-6 max-w-7xl">
        <div>
          <H2 className="text-xl sm:text-2xl">Dashboard</H2>
          <Body className="text-muted-foreground text-sm sm:text-base">
            Bienvenido al panel de administración
          </Body>
        </div>
        <DashboardStats />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
