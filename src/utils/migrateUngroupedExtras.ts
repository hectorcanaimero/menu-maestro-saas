/**
 * Migration Utility for Ungrouped Extras
 *
 * Helps migrate existing ungrouped extras to the new grouped system
 * Creates default "Extras" groups for products and moves ungrouped extras into them
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProductExtra, ExtraGroup } from '@/types/extras';

interface MigrationResult {
  success: boolean;
  productsMigrated: number;
  groupsCreated: number;
  extrasUpdated: number;
  errors: Array<{ productId: string; error: string }>;
}

/**
 * Migrate all ungrouped extras for a specific store
 * Creates a default "Extras" group for each product with ungrouped extras
 */
export async function migrateStoreUngroupedExtras(storeId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    productsMigrated: 0,
    groupsCreated: 0,
    extrasUpdated: 0,
    errors: [],
  };

  try {
    // Step 1: Find all ungrouped extras for this store
    const { data: ungroupedExtras, error: fetchError } = await supabase
      .from('product_extras')
      .select(
        `
        id,
        menu_item_id,
        menu_items!inner(id, store_id)
      `
      )
      .is('group_id', null)
      .eq('menu_items.store_id', storeId);

    if (fetchError) throw fetchError;

    if (!ungroupedExtras || ungroupedExtras.length === 0) {
      result.success = true;
      return result;
    }

    // Step 2: Group extras by product
    const extrasByProduct = new Map<string, string[]>();
    ungroupedExtras.forEach((extra: any) => {
      const productId = extra.menu_item_id;
      if (!extrasByProduct.has(productId)) {
        extrasByProduct.set(productId, []);
      }
      extrasByProduct.get(productId)!.push(extra.id);
    });

    // Step 3: For each product, create a default group and update extras
    for (const [productId, extraIds] of extrasByProduct.entries()) {
      try {
        // Create default "Extras" group for this product
        const { data: newGroup, error: groupError } = await supabase
          .from('extra_groups')
          .insert([
            {
              store_id: storeId,
              category_id: null, // product-specific
              name: 'Extras',
              description: 'Extras adicionales para este producto',
              selection_type: 'multiple',
              is_required: false,
              min_selections: 0,
              max_selections: null,
              display_order: 999, // Put at end
              is_active: true,
            },
          ])
          .select()
          .single();

        if (groupError) throw groupError;

        result.groupsCreated++;

        // Update all ungrouped extras to belong to this new group
        const { error: updateError } = await supabase
          .from('product_extras')
          .update({ group_id: newGroup.id })
          .in('id', extraIds);

        if (updateError) throw updateError;

        result.extrasUpdated += extraIds.length;
        result.productsMigrated++;
      } catch (error) {
        console.error(`Error migrating product ${productId}:`, error);
        result.errors.push({
          productId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    console.error('Error in migrateStoreUngroupedExtras:', error);
    result.success = false;
    return result;
  }
}

/**
 * Migrate ungrouped extras for a specific product
 * Creates a default "Extras" group for the product
 */
export async function migrateProductUngroupedExtras(productId: string, storeId: string): Promise<boolean> {
  try {
    // Step 1: Find ungrouped extras for this product
    const { data: ungroupedExtras, error: fetchError } = await supabase
      .from('product_extras')
      .select('id')
      .eq('menu_item_id', productId)
      .is('group_id', null);

    if (fetchError) throw fetchError;

    if (!ungroupedExtras || ungroupedExtras.length === 0) {
      return true; // Nothing to migrate
    }

    // Step 2: Create default "Extras" group
    const { data: newGroup, error: groupError } = await supabase
      .from('extra_groups')
      .insert([
        {
          store_id: storeId,
          category_id: null,
          name: 'Extras',
          description: 'Extras adicionales',
          selection_type: 'multiple',
          is_required: false,
          min_selections: 0,
          max_selections: null,
          display_order: 999,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (groupError) throw groupError;

    // Step 3: Update extras to belong to new group
    const extraIds = ungroupedExtras.map((e) => e.id);
    const { error: updateError } = await supabase
      .from('product_extras')
      .update({ group_id: newGroup.id })
      .in('id', extraIds);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error in migrateProductUngroupedExtras:', error);
    return false;
  }
}

/**
 * Get count of ungrouped extras for a store
 */
export async function countUngroupedExtras(storeId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('product_extras')
      .select('id', { count: 'exact', head: true })
      .is('group_id', null)
      .eq('menu_items.store_id', storeId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting ungrouped extras:', error);
    return 0;
  }
}

/**
 * Get products with ungrouped extras
 */
export async function getProductsWithUngroupedExtras(storeId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('product_extras')
      .select(
        `
        menu_item_id,
        menu_items!inner(id, store_id)
      `
      )
      .is('group_id', null)
      .eq('menu_items.store_id', storeId);

    if (error) throw error;

    if (!data) return [];

    // Get unique product IDs
    const productIds = new Set(data.map((item: any) => item.menu_item_id));
    return Array.from(productIds);
  } catch (error) {
    console.error('Error getting products with ungrouped extras:', error);
    return [];
  }
}
