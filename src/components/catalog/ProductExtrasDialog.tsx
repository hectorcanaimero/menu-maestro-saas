import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useProductExtraGroups, useUngroupedExtras } from '@/hooks/useExtraGroups';
import {
  validateExtrasSelection,
  getDefaultSelections,
  calculateExtrasTotal,
  getSelectedExtrasDetails,
} from '@/services/extraGroupsService';
import type { ExtrasSelection, GroupedExtras } from '@/types/extras';

interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  group_id?: string | null;
  group_name?: string | null;
}

interface ProductExtrasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productPrice: number;
  onConfirm: (extras: SelectedExtra[]) => void;
}

export const ProductExtrasDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  productPrice,
  onConfirm,
}: ProductExtrasDialogProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch grouped and ungrouped extras
  const { data: groupedExtras, isLoading: loadingGroups } = useProductExtraGroups(productId);
  const { data: ungroupedExtras, isLoading: loadingUngrouped } = useUngroupedExtras(productId);

  const [selection, setSelection] = useState<ExtrasSelection>({});
  const [ungroupedSelection, setUngroupedSelection] = useState<Set<string>>(new Set());

  const loading = loadingGroups || loadingUngrouped;

  // Initialize with default selections when dialog opens
  useEffect(() => {
    if (open && groupedExtras) {
      const defaults = getDefaultSelections(groupedExtras);
      setSelection(defaults);
      setUngroupedSelection(new Set());
    }
  }, [open, groupedExtras]);

  // Validate selection
  const validationResult = useMemo(() => {
    if (!groupedExtras) return { isValid: true, errors: [] };
    return validateExtrasSelection(selection, groupedExtras);
  }, [selection, groupedExtras]);

  // Calculate totals
  const groupedTotal = useMemo(() => {
    if (!groupedExtras) return 0;
    return calculateExtrasTotal(selection, groupedExtras);
  }, [selection, groupedExtras]);

  const ungroupedTotal = useMemo(() => {
    if (!ungroupedExtras) return 0;
    return ungroupedExtras
      .filter((e) => ungroupedSelection.has(e.id))
      .reduce((sum, e) => sum + e.price, 0);
  }, [ungroupedSelection, ungroupedExtras]);

  const totalPrice = productPrice + groupedTotal + ungroupedTotal;

  // Toggle selection for a group
  const toggleGroupSelection = (groupId: string, extraId: string, selectionType: 'single' | 'multiple') => {
    setSelection((prev) => {
      const newSelection = { ...prev };
      const current = newSelection[groupId] || [];

      if (selectionType === 'single') {
        // For single selection, replace with new selection
        newSelection[groupId] = [extraId];
      } else {
        // For multiple selection, toggle
        if (current.includes(extraId)) {
          newSelection[groupId] = current.filter((id) => id !== extraId);
        } else {
          newSelection[groupId] = [...current, extraId];
        }
      }

      return newSelection;
    });
  };

  // Toggle ungrouped extra
  const toggleUngroupedExtra = (extraId: string) => {
    setUngroupedSelection((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(extraId)) {
        newSet.delete(extraId);
      } else {
        newSet.add(extraId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    // Validate before confirming
    if (!validationResult.isValid) {
      return;
    }

    // Get selected extras from groups
    const groupedSelectedExtras = groupedExtras ? getSelectedExtrasDetails(selection, groupedExtras) : [];

    // Get selected ungrouped extras
    const ungroupedSelectedExtras =
      ungroupedExtras
        ?.filter((e) => ungroupedSelection.has(e.id))
        .map((e) => ({
          id: e.id,
          name: e.name,
          price: e.price,
          group_id: null,
          group_name: null,
        })) || [];

    // Combine and confirm
    const allSelectedExtras = [...groupedSelectedExtras, ...ungroupedSelectedExtras];
    onConfirm(allSelectedExtras);
    setSelection({});
    setUngroupedSelection(new Set());
    onOpenChange(false);
  };

  // Check if group is complete (for required groups)
  const isGroupComplete = (group: GroupedExtras): boolean => {
    const selectedCount = (selection[group.group.id] || []).length;
    return selectedCount >= group.group.min_selections;
  };

  // Count completed required groups
  const completedRequiredGroups = useMemo(() => {
    if (!groupedExtras) return 0;
    return groupedExtras.filter((g) => g.group.is_required && isGroupComplete(g)).length;
  }, [groupedExtras, selection]);

  const totalRequiredGroups = useMemo(() => {
    if (!groupedExtras) return 0;
    return groupedExtras.filter((g) => g.group.is_required).length;
  }, [groupedExtras]);

  const Content = () => (
    <>
      {loading ? (
        <div className="flex justify-center py-12 md:py-8">
          <Loader2 className="h-10 w-10 md:h-8 md:w-8 animate-spin text-primary" />
        </div>
      ) : !groupedExtras || (groupedExtras.length === 0 && (!ungroupedExtras || ungroupedExtras.length === 0)) ? (
        <div className="py-12 md:py-8 text-center text-muted-foreground text-base md:text-sm">
          Este producto no tiene extras disponibles
        </div>
      ) : (
        <div className="space-y-6 md:space-y-4">
          {/* Progress indicator for required groups */}
          {totalRequiredGroups > 0 && (
            <Alert className="border-primary/50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {completedRequiredGroups} de {totalRequiredGroups} grupos requeridos completados
              </AlertDescription>
            </Alert>
          )}

          {/* Grouped Extras */}
          {groupedExtras && groupedExtras.length > 0 && (
            <div className="space-y-6 md:space-y-4 px-4 md:px-0">
              {groupedExtras.map((groupedExtra) => {
                const { group, extras } = groupedExtra;
                // Sort extras by display_order to ensure correct ordering
                const sortedExtras = [...extras].sort((a, b) => a.display_order - b.display_order);
                const selectedIds = selection[group.id] || [];
                const groupError = validationResult.errors.find((e) => e.groupId === group.id);
                const isComplete = isGroupComplete(groupedExtra);

                return (
                  <div
                    key={group.id}
                    className={`space-y-3 md:space-y-2 p-4 md:p-3 rounded-lg border-2 transition-colors ${
                      groupError ? 'border-destructive bg-destructive/5' : isComplete ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    {/* Group Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base md:text-sm">
                          {group.name}
                          {group.is_required && <span className="text-destructive ml-1">*</span>}
                        </h4>
                        {isComplete && group.is_required && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      )}
                      {/* Selection hints */}
                      <div className="flex gap-2 flex-wrap">
                        {group.is_required && (
                          <Badge variant="default" className="text-xs">
                            Requerido
                          </Badge>
                        )}
                        {group.min_selections > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Mín: {group.min_selections}
                          </Badge>
                        )}
                        {group.max_selections && (
                          <Badge variant="outline" className="text-xs">
                            Máx: {group.max_selections}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Group Error */}
                    {groupError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">{groupError.message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Extras List */}
                    {group.selection_type === 'single' ? (
                      // Radio buttons for single selection
                      <RadioGroup
                        value={selectedIds[0] || ''}
                        onValueChange={(value) => toggleGroupSelection(group.id, value, 'single')}
                      >
                        <div className="space-y-2">
                          {sortedExtras.map((extra) => (
                            <div
                              key={extra.id}
                              className="flex items-center gap-3 p-3 md:p-2 rounded-md border hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => toggleGroupSelection(group.id, extra.id, 'single')}
                            >
                              <RadioGroupItem value={extra.id} id={extra.id} className="flex-shrink-0 self-center" />
                              <Label
                                htmlFor={extra.id}
                                className="flex-1 cursor-pointer flex justify-between items-center gap-3 py-1"
                              >
                                <span className="text-base md:text-sm font-medium">{extra.name}</span>
                                {extra.price > 0 && (
                                  <span
                                    className="text-base md:text-sm font-semibold whitespace-nowrap"
                                    style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
                                  >
                                    +${extra.price.toFixed(2)}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      // Checkboxes for multiple selection
                      <div className="space-y-2">
                        {sortedExtras.map((extra) => (
                          <div
                            key={extra.id}
                            className="flex items-center gap-3 p-3 md:p-2 rounded-md border hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => toggleGroupSelection(group.id, extra.id, 'multiple')}
                          >
                            <Checkbox
                              id={extra.id}
                              checked={selectedIds.includes(extra.id)}
                              onCheckedChange={() => toggleGroupSelection(group.id, extra.id, 'multiple')}
                              className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 self-center"
                            />
                            <Label
                              htmlFor={extra.id}
                              className="flex-1 cursor-pointer flex justify-between items-center gap-3 py-1"
                            >
                              <span className="text-base md:text-sm font-medium">{extra.name}</span>
                              {extra.price > 0 && (
                                <span
                                  className="text-base md:text-sm font-semibold whitespace-nowrap"
                                  style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
                                >
                                  +${extra.price.toFixed(2)}
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ungrouped Extras (Backward Compatibility) */}
          {ungroupedExtras && ungroupedExtras.length > 0 && (
            <div className="space-y-3 md:space-y-2 px-4 md:px-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base md:text-sm">Extras Adicionales</h4>
                <Badge variant="secondary" className="text-xs">
                  Opcional
                </Badge>
              </div>
              <div className="space-y-2">
                {ungroupedExtras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center gap-3 p-4 md:p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleUngroupedExtra(extra.id)}
                  >
                    <Checkbox
                      id={`ungrouped-${extra.id}`}
                      checked={ungroupedSelection.has(extra.id)}
                      onCheckedChange={() => toggleUngroupedExtra(extra.id)}
                      className="h-5 w-5 md:h-4 md:w-4 self-center"
                    />
                    <Label
                      htmlFor={`ungrouped-${extra.id}`}
                      className="flex-1 cursor-pointer flex justify-between items-center gap-3 py-1"
                    >
                      <span className="text-base md:text-sm font-medium">{extra.name}</span>
                      <span
                        className="text-base md:text-sm font-semibold whitespace-nowrap"
                        style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
                      >
                        +${extra.price.toFixed(2)}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const Footer = () => (
    <div className="bg-background border-t pt-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-2">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Total</p>
          <p
            className="text-xl md:text-lg font-bold"
            style={{ color: `hsl(var(--price-color, var(--foreground)))` }}
          >
            ${totalPrice.toFixed(2)}
          </p>
        </div>
        <Button
          onClick={handleConfirm}
          disabled={loading || !validationResult.isValid}
          className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-medium"
        >
          Agregar al carrito
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="text-lg text-left">Personalizar: {productName}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            <Content />
          </div>

          <div className="mt-auto">
            <Footer />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Personalizar: {productName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <Content />
        </div>

        <div className="mt-auto px-6 pb-6">
          <Footer />
        </div>
      </DialogContent>
    </Dialog>
  );
};
