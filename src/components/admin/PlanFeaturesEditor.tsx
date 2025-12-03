/**
 * PlanFeaturesEditor Component
 *
 * Interactive editor for selecting plan features
 * Organized by categories with search and filtering
 */

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AVAILABLE_FEATURES,
  getAllCategories,
  getCategoryLabel,
  getFeaturesByCategory,
  FeatureCategory,
} from '@/lib/planFeatures';
import { Search, CheckCircle2, Circle } from 'lucide-react';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PlanFeaturesEditorProps {
  selectedFeatures: string[];
  onChange: (features: string[]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlanFeaturesEditor({ selectedFeatures, onChange }: PlanFeaturesEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter features based on search
  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) return AVAILABLE_FEATURES;

    const query = searchQuery.toLowerCase();
    return AVAILABLE_FEATURES.filter(
      (feature) =>
        feature.label.toLowerCase().includes(query) ||
        feature.description.toLowerCase().includes(query) ||
        feature.key.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered features by category
  const featuresByCategory = useMemo(() => {
    const categories = getAllCategories();
    return categories.map((category) => ({
      category,
      label: getCategoryLabel(category),
      features: filteredFeatures.filter((f) => f.category === category),
    }));
  }, [filteredFeatures]);

  // Toggle feature selection
  const toggleFeature = (featureKey: string) => {
    if (selectedFeatures.includes(featureKey)) {
      onChange(selectedFeatures.filter((key) => key !== featureKey));
    } else {
      onChange([...selectedFeatures, featureKey]);
    }
  };

  // Toggle all features in a category
  const toggleCategory = (category: FeatureCategory) => {
    const categoryFeatures = getFeaturesByCategory(category).map((f) => f.key);
    const allSelected = categoryFeatures.every((key) => selectedFeatures.includes(key));

    if (allSelected) {
      // Deselect all from category
      onChange(selectedFeatures.filter((key) => !categoryFeatures.includes(key)));
    } else {
      // Select all from category
      const newSelection = [...selectedFeatures];
      categoryFeatures.forEach((key) => {
        if (!newSelection.includes(key)) {
          newSelection.push(key);
        }
      });
      onChange(newSelection);
    }
  };

  // Check if all features in category are selected
  const isCategoryFullySelected = (category: FeatureCategory): boolean => {
    const categoryFeatures = getFeaturesByCategory(category).map((f) => f.key);
    return (
      categoryFeatures.length > 0 &&
      categoryFeatures.every((key) => selectedFeatures.includes(key))
    );
  };

  // Check if some (but not all) features in category are selected
  const isCategoryPartiallySelected = (category: FeatureCategory): boolean => {
    const categoryFeatures = getFeaturesByCategory(category).map((f) => f.key);
    const selectedCount = categoryFeatures.filter((key) => selectedFeatures.includes(key)).length;
    return selectedCount > 0 && selectedCount < categoryFeatures.length;
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar características..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Count Badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedFeatures.length} de {AVAILABLE_FEATURES.length} características seleccionadas
        </span>
        {selectedFeatures.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-destructive hover:underline"
          >
            Limpiar todas
          </button>
        )}
      </div>

      {/* Features by Category */}
      <ScrollArea className="h-[400px] pr-4">
        <Accordion type="multiple" defaultValue={getAllCategories()} className="space-y-2">
          {featuresByCategory.map(({ category, label, features }) => {
            if (features.length === 0) return null;

            const fullySelected = isCategoryFullySelected(category);
            const partiallySelected = isCategoryPartiallySelected(category);

            return (
              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category);
                        }}
                        className="hover:bg-accent rounded p-1 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCategory(category);
                          }
                        }}
                      >
                        {fullySelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : partiallySelected ? (
                          <Circle className="h-5 w-5 text-primary fill-primary opacity-50" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                    <Badge variant="secondary">{features.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  {features.map((feature) => {
                    const isSelected = selectedFeatures.includes(feature.key);

                    return (
                      <div
                        key={feature.key}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => toggleFeature(feature.key)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFeature(feature.key)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{feature.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {feature.key}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* No results message */}
        {filteredFeatures.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No se encontraron características</p>
            <p className="text-sm">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </ScrollArea>

      {/* Selected Features Summary (collapsed view) */}
      {selectedFeatures.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Características seleccionadas:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFeatures.map((key) => {
              const feature = AVAILABLE_FEATURES.find((f) => f.key === key);
              if (!feature) return null;

              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => toggleFeature(key)}
                >
                  {feature.label}
                  <span className="ml-1">×</span>
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
