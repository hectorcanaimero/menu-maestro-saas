export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_data: Json
          cart_total: number
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          expires_at: string | null
          id: string
          recovered: boolean | null
          recovered_at: string | null
          recovery_token: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          cart_data: Json
          cart_total: number
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_token?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          cart_data?: Json
          cart_total?: number
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_token?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_enhancement_history: {
        Row: {
          created_at: string | null
          credit_type: string
          enhanced_image_url: string
          id: string
          menu_item_id: string | null
          original_image_url: string
          prompt_used: string | null
          store_id: string
          style: string
        }
        Insert: {
          created_at?: string | null
          credit_type?: string
          enhanced_image_url: string
          id?: string
          menu_item_id?: string | null
          original_image_url: string
          prompt_used?: string | null
          store_id: string
          style: string
        }
        Update: {
          created_at?: string | null
          credit_type?: string
          enhanced_image_url?: string
          id?: string
          menu_item_id?: string | null
          original_image_url?: string
          prompt_used?: string | null
          store_id?: string
          style?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_enhancement_history_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enhancement_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          customer_email: string
          discount_applied: number
          id: string
          order_id: string | null
          store_id: string
          used_at: string | null
        }
        Insert: {
          coupon_id: string
          customer_email: string
          discount_applied: number
          id?: string
          order_id?: string | null
          store_id: string
          used_at?: string | null
        }
        Update: {
          coupon_id?: string
          customer_email?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          store_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          maximum_discount: number | null
          minimum_order_amount: number | null
          name: string
          per_customer_limit: number | null
          start_date: string | null
          store_id: string
          type: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount?: number | null
          minimum_order_amount?: number | null
          name: string
          per_customer_limit?: number | null
          start_date?: string | null
          store_id: string
          type: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount?: number | null
          minimum_order_amount?: number | null
          name?: string
          per_customer_limit?: number | null
          start_date?: string | null
          store_id?: string
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          actual_minutes: number | null
          assigned_at: string | null
          created_at: string | null
          customer_signature_url: string | null
          delivered_at: string | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          distance_km: number | null
          driver_id: string
          estimated_minutes: number | null
          id: string
          order_id: string
          picked_up_at: string | null
          route_polyline: string | null
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          actual_minutes?: number | null
          assigned_at?: string | null
          created_at?: string | null
          customer_signature_url?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          driver_id: string
          estimated_minutes?: number | null
          id?: string
          order_id: string
          picked_up_at?: string | null
          route_polyline?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          actual_minutes?: number | null
          assigned_at?: string | null
          created_at?: string | null
          customer_signature_url?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          distance_km?: number | null
          driver_id?: string
          estimated_minutes?: number | null
          id?: string
          order_id?: string
          picked_up_at?: string | null
          route_polyline?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          delivery_price: number
          display_order: number | null
          id: string
          store_id: string
          zone_name: string
        }
        Insert: {
          created_at?: string | null
          delivery_price?: number
          display_order?: number | null
          id?: string
          store_id: string
          zone_name: string
        }
        Update: {
          created_at?: string | null
          delivery_price?: number
          display_order?: number | null
          id?: string
          store_id?: string
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          email: string | null
          id: string
          is_active: boolean | null
          last_location_update: string | null
          license_plate: string | null
          name: string
          phone: string
          photo_url: string | null
          status: string | null
          store_id: string
          updated_at: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_location_update?: string | null
          license_plate?: string | null
          name: string
          phone: string
          photo_url?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_location_update?: string | null
          license_plate?: string | null
          name?: string
          phone?: string
          photo_url?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          store_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          store_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_extras: {
        Row: {
          created_at: string | null
          extra_name: string
          extra_price: number
          id: string
          order_item_id: string
        }
        Insert: {
          created_at?: string | null
          extra_name: string
          extra_price: number
          id?: string
          order_item_id: string
        }
        Update: {
          created_at?: string | null
          extra_name?: string
          extra_price?: number
          id?: string
          order_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_item_extras_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          menu_item_id: string
          order_id: string
          price_at_time: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          menu_item_id: string
          order_id: string
          price_at_time: number
          quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          menu_item_id?: string
          order_id?: string
          price_at_time?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          store_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          store_id: string
          to_status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          store_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_driver_id: string | null
          calculated_delivery_price: number | null
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_price: number | null
          distance_km: number | null
          estimated_delivery_minutes: number | null
          id: string
          notes: string | null
          order_type: string | null
          payment_method: string | null
          payment_proof_url: string | null
          status: string
          store_id: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_driver_id?: string | null
          calculated_delivery_price?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_price?: number | null
          distance_km?: number | null
          estimated_delivery_minutes?: number | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: string
          store_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_driver_id?: string | null
          calculated_delivery_price?: number | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_price?: number | null
          distance_km?: number | null
          estimated_delivery_minutes?: number | null
          id?: string
          notes?: string | null
          order_type?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          status?: string
          store_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_extras: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          menu_item_id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          menu_item_id: string
          name: string
          price?: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          menu_item_id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_extras_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          category_ids: string[] | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          product_ids: string[] | null
          start_date: string | null
          store_id: string
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_ids?: string[] | null
          start_date?: string | null
          store_id: string
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_ids?: string[] | null
          start_date?: string | null
          store_id?: string
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          id: string
          identifier: string
          identifier_type: string
          is_blocked: boolean | null
          last_attempt: string | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          id?: string
          identifier: string
          identifier_type: string
          is_blocked?: boolean | null
          last_attempt?: string | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          id?: string
          identifier?: string
          identifier_type?: string
          is_blocked?: boolean | null
          last_attempt?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      reserved_subdomains: {
        Row: {
          created_at: string | null
          reason: string
          subdomain: string
        }
        Insert: {
          created_at?: string | null
          reason: string
          subdomain: string
        }
        Update: {
          created_at?: string | null
          reason?: string
          subdomain?: string
        }
        Relationships: []
      }
      store_access_log: {
        Row: {
          access_type: string
          created_at: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          session_id: string | null
          store_id: string | null
          subdomain: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          store_id?: string | null
          subdomain: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          store_id?: string | null
          subdomain?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_access_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_ai_credits: {
        Row: {
          created_at: string | null
          credits_used_this_month: number
          extra_credits: number
          id: string
          last_reset_date: string
          monthly_credits: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_used_this_month?: number
          extra_credits?: number
          id?: string
          last_reset_date?: string
          monthly_credits?: number
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_used_this_month?: number
          extra_credits?: number
          id?: string
          last_reset_date?: string
          monthly_credits?: number
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_ai_credits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_hours: {
        Row: {
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          open_time: string
          store_id: string
        }
        Insert: {
          close_time: string
          created_at?: string | null
          day_of_week: number
          id?: string
          open_time: string
          store_id: string
        }
        Update: {
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          open_time?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accept_cash: boolean | null
          address: string | null
          banner_url: string | null
          base_delivery_price: number | null
          created_at: string | null
          currency: string | null
          decimal_places: number | null
          decimal_separator: string | null
          delivery_price_mode: string | null
          delivery_price_mode_v2: string | null
          description: string | null
          email: string | null
          enable_audio_notifications: boolean | null
          estimated_delivery_time: string | null
          fixed_delivery_price: number | null
          force_status: Database["public"]["Enums"]["force_status"] | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_delivery_distance_km: number | null
          minimum_order_price: number | null
          name: string
          notification_repeat_count: number | null
          notification_volume: number | null
          operating_modes:
            | Database["public"]["Enums"]["operating_mode"][]
            | null
          order_message_template_delivery: string | null
          order_message_template_digital_menu: string | null
          order_message_template_pickup: string | null
          order_product_template: string | null
          owner_id: string
          payment_on_delivery: string | null
          phone: string | null
          price_color: string | null
          price_per_km: number | null
          primary_color: string | null
          redirect_to_whatsapp: boolean | null
          remove_address_number: boolean | null
          remove_zipcode: boolean | null
          require_payment_proof: boolean | null
          skip_payment_digital_menu: boolean | null
          store_address_full: string | null
          store_lat: number | null
          store_lng: number | null
          subdomain: string
          thousands_separator: string | null
          updated_at: string | null
        }
        Insert: {
          accept_cash?: boolean | null
          address?: string | null
          banner_url?: string | null
          base_delivery_price?: number | null
          created_at?: string | null
          currency?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          delivery_price_mode?: string | null
          delivery_price_mode_v2?: string | null
          description?: string | null
          email?: string | null
          enable_audio_notifications?: boolean | null
          estimated_delivery_time?: string | null
          fixed_delivery_price?: number | null
          force_status?: Database["public"]["Enums"]["force_status"] | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_delivery_distance_km?: number | null
          minimum_order_price?: number | null
          name: string
          notification_repeat_count?: number | null
          notification_volume?: number | null
          operating_modes?:
            | Database["public"]["Enums"]["operating_mode"][]
            | null
          order_message_template_delivery?: string | null
          order_message_template_digital_menu?: string | null
          order_message_template_pickup?: string | null
          order_product_template?: string | null
          owner_id: string
          payment_on_delivery?: string | null
          phone?: string | null
          price_color?: string | null
          price_per_km?: number | null
          primary_color?: string | null
          redirect_to_whatsapp?: boolean | null
          remove_address_number?: boolean | null
          remove_zipcode?: boolean | null
          require_payment_proof?: boolean | null
          skip_payment_digital_menu?: boolean | null
          store_address_full?: string | null
          store_lat?: number | null
          store_lng?: number | null
          subdomain: string
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Update: {
          accept_cash?: boolean | null
          address?: string | null
          banner_url?: string | null
          base_delivery_price?: number | null
          created_at?: string | null
          currency?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          delivery_price_mode?: string | null
          delivery_price_mode_v2?: string | null
          description?: string | null
          email?: string | null
          enable_audio_notifications?: boolean | null
          estimated_delivery_time?: string | null
          fixed_delivery_price?: number | null
          force_status?: Database["public"]["Enums"]["force_status"] | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_delivery_distance_km?: number | null
          minimum_order_price?: number | null
          name?: string
          notification_repeat_count?: number | null
          notification_volume?: number | null
          operating_modes?:
            | Database["public"]["Enums"]["operating_mode"][]
            | null
          order_message_template_delivery?: string | null
          order_message_template_digital_menu?: string | null
          order_message_template_pickup?: string | null
          order_product_template?: string | null
          owner_id?: string
          payment_on_delivery?: string | null
          phone?: string | null
          price_color?: string | null
          price_per_km?: number | null
          primary_color?: string | null
          redirect_to_whatsapp?: boolean | null
          remove_address_number?: boolean | null
          remove_zipcode?: boolean | null
          require_payment_proof?: boolean | null
          skip_payment_digital_menu?: boolean | null
          store_address_full?: string | null
          store_lat?: number | null
          store_lng?: number | null
          subdomain?: string
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          image_url: string | null
          message_body: string
          messages_delivered: number | null
          messages_failed: number | null
          messages_sent: number | null
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          store_id: string
          target_audience: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_body: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_sent?: number | null
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          store_id: string
          target_audience?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_body?: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_sent?: number | null
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          store_id?: string
          target_audience?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_credits: {
        Row: {
          created_at: string | null
          credits_used_this_month: number | null
          extra_credits: number | null
          id: string
          last_reset_date: string | null
          monthly_credits: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_used_this_month?: number | null
          extra_credits?: number | null
          id?: string
          last_reset_date?: string | null
          monthly_credits?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_used_this_month?: number | null
          extra_credits?: number | null
          id?: string
          last_reset_date?: string | null
          monthly_credits?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_credits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_body: string
          store_id: string
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_body: string
          store_id: string
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_body?: string
          store_id?: string
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          credit_type: string | null
          customer_name: string | null
          customer_phone: string
          delivered_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          image_url: string | null
          message_content: string
          message_type: string
          order_id: string | null
          read_at: string | null
          sent_at: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          credit_type?: string | null
          customer_name?: string | null
          customer_phone: string
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          image_url?: string | null
          message_content: string
          message_type: string
          order_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          credit_type?: string | null
          customer_name?: string | null
          customer_phone?: string
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          image_url?: string | null
          message_content?: string
          message_type?: string
          order_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          abandoned_cart_delay_minutes: number | null
          auto_abandoned_cart: boolean | null
          auto_order_confirmation: boolean | null
          auto_order_ready: boolean | null
          connected_phone: string | null
          created_at: string | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          id: string
          instance_name: string | null
          is_connected: boolean | null
          is_enabled: boolean | null
          store_id: string
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          abandoned_cart_delay_minutes?: number | null
          auto_abandoned_cart?: boolean | null
          auto_order_confirmation?: boolean | null
          auto_order_ready?: boolean | null
          connected_phone?: string | null
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          is_enabled?: boolean | null
          store_id: string
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          abandoned_cart_delay_minutes?: number | null
          auto_abandoned_cart?: boolean | null
          auto_order_confirmation?: boolean | null
          auto_order_ready?: boolean | null
          connected_phone?: string | null
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          is_enabled?: boolean | null
          store_id?: string
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_status_analytics: {
        Row: {
          avg_minutes_in_status: number | null
          max_minutes_in_status: number | null
          min_minutes_in_status: number | null
          status_count: number | null
          store_id: string | null
          to_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_can_edit_order: {
        Args: { p_order_id: string }
        Returns: {
          can_edit: boolean
          current_status: string
          reason: string
        }[]
      }
      admin_create_order: {
        Args: {
          p_customer_email: string
          p_customer_id: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_address?: string
          p_delivery_price?: number
          p_items: Json
          p_notes?: string
          p_order_type: string
          p_payment_method?: string
          p_store_id: string
          p_total_amount: number
        }
        Returns: {
          error_message: string
          order_id: string
          order_number: string
          success: boolean
        }[]
      }
      admin_update_order: {
        Args: {
          p_customer_email?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_delivery_address?: string
          p_items?: Json
          p_notes?: string
          p_order_id: string
          p_payment_method?: string
          p_recalculate_total?: boolean
          p_status?: string
        }
        Returns: {
          error_message: string
          new_total: number
          success: boolean
        }[]
      }
      assign_driver_to_order: {
        Args: {
          p_distance_km?: number
          p_driver_id: string
          p_estimated_minutes?: number
          p_order_id: string
        }
        Returns: {
          assignment_id: string
          error_message: string
          success: boolean
        }[]
      }
      can_access_admin_routes: {
        Args: { p_store_id?: string }
        Returns: {
          can_access: boolean
          reason: string
          store_id: string
          store_name: string
          user_id: string
        }[]
      }
      check_and_reset_whatsapp_credits: {
        Args: { p_store_id: string }
        Returns: {
          credits_available: number
          credits_used: number
          extra_credits: number
          monthly_credits: number
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_identifier_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: {
          allowed: boolean
          reason: string
          remaining_attempts: number
          reset_at: string
        }[]
      }
      cleanup_old_security_logs: { Args: never; Returns: undefined }
      get_current_user_info: {
        Args: never
        Returns: {
          email: string
          has_admin_role: boolean
          owned_store_id: string
          owned_store_name: string
          user_id: string
        }[]
      }
      get_store_by_subdomain_secure: {
        Args: { p_ip_address?: string; p_subdomain: string }
        Returns: {
          error_message: string
          is_owner: boolean
          rate_limit_ok: boolean
          store_data: Json
          store_id: string
        }[]
      }
      get_suspicious_access_patterns: {
        Args: { p_hours?: number; p_store_id: string }
        Returns: {
          count: number
          details: Json
          pattern_type: string
        }[]
      }
      get_user_owned_store: {
        Args: never
        Returns: {
          address: string
          description: string
          email: string
          force_status: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          operating_mode: string
          phone: string
          subdomain: string
          whatsapp_number: string
          whatsapp_redirect: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_whatsapp_templates: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      log_store_access: {
        Args: {
          p_access_type: string
          p_failure_reason?: string
          p_ip_address?: string
          p_store_id: string
          p_subdomain: string
          p_success: boolean
          p_user_agent?: string
        }
        Returns: string
      }
      update_delivery_status: {
        Args: {
          p_assignment_id: string
          p_customer_signature_url?: string
          p_delivery_notes?: string
          p_delivery_photo_url?: string
          p_status: string
        }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      update_driver_location: {
        Args: {
          p_accuracy?: number
          p_driver_id: string
          p_heading?: number
          p_latitude: number
          p_longitude: number
          p_speed?: number
        }
        Returns: boolean
      }
      use_whatsapp_credit: {
        Args: { p_store_id: string }
        Returns: {
          credit_type: string
          error_message: string
          remaining_credits: number
          success: boolean
        }[]
      }
      user_owns_store: { Args: { target_store_id: string }; Returns: boolean }
      validate_subdomain: {
        Args: { p_subdomain: string }
        Returns: {
          error_message: string
          is_valid: boolean
        }[]
      }
      verify_admin_access: { Args: { p_store_id: string }; Returns: boolean }
      verify_store_ownership: { Args: { p_store_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      force_status: "normal" | "force_open" | "force_closed"
      operating_mode: "delivery" | "pickup" | "digital_menu"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      force_status: ["normal", "force_open", "force_closed"],
      operating_mode: ["delivery", "pickup", "digital_menu"],
    },
  },
} as const
