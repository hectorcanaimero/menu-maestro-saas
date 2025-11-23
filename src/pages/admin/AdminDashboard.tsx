import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";

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
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bienvenido al panel de administración
          </p>
        </div>
        <DashboardStats />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
