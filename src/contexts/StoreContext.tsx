import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Store {
  id: string;
  subdomain: string;
  name: string;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  operating_modes: Array<"delivery" | "pickup" | "digital_menu"> | null;
  force_status: "normal" | "force_open" | "force_closed" | null;
  currency: string | null;
  decimal_places: number | null;
  decimal_separator: string | null;
  thousands_separator: string | null;
  accept_cash: boolean | null;
  payment_on_delivery: string | null;
  require_payment_proof: boolean | null;
  minimum_order_price: number | null;
  redirect_to_whatsapp: boolean | null;
  order_product_template: string | null;
  order_message_template_delivery: string | null;
  order_message_template_pickup: string | null;
  order_message_template_digital_menu: string | null;
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  isStoreOwner: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStoreOwner, setIsStoreOwner] = useState(false);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      // Extract subdomain from hostname
      const hostname = window.location.hostname;
      const parts = hostname.split(".");

      // For development: if localhost, use a default subdomain or check localStorage
      let subdomain = localStorage.getItem("dev_subdomain") || "totus";

      // For production: extract subdomain (e.g., tienda1.pideai.com -> tienda1)
      if (hostname.includes("pideai.com") && parts.length >= 3) {
        subdomain = parts[0];
      }

      // Fetch store by subdomain
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error loading store:", error);
        setStore(null);
      } else {
        setStore(data);

        // Check if current user is the store owner
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsStoreOwner(session?.user?.id === data.owner_id);
      }
    } catch (error) {
      console.error("Error in loadStore:", error);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  return <StoreContext.Provider value={{ store, loading, isStoreOwner }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
