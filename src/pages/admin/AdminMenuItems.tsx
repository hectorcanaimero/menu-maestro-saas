import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChefHat } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import MenuItemsManager from "@/components/admin/MenuItemsManager";

const AdminMenuItems = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
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

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        toast.error("Error verificando permisos");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("No tienes permisos de administrador");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="w-16 h-16 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout userEmail={userEmail}>
      <MenuItemsManager />
    </AdminLayout>
  );
};

export default AdminMenuItems;
