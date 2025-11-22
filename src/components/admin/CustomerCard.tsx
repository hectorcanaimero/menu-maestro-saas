import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, ShoppingCart, DollarSign, Edit, Copy, Calendar } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  order_count?: number;
  total_spent?: number;
}

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onFindDuplicates: (customer: Customer) => void;
}

export const CustomerCard = ({ customer, onEdit, onFindDuplicates }: CustomerCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{customer.name}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {customer.country === "brazil" ? "Brasil" : customer.country}
            </Badge>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs truncate">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs">{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShoppingCart className="w-3 h-3" />
              <span className="text-xs">Pedidos</span>
            </div>
            <p className="text-lg font-bold">{customer.order_count || 0}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-lg font-bold">${(customer.total_spent || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="w-3 h-3" />
          <span>
            Registrado: {new Date(customer.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            className="h-9"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFindDuplicates(customer)}
            className="h-9"
          >
            <Copy className="w-3 h-3 mr-1" />
            Duplicados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};