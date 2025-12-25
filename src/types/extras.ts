/**
 * Types for the Grouped Product Extras System
 *
 * This file defines TypeScript interfaces for managing product extras
 * organized into groups with validation rules and category-level inheritance.
 */

export type SelectionType = 'single' | 'multiple';

/**
 * ExtraGroup represents a collection of related extras
 * Can be category-level (inherited by all products) or product-specific
 */
export interface ExtraGroup {
  id: string;
  store_id: string;
  category_id: string | null; // null = product-specific group
  name: string;
  description?: string | null;
  selection_type: SelectionType; // 'single' for radio buttons, 'multiple' for checkboxes
  is_required: boolean; // Must customer select at least min_selections?
  min_selections: number; // Minimum number of extras to select
  max_selections?: number | null; // Maximum number of extras to select (null = unlimited)
  display_order: number; // Order in which groups appear
  is_active: boolean; // Is this group currently active?
  created_at?: string;
  updated_at?: string;
}

/**
 * ProductExtra represents an individual extra option
 * Now belongs to a group (or ungrouped for backward compatibility)
 */
export interface ProductExtra {
  id: string;
  menu_item_id?: string | null; // For backward compat with ungrouped extras
  group_id?: string | null; // null = ungrouped (legacy)
  name: string;
  price: number;
  is_available: boolean | null;
  is_default: boolean; // Should this be pre-selected?
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * GroupedExtras combines a group with its extras
 * Used for rendering and validation
 */
export interface GroupedExtras {
  group: ExtraGroup;
  extras: ProductExtra[];
  source?: 'category' | 'product'; // Where did this group come from?
  is_enabled?: boolean; // Is this group enabled for the product? (from overrides)
}

/**
 * ProductGroupOverride allows products to disable category-level groups
 */
export interface ProductGroupOverride {
  id: string;
  product_id: string;
  group_id: string;
  is_enabled: boolean;
  created_at?: string;
}

/**
 * ExtrasSelection tracks user's selections in the ProductExtrasDialog
 * Maps group ID to array of selected extra IDs
 */
export interface ExtrasSelection {
  [groupId: string]: string[]; // group_id -> array of selected extra IDs
}

/**
 * ValidationError for a specific group
 */
export interface ValidationError {
  groupId: string;
  groupName: string;
  message: string;
}

/**
 * ValidationResult contains all validation errors
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * CreateExtraGroupData for creating new groups
 */
export interface CreateExtraGroupData {
  store_id: string;
  category_id?: string | null;
  name: string;
  description?: string;
  selection_type: SelectionType;
  is_required?: boolean;
  min_selections?: number;
  max_selections?: number | null;
  display_order?: number;
  is_active?: boolean;
}

/**
 * UpdateExtraGroupData for updating existing groups
 */
export interface UpdateExtraGroupData {
  name?: string;
  description?: string;
  selection_type?: SelectionType;
  is_required?: boolean;
  min_selections?: number;
  max_selections?: number | null;
  display_order?: number;
  is_active?: boolean;
}

/**
 * CreateProductExtraData for creating new extras within a group
 */
export interface CreateProductExtraData {
  menu_item_id?: string | null;
  group_id?: string | null;
  name: string;
  price: number;
  is_available?: boolean;
  is_default?: boolean;
  display_order?: number;
}

/**
 * UpdateProductExtraData for updating existing extras
 */
export interface UpdateProductExtraData {
  name?: string;
  price?: number;
  is_available?: boolean;
  is_default?: boolean;
  display_order?: number;
}

/**
 * CartExtra - How extras are stored in the cart
 * Simplified version for cart persistence
 */
export interface CartExtra {
  id: string;
  name: string;
  price: number;
  group_id?: string | null; // Track which group this came from
  group_name?: string | null; // For display purposes
}

/**
 * Helper type for database query results
 */
export interface ExtraGroupWithExtras extends ExtraGroup {
  product_extras?: ProductExtra[];
  source?: 'category' | 'product';
  is_enabled?: boolean;
}
