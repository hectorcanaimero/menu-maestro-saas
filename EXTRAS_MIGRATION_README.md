# Product Extras Restructuring - Migration Guide

## Overview
This guide explains how to apply the database migration for the new grouped extras system (PIDEA-47).

## What's New

The product extras system has been restructured from a flat list to a hierarchical grouped system with the following features:

✅ **Grouped Extras**: Organize extras into logical groups (e.g., "Tamaño", "Ingredientes", "Color")
✅ **Validation Rules**: Set min/max selections, required/optional groups
✅ **Selection Types**: Single-select (radio) or multi-select (checkbox) per group
✅ **Category Inheritance**: Create groups at category level that apply to all products
✅ **Product Overrides**: Disable specific category groups for individual products
✅ **Backward Compatibility**: Existing ungrouped extras continue working

## Files Created/Modified

### Phase 1: Database
- `supabase_migration_extras_groups.sql` - Complete migration script

### Phase 2: Services & Types
- `src/types/extras.ts` - TypeScript interfaces
- `src/services/extraGroupsService.ts` - Business logic
- `src/hooks/useExtraGroups.ts` - React Query hooks

### Phase 3: Admin UI
- `src/components/admin/ExtraGroupsManager.tsx` - Manage groups

### Phase 4: Customer UI
- `src/components/catalog/ProductExtrasDialog.tsx` - Refactored with validation

### Phase 5: Migration Utility
- `src/utils/migrateUngroupedExtras.ts` - Migrate existing extras

## Step-by-Step Migration

### Step 1: Apply Database Migration

**IMPORTANT**: Run this during low-traffic period and backup your database first.

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire contents of `supabase_migration_extras_groups.sql`
4. Paste and execute the SQL

The migration will:
- Create `extra_groups` table
- Create `product_group_overrides` table
- Add `group_id` and `is_default` columns to `product_extras`
- Create indexes and RLS policies
- Add a helper function `get_product_extra_groups`

### Step 2: Verify Migration

Run this query to verify the migration succeeded:

```sql
-- Check that new tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('extra_groups', 'product_group_overrides');

-- Check that new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_extras'
AND column_name IN ('group_id', 'is_default');

-- Check that function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_product_extra_groups';
```

Expected results:
- 2 rows for tables
- 2 rows for columns
- 1 row for function

### Step 3: Deploy Code Changes

The code is already implemented and backward compatible. Deploy to production:

```bash
npm run build
# Deploy to your hosting platform
```

### Step 4: Test in Production

1. Navigate to admin panel
2. Go to a product with extras
3. Verify ungrouped extras still work (should show in "Extras Adicionales" section)
4. Create a new group using the ExtraGroupsManager
5. Add extras to the group
6. Test customer-facing dialog with validation

### Step 5: Migrate Existing Extras (Optional)

If you want to convert ungrouped extras to groups, you have two options:

**Option A: Manual Migration via UI**
- Admin will see badge "Sin Agrupar" for ungrouped extras
- Click "Migrate to Groups" button (when we implement it in ProductExtrasManager)

**Option B: Programmatic Migration**
- Use the migration utility in console:

```typescript
import { migrateStoreUngroupedExtras } from '@/utils/migrateUngroupedExtras';

// For a specific store
const result = await migrateStoreUngroupedExtras('store-id-here');
console.log(result);
// {
//   success: true,
//   productsMigrated: 10,
//   groupsCreated: 10,
//   extrasUpdated: 50,
//   errors: []
// }
```

## Feature Usage

### Creating Extra Groups

1. Go to Admin → Extra Groups
2. Click "Crear Grupo"
3. Fill in group details:
   - **Name**: e.g., "Tamaño", "Ingredientes"
   - **Description**: Brief explanation (optional)
   - **Selection Type**: Single (radio) or Multiple (checkbox)
   - **Required**: Must customer select this?
   - **Min/Max Selections**: e.g., "Select 1-3 toppings"
   - **Display Order**: Sort order (lower = first)
4. Click "Crear Grupo"
5. Add extras to the group using "Gestionar Extras"
6. Assign the group to products or categories using "Asignar a Productos"

### Assigning Groups to Products or Categories

After creating a group and adding extras to it, you need to assign it:

1. Click "Asignar a Productos" on the group card
2. Choose assignment mode using tabs:

**Por Categoría (By Category):**
- Select one category from the list
- The group will automatically apply to ALL products in that category
- More efficient for consistent extras across a product line
- Example: All pizzas need "Tamaño" and "Ingredientes" groups

**Por Productos (By Products):**
- Search and select individual products
- Use checkboxes to select multiple products
- The group will only apply to the selected products
- Example: Only premium burgers get "Extra Toppings" group

3. Click "Guardar Asignación"

**Important Notes:**
- A group can be assigned to EITHER a category OR specific products, not both
- If you switch from category to products mode, the category assignment will be removed
- Category-level assignments are more maintainable for large catalogs

### Examples

**Pizza Store:**
```
Category: "Pizzas"
Groups:
  - Tamaño (single, required): Pequeña, Mediana, Grande
  - Ingredientes (multiple, 0-5): Pepperoni, Jamón, Champiñones, etc.
  - Borde (single, optional): Normal, Relleno de queso
  - Masa (single, required): Delgada, Gruesa
```

**Cell Phone Store:**
```
Product: "iPhone 15"
Groups:
  - Color (single, required): Blanco, Negro, Azul
  - Capacidad (single, required): 128GB, 256GB, 512GB
  - Accesorios (multiple, optional): Case, Screen Protector, Charger
```

## Backward Compatibility

✅ **Existing ungrouped extras continue to work**
✅ **No breaking changes to orders**
✅ **Customer UI shows ungrouped extras in separate section**
✅ **Can mix grouped and ungrouped extras on same product**

## Troubleshooting

### "Function get_product_extra_groups does not exist"
- Migration wasn't applied correctly
- Re-run the SQL migration

### "Column group_id does not exist"
- Migration wasn't applied to product_extras table
- Re-run the migration

### "Extras not showing in dialog"
- Check browser console for errors
- Verify extras have `is_available = true`
- Check that groups have `is_active = true`

### "Validation not working"
- Check group settings (min/max, required)
- Verify selection type matches (single vs multiple)
- Check browser console for validation errors

## Rollback Plan

If you need to rollback the migration:

```sql
-- WARNING: This will delete all groups and reset extras
-- Only use in emergency

-- Remove group_id from extras (makes them ungrouped again)
UPDATE product_extras SET group_id = NULL;

-- Drop new tables
DROP TABLE IF EXISTS product_group_overrides CASCADE;
DROP TABLE IF EXISTS extra_groups CASCADE;

-- Drop new columns (optional, doesn't break anything to keep them)
ALTER TABLE product_extras DROP COLUMN IF EXISTS group_id;
ALTER TABLE product_extras DROP COLUMN IF EXISTS is_default;

-- Drop function
DROP FUNCTION IF EXISTS get_product_extra_groups;
```

## Support

For issues or questions about this feature:
1. Check console errors first
2. Review this README
3. Check the implementation plan: `/Users/al3jandro/.claude/plans/jiggly-napping-octopus.md`
4. Contact development team

## Timeline

This feature was implemented as PIDEA-47 on 2025-12-24.

**Phases Completed:**
- ✅ Phase 1: Database Migration
- ✅ Phase 2: Backend Services & Hooks
- ✅ Phase 3: Admin UI (ExtraGroupsManager)
- ✅ Phase 4: Customer UI (ProductExtrasDialog refactor)
- ✅ Phase 5: Migration Utility

**Pending (Future Work):**
- ProductExtrasManager refactor to show grouped view
- Category extras management tab
- Migration button in admin UI
- Comprehensive testing suite
