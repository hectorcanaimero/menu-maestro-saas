import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import { H2, Body } from "@/components/ui/typography";

/**
 * AdminDashboard Component
 *
 * Auth is handled by ProtectedRoute wrapper in App.tsx
 * This component only needs to fetch user email for display
 */
const AdminDashboard = () => {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUserEmail(session.user.email);
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
