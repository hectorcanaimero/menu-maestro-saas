import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import CustomersManager from "@/components/admin/CustomersManager";

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserEmail(session.user.email || "");
    };

    checkAuth();
  }, [navigate]);

  if (!userEmail) {
    return null;
  }

  return (
    <AdminLayout userEmail={userEmail}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes de tu tienda, edita su información y fusiona duplicados
          </p>
        </div>
        <CustomersManager />
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
