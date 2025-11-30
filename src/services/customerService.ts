/**
 * Customer Service
 *
 * Handles all customer-related business logic including:
 * - Finding existing customers
 * - Creating new customers
 * - Updating customer information
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  country?: string;
}

export interface FindOrCreateCustomerResult {
  customerId: string;
  isNew: boolean;
}

/**
 * Find existing customer by email
 */
export async function findCustomerByEmail(email: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, country')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error finding customer:', error);
    return null;
  }

  return data;
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: CustomerData): Promise<string | null> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || null,
      country: customerData.country || 'brazil',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating customer:', error);

    // Check if it's a duplicate email error
    if (error.code === '23505') {
      toast.error('Este email ya está registrado con información diferente');
    } else {
      toast.error('Error al registrar cliente');
    }

    return null;
  }

  return data.id;
}

/**
 * Update existing customer information
 */
export async function updateCustomer(
  customerId: string,
  customerData: CustomerData
): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      phone: customerData.phone || null,
      country: customerData.country || 'brazil',
    })
    .eq('id', customerId);

  if (error) {
    console.error('Error updating customer:', error);
    toast.error('Error al actualizar información del cliente');
    return false;
  }

  toast.info('Información del cliente actualizada');
  return true;
}

/**
 * Check if customer data needs update
 */
export function needsUpdate(
  existingCustomer: { name: string; phone: string | null; country: string | null },
  newData: CustomerData
): boolean {
  return (
    existingCustomer.name !== newData.name ||
    existingCustomer.phone !== newData.phone ||
    existingCustomer.country !== (newData.country || 'brazil')
  );
}

/**
 * Find or create customer
 *
 * This is the main function that orchestrates finding an existing customer
 * or creating a new one, and updating their information if needed
 */
export async function findOrCreateCustomer(
  customerData: CustomerData
): Promise<FindOrCreateCustomerResult | null> {
  // Try to find existing customer by email
  const existingCustomer = await findCustomerByEmail(customerData.email);

  if (existingCustomer) {
    // Customer exists - update their information if changed
    if (needsUpdate(existingCustomer, customerData)) {
      const updated = await updateCustomer(existingCustomer.id, customerData);
      if (!updated) {
        return null;
      }
    }

    return {
      customerId: existingCustomer.id,
      isNew: false,
    };
  }

  // Create new customer
  const customerId = await createCustomer(customerData);
  if (!customerId) {
    return null;
  }

  return {
    customerId,
    isNew: true,
  };
}
