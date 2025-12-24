import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Package, RefreshCw, Eye, Filter, Download, ExternalLink, FileImage, X, Plus, Edit, Truck, Store, Utensils, UserPlus } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { AdminOrderCreate } from "./AdminOrderCreate";
import { AdminOrderEdit } from "./AdminOrderEdit";
import { DriverAssignmentDialog } from "./DriverAssignmentDialog";
import { useModuleAccess } from "@/hooks/useSubscription";

interface OrderItemExtra {
  id: string;
  extra_name: string;
  extra_price: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  item_name: string;
  order_item_extras: OrderItemExtra[];
}

interface Order {
  id: string;
  status: string;
  order_type: string | null;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items: OrderItem[];
}

const OrdersManager = () => {
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Admin order management
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);

  // Driver assignment
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [selectedOrderForDriver, setSelectedOrderForDriver] = useState<Order | null>(null);

  // Check if delivery module is enabled
  const { data: hasDeliveryModule } = useModuleAccess('delivery');
  const showDriverFeatures = hasDeliveryModule === true;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (store?.id) {
      fetchOrders();
    }
  }, [store?.id]);

  const fetchOrders = async () => {
    if (!store?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            order_item_extras (*)
          )
        `)
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
      setFilteredOrders((data || []) as Order[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(order => order.order_type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.customer_phone?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.delivery_address?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, orders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Estado actualizado");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error al actualizar estado");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      preparing: { label: "Preparando", variant: "default" },
      ready: { label: "Listo", variant: "default" },
      delivered: { label: "Entregado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderTypeConfig = (type: string) => {
    const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
      delivery: {
        label: "Entrega",
        icon: Truck,
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300"
      },
      pickup: {
        label: "Recoger",
        icon: Store,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300"
      },
      dine_in: {
        label: "Servicio en Mesa",
        icon: Utensils,
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300"
      },
      digital_menu: {
        label: "En Tienda",
        icon: Utensils,
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300"
      }
    };
    return typeConfig[type] || typeConfig.pickup;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleEditOrder = (orderId: string) => {
    setEditOrderId(orderId);
    setEditOrderOpen(true);
  };

  const handleAssignDriver = (order: Order) => {
    setSelectedOrderForDriver(order);
    setDriverDialogOpen(true);
  };

  const handleOrderCreatedOrEdited = () => {
    fetchOrders(); // Refresh orders list
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Count active filters
  const activeFiltersCount = [
    statusFilter !== "all",
    typeFilter !== "all",
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  if (loading) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  return (
    <>
      <AdminOrderCreate
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        onSuccess={handleOrderCreatedOrEdited}
      />

      <AdminOrderEdit
        open={editOrderOpen}
        onOpenChange={setEditOrderOpen}
        orderId={editOrderId}
        onSuccess={handleOrderCreatedOrEdited}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestión de Pedidos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={() => setCreateOrderOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Pedido
              </Button>
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters - Progressive Disclosure */}
          <div className="space-y-4 mb-6">
            {/* Search bar and filter button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Buscar pedidos por cliente, email, teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-11 md:h-10 text-base md:text-sm"
              />

              <div className="flex gap-2">
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-11 md:h-10 whitespace-nowrap"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="absolute z-10 mt-2 right-0 w-full sm:w-auto">
                    <Card className="shadow-lg border-2 min-w-[320px]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Filtrar Pedidos</CardTitle>
                          {activeFiltersCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFilters}
                              className="h-8 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Limpiar
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-4">
                        <div className="space-y-2">
                          <Label htmlFor="status-filter" className="text-sm font-medium">
                            Estado
                          </Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="status-filter" className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="preparing">Preparando</SelectItem>
                              <SelectItem value="ready">Listo</SelectItem>
                              <SelectItem value="delivered">Entregado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type-filter" className="text-sm font-medium">
                            Tipo de Pedido
                          </Label>
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger id="type-filter" className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="delivery">Entrega</SelectItem>
                              <SelectItem value="pickup">Recoger</SelectItem>
                              <SelectItem value="dine_in">Servicio en Mesa</SelectItem>
                              <SelectItem value="digital_menu">En Tienda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Resultados:</span>
                            <span className="font-medium">
                              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

          {/* Orders Grid/Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? "No hay pedidos aún" : "No se encontraron pedidos con los filtros aplicados"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid gap-4 md:hidden">
                {currentOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Comprobante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrders.map((order) => {
                      const orderTypeConfig = getOrderTypeConfig(order.order_type || 'pickup');
                      const OrderTypeIcon = orderTypeConfig.icon;

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`flex items-center gap-1 w-fit ${orderTypeConfig.color}`}>
                              <OrderTypeIcon className="w-3 h-3" />
                              {orderTypeConfig.label}
                            </Badge>
                          </TableCell>
                        <TableCell className="font-medium">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {order.payment_proof_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => order.payment_proof_url && window.open(order.payment_proof_url, '_blank')}
                              className="h-8 px-2"
                            >
                              <FileImage className="w-4 h-4 text-primary" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="preparing">Preparando</SelectItem>
                              <SelectItem value="ready">Listo</SelectItem>
                              <SelectItem value="delivered">Entregado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            <br />
                            <span className="text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.order_type === 'delivery' && showDriverFeatures && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignDriver(order)}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Motorista
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(order.id)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => goToPage(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => goToPage(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Pedido</p>
                  <div className="mt-1">
                    {(() => {
                      const config = getOrderTypeConfig(selectedOrder.order_type || 'pickup');
                      const Icon = config.icon;
                      return (
                        <Badge variant="outline" className={`${config.color} flex items-center gap-1 w-fit`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="mt-1">
                    {new Date(selectedOrder.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                  <p className="mt-1">
                    {new Date(selectedOrder.updated_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-3">Información del Cliente</h4>
                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p>{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedOrder.customer_email}</p>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p>{selectedOrder.customer_phone}</p>
                    </div>
                  )}
                  {selectedOrder.delivery_address && selectedOrder.order_type === 'delivery' && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Dirección de Entrega</p>
                      </div>
                      <p className="text-orange-800 dark:text-orange-200">{selectedOrder.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Productos</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.quantity}x {item.item_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price_at_time.toFixed(2)} c/u
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.price_at_time * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      {item.order_item_extras && item.order_item_extras.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Extras:</p>
                          {item.order_item_extras.map((extra) => (
                            <div key={extra.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">+ {extra.extra_name}</span>
                              <span>${extra.extra_price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h4 className="font-semibold mb-3">Información de Pago</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  {selectedOrder.payment_method && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Método de Pago</p>
                      <p>{selectedOrder.payment_method}</p>
                    </div>
                  )}
                  {selectedOrder.payment_proof_url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Comprobante de Pago</p>
                      <div className="space-y-3">
                        {/* Preview if it's an image */}
                        {(selectedOrder.payment_proof_url.includes('.jpg') || 
                          selectedOrder.payment_proof_url.includes('.jpeg') || 
                          selectedOrder.payment_proof_url.includes('.png') || 
                          selectedOrder.payment_proof_url.includes('.webp')) && (
                          <div className="relative border rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={selectedOrder.payment_proof_url} 
                              alt="Comprobante de pago"
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedOrder.payment_proof_url, '_blank')}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver completo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedOrder.payment_proof_url!;
                              link.download = `comprobante-${selectedOrder.id.slice(0, 8)}.jpg`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast.success("Descargando comprobante...");
                            }}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg text-primary">
                        ${selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-3">Notas del Cliente</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Driver Assignment Dialog */}
      {selectedOrderForDriver && (
        <DriverAssignmentDialog
          open={driverDialogOpen}
          onOpenChange={setDriverDialogOpen}
          orderId={selectedOrderForDriver.id}
          orderAddress={selectedOrderForDriver.delivery_address || undefined}
          onSuccess={() => {
            fetchOrders(); // Refresh orders list
          }}
        />
      )}
    </>
  );
};

export default OrdersManager;