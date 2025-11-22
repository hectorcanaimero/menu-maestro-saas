import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ReportsManager from "@/components/admin/ReportsManager";

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || "");
      setLoading(false);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="w-16 h-16 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Cargando informes...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout userEmail={userEmail}>
      <ReportsManager />
    </AdminLayout>
  );
};

export default AdminReports;