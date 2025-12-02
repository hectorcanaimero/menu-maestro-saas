import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { SubscriptionManager } from '@/components/admin/SubscriptionManager';
import { H2, Body } from '@/components/ui/typography';

const AdminSubscription = () => {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }
  };

  return (
    <AdminLayout userEmail={userEmail}>
      <div className="space-y-4 sm:space-y-6 max-w-7xl">
        <div>
          <H2 className="text-xl sm:text-2xl">Suscripción y Facturación</H2>
          <Body className="text-muted-foreground text-sm sm:text-base">
            Gestiona tu plan, módulos, créditos y pagos
          </Body>
        </div>
        <SubscriptionManager />
      </div>
    </AdminLayout>
  );
};

export default AdminSubscription;
