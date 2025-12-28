/**
 * React Query hooks for Extra Groups
 *
 * Provides data fetching and mutation hooks for managing extra groups
 * with automatic caching and invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as extraGroupsService from '@/services/extraGroupsService';
import type {
  ExtraGroup,
  GroupedExtras,
  CreateExtraGroupData,
  UpdateExtraGroupData,
  CreateProductExtraData,
  UpdateProductExtraData,
} from '@/types/extras';

// Query keys
export const extraGroupsKeys = {
  all: ['extra-groups'] as const,
  forStore: (storeId: string) => ['extra-groups', 'store', storeId] as const,
  forCategory: (categoryId: string) => ['extra-groups', 'category', categoryId] as const,
  forProduct: (productId: string) => ['extra-groups', 'product', productId] as const,
  ungrouped: (productId: string) => ['extra-groups', 'ungrouped', productId] as const,
  overrides: (productId: string) => ['extra-groups', 'overrides', productId] as const,
};

/**
 * Hook to fetch all extra groups for a store
 */
export function useStoreExtraGroups(storeId: string | undefined) {
  return useQuery({
    queryKey: extraGroupsKeys.forStore(storeId || ''),
    queryFn: () => extraGroupsService.getGroupsForStore(storeId!),
    enabled: !!storeId,
  });
}

/**
 * Hook to fetch extra groups for a category
 */
export function useCategoryExtraGroups(categoryId: string | undefined) {
  return useQuery({
    queryKey: extraGroupsKeys.forCategory(categoryId || ''),
    queryFn: () => extraGroupsService.getGroupsForCategory(categoryId!),
    enabled: !!categoryId,
  });
}

/**
 * Hook to fetch grouped extras for a product
 * This is the main hook used by ProductExtrasDialog
 */
export function useProductExtraGroups(productId: string | undefined) {
  return useQuery({
    queryKey: extraGroupsKeys.forProduct(productId || ''),
    queryFn: () => extraGroupsService.getGroupsForProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch ungrouped extras for a product (backward compatibility)
 */
export function useUngroupedExtras(productId: string | undefined) {
  return useQuery({
    queryKey: extraGroupsKeys.ungrouped(productId || ''),
    queryFn: () => extraGroupsService.getUngroupedExtras(productId!),
    enabled: !!productId,
  });
}

/**
 * Hook to fetch product group overrides
 */
export function useProductOverrides(productId: string | undefined) {
  return useQuery({
    queryKey: extraGroupsKeys.overrides(productId || ''),
    queryFn: () => extraGroupsService.getProductOverrides(productId!),
    enabled: !!productId,
  });
}

/**
 * Hook to create a new extra group
 */
export function useCreateExtraGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateExtraGroupData) => extraGroupsService.createGroup(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.forStore(variables.store_id) });
      if (variables.category_id) {
        queryClient.invalidateQueries({ queryKey: extraGroupsKeys.forCategory(variables.category_id) });
      }
      toast({
        title: 'Grupo creado',
        description: 'El grupo de extras ha sido creado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el grupo de extras',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an existing extra group
 */
export function useUpdateExtraGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateExtraGroupData }) =>
      extraGroupsService.updateGroup(groupId, data),
    onSuccess: () => {
      // Invalidate all group queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Grupo actualizado',
        description: 'El grupo de extras ha sido actualizado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el grupo de extras',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an extra group
 */
export function useDeleteExtraGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (groupId: string) => extraGroupsService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Grupo eliminado',
        description: 'El grupo de extras ha sido eliminado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el grupo de extras',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create a new product extra
 */
export function useCreateProductExtra() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateProductExtraData) => extraGroupsService.createExtra(data),
    onSuccess: (_, variables) => {
      // Invalidate product groups if this extra has a group_id
      if (variables.group_id) {
        queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      }
      // Invalidate ungrouped extras if this is ungrouped
      if (variables.menu_item_id && !variables.group_id) {
        queryClient.invalidateQueries({ queryKey: extraGroupsKeys.ungrouped(variables.menu_item_id) });
      }
      toast({
        title: 'Extra creado',
        description: 'El extra ha sido creado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error creating extra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el extra',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update a product extra
 */
export function useUpdateProductExtra() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ extraId, data }: { extraId: string; data: UpdateProductExtraData }) =>
      extraGroupsService.updateExtra(extraId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Extra actualizado',
        description: 'El extra ha sido actualizado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error updating extra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el extra',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a product extra
 */
export function useDeleteProductExtra() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (extraId: string) => extraGroupsService.deleteExtra(extraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Extra eliminado',
        description: 'El extra ha sido eliminado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting extra:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el extra',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to set a product group override
 */
export function useSetProductOverride() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ productId, groupId, isEnabled }: { productId: string; groupId: string; isEnabled: boolean }) =>
      extraGroupsService.setProductOverride(productId, groupId, isEnabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.forProduct(variables.productId) });
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.overrides(variables.productId) });
      toast({
        title: variables.isEnabled ? 'Grupo habilitado' : 'Grupo deshabilitado',
        description: `El grupo ha sido ${variables.isEnabled ? 'habilitado' : 'deshabilitado'} para este producto`,
      });
    },
    onError: (error) => {
      console.error('Error setting override:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración del grupo',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reorder extra groups
 * Updates display_order for multiple groups in batch
 */
export function useReorderExtraGroups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groups: { id: string; display_order: number }[]) => {
      return extraGroupsService.reorderGroups(groups);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Orden actualizado',
        description: 'El orden de los grupos ha sido guardado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error reordering groups:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el orden de los grupos',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to reorder product extras within a group
 * Updates display_order for multiple extras in batch
 */
export function useReorderProductExtras() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (extras: { id: string; display_order: number }[]) => {
      return extraGroupsService.reorderExtras(extras);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extraGroupsKeys.all });
      toast({
        title: 'Orden actualizado',
        description: 'El orden de los extras ha sido guardado exitosamente',
      });
    },
    onError: (error) => {
      console.error('Error reordering extras:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el orden de los extras',
        variant: 'destructive',
      });
    },
  });
}
