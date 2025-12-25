/**
 * Extra Groups Service
 *
 * Handles all business logic for grouped product extras including:
 * - Fetching groups for products and categories
 * - Creating, updating, and deleting groups
 * - Validating customer selections against group rules
 * - Managing category-level inheritance
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ExtraGroup,
  ProductExtra,
  GroupedExtras,
  CreateExtraGroupData,
  UpdateExtraGroupData,
  CreateProductExtraData,
  UpdateProductExtraData,
  ExtrasSelection,
  ValidationResult,
  ValidationError,
  ProductGroupOverride,
} from '@/types/extras';

/**
 * Get all extra groups for a specific product
 * Includes both category-level (inherited) and product-specific groups
 * Respects product overrides
 */
export async function getGroupsForProduct(productId: string): Promise<GroupedExtras[]> {
  try {
    // Use the database function that handles inheritance and overrides
    const { data, error } = await supabase.rpc('get_product_extra_groups', {
      p_product_id: productId,
    });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Fetch extras for each group
    const groupIds = data.map((g: any) => g.id);
    const { data: extrasData, error: extrasError } = await supabase
      .from('product_extras')
      .select('*')
      .in('group_id', groupIds)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (extrasError) throw extrasError;

    // Combine groups with their extras
    const groupedExtras: GroupedExtras[] = data
      .filter((g: any) => g.is_enabled) // Only include enabled groups
      .map((group: any) => ({
        group: {
          id: group.id,
          store_id: group.store_id,
          category_id: group.category_id,
          name: group.name,
          description: group.description,
          selection_type: group.selection_type,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          display_order: group.display_order,
          is_active: group.is_active,
        } as ExtraGroup,
        extras: (extrasData || []).filter((e) => e.group_id === group.id),
        source: group.source as 'category' | 'product',
        is_enabled: group.is_enabled,
      }))
      .filter((ge) => ge.extras.length > 0); // Remove empty groups

    return groupedExtras;
  } catch (error) {
    console.error('Error fetching groups for product:', error);
    throw error;
  }
}

/**
 * Get ungrouped extras for a product (backward compatibility)
 */
export async function getUngroupedExtras(productId: string): Promise<ProductExtra[]> {
  try {
    const { data, error } = await supabase
      .from('product_extras')
      .select('*')
      .eq('menu_item_id', productId)
      .is('group_id', null)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching ungrouped extras:', error);
    throw error;
  }
}

/**
 * Get all extra groups for a category
 */
export async function getGroupsForCategory(categoryId: string): Promise<ExtraGroup[]> {
  try {
    const { data, error } = await supabase
      .from('extra_groups')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching groups for category:', error);
    throw error;
  }
}

/**
 * Get all extra groups for a store
 */
export async function getGroupsForStore(storeId: string): Promise<ExtraGroup[]> {
  try {
    const { data, error } = await supabase
      .from('extra_groups')
      .select('*')
      .eq('store_id', storeId)
      .order('category_id', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching groups for store:', error);
    throw error;
  }
}

/**
 * Create a new extra group
 */
export async function createGroup(data: CreateExtraGroupData): Promise<ExtraGroup> {
  try {
    const { data: group, error } = await supabase
      .from('extra_groups')
      .insert([
        {
          store_id: data.store_id,
          category_id: data.category_id || null,
          name: data.name,
          description: data.description || null,
          selection_type: data.selection_type,
          is_required: data.is_required ?? false,
          min_selections: data.min_selections ?? 0,
          max_selections: data.max_selections ?? null,
          display_order: data.display_order ?? 0,
          is_active: data.is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return group;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Update an existing extra group
 */
export async function updateGroup(groupId: string, data: UpdateExtraGroupData): Promise<ExtraGroup> {
  try {
    const { data: group, error } = await supabase
      .from('extra_groups')
      .update(data)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return group;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
}

/**
 * Delete an extra group
 * Note: This will also delete all extras in the group due to CASCADE
 */
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const { error } = await supabase.from('extra_groups').delete().eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

/**
 * Create a new product extra within a group
 */
export async function createExtra(data: CreateProductExtraData): Promise<ProductExtra> {
  try {
    const { data: extra, error } = await supabase
      .from('product_extras')
      .insert([
        {
          menu_item_id: data.menu_item_id || null,
          group_id: data.group_id || null,
          name: data.name,
          price: data.price,
          is_available: data.is_available ?? true,
          is_default: data.is_default ?? false,
          display_order: data.display_order ?? 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return extra;
  } catch (error) {
    console.error('Error creating extra:', error);
    throw error;
  }
}

/**
 * Update an existing product extra
 */
export async function updateExtra(extraId: string, data: UpdateProductExtraData): Promise<ProductExtra> {
  try {
    const { data: extra, error } = await supabase
      .from('product_extras')
      .update(data)
      .eq('id', extraId)
      .select()
      .single();

    if (error) throw error;
    return extra;
  } catch (error) {
    console.error('Error updating extra:', error);
    throw error;
  }
}

/**
 * Delete a product extra
 */
export async function deleteExtra(extraId: string): Promise<void> {
  try {
    const { error } = await supabase.from('product_extras').delete().eq('id', extraId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting extra:', error);
    throw error;
  }
}

/**
 * Get product group overrides
 */
export async function getProductOverrides(productId: string): Promise<ProductGroupOverride[]> {
  try {
    const { data, error } = await supabase
      .from('product_group_overrides')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching product overrides:', error);
    throw error;
  }
}

/**
 * Set product group override (enable/disable a category group for a product)
 */
export async function setProductOverride(
  productId: string,
  groupId: string,
  isEnabled: boolean
): Promise<ProductGroupOverride> {
  try {
    const { data, error } = await supabase
      .from('product_group_overrides')
      .upsert(
        {
          product_id: productId,
          group_id: groupId,
          is_enabled: isEnabled,
        },
        { onConflict: 'product_id,group_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting product override:', error);
    throw error;
  }
}

/**
 * Validate customer's extras selection against group rules
 * Returns validation result with any errors
 */
export function validateExtrasSelection(
  selection: ExtrasSelection,
  groups: GroupedExtras[]
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const groupedExtra of groups) {
    const { group, extras } = groupedExtra;
    const selectedIds = selection[group.id] || [];
    const selectedCount = selectedIds.length;

    // Check if required group has selections
    if (group.is_required && selectedCount < group.min_selections) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message:
          group.min_selections === 1
            ? `Debes seleccionar una opción`
            : `Debes seleccionar al menos ${group.min_selections} opciones`,
      });
      continue;
    }

    // Check minimum selections
    if (selectedCount > 0 && selectedCount < group.min_selections) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `Debes seleccionar al menos ${group.min_selections} opciones`,
      });
      continue;
    }

    // Check maximum selections
    if (group.max_selections && selectedCount > group.max_selections) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `No puedes seleccionar más de ${group.max_selections} opciones`,
      });
      continue;
    }

    // For single selection, ensure only one is selected
    if (group.selection_type === 'single' && selectedCount > 1) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `Solo puedes seleccionar una opción`,
      });
      continue;
    }

    // Validate that selected IDs exist in the extras list
    const validExtraIds = new Set(extras.map((e) => e.id));
    const invalidSelections = selectedIds.filter((id) => !validExtraIds.has(id));
    if (invalidSelections.length > 0) {
      errors.push({
        groupId: group.id,
        groupName: group.name,
        message: `Selección inválida detectada`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get default selections for groups (extras marked as is_default)
 */
export function getDefaultSelections(groups: GroupedExtras[]): ExtrasSelection {
  const selection: ExtrasSelection = {};

  for (const groupedExtra of groups) {
    const { group, extras } = groupedExtra;
    const defaultExtras = extras.filter((e) => e.is_default);

    if (defaultExtras.length > 0) {
      if (group.selection_type === 'single') {
        // For single selection, only take the first default
        selection[group.id] = [defaultExtras[0].id];
      } else {
        // For multiple selection, take all defaults (up to max_selections)
        const maxDefaults = group.max_selections || defaultExtras.length;
        selection[group.id] = defaultExtras.slice(0, maxDefaults).map((e) => e.id);
      }
    } else {
      selection[group.id] = [];
    }
  }

  return selection;
}

/**
 * Calculate total price for selected extras
 */
export function calculateExtrasTotal(selection: ExtrasSelection, groups: GroupedExtras[]): number {
  let total = 0;

  for (const groupedExtra of groups) {
    const { group, extras } = groupedExtra;
    const selectedIds = selection[group.id] || [];

    for (const extraId of selectedIds) {
      const extra = extras.find((e) => e.id === extraId);
      if (extra) {
        total += extra.price;
      }
    }
  }

  return total;
}

/**
 * Get extras details from selection (for cart and order)
 */
export function getSelectedExtrasDetails(
  selection: ExtrasSelection,
  groups: GroupedExtras[]
): Array<{ id: string; name: string; price: number; group_id: string; group_name: string }> {
  const selectedExtras: Array<{ id: string; name: string; price: number; group_id: string; group_name: string }> = [];

  for (const groupedExtra of groups) {
    const { group, extras } = groupedExtra;
    const selectedIds = selection[group.id] || [];

    for (const extraId of selectedIds) {
      const extra = extras.find((e) => e.id === extraId);
      if (extra) {
        selectedExtras.push({
          id: extra.id,
          name: extra.name,
          price: extra.price,
          group_id: group.id,
          group_name: group.name,
        });
      }
    }
  }

  return selectedExtras;
}
