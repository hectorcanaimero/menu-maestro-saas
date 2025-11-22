import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Star, Pencil, Trash2, Settings } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  display_order: number | null;
}

interface MenuItemCardProps {
  item: MenuItem;
  categoryName: string;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onManageExtras: (item: MenuItem) => void;
}

export const MenuItemCard = ({ item, categoryName, onEdit, onDelete, onManageExtras }: MenuItemCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Image */}
          <div className="flex-shrink-0">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Featured */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              {item.is_featured && (
                <Star className="w-4 h-4 text-amber-600 fill-amber-600 flex-shrink-0" />
              )}
            </div>

            {/* Category & Price */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{categoryName}</span>
              <span className="font-bold text-base">${item.price.toFixed(2)}</span>
            </div>

            {/* Status */}
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                item.is_available
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              }`}>
                {item.is_available ? "Disponible" : "No disponible"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageExtras(item)}
                className="h-8 flex-1"
              >
                <Settings className="w-3 h-3 mr-1" />
                Extras
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="h-8 px-2"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="h-8 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};