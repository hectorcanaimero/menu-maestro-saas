import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Search, Edit, Trash2, Eye, RefreshCw, Copy, AlertTriangle } from "lucide-react";
import { CustomerCard } from "./CustomerCard";

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

const CustomersManager = () => {
  const { store } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [duplicates, setDuplicates] = useState<Customer[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "brazil",
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 15;

  useEffect(() => {
    if (store?.id) {
      fetchCustomers();
    }
  }, [store?.id]);

  const fetchCustomers = async () => {
    if (!store?.id) return;
    
    setLoading(true);
    try {
      // Get all customers who have made orders in this store
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          customer_id,
          total_amount,
          customers (
            id,
            name,
            email,
            phone,
            country,
            created_at,
            updated_at
          )
        `)
        .eq("store_id", store.id);

      if (ordersError) throw ordersError;

      // Aggregate customer data
      const customerMap = new Map<string, Customer>();
      
      ordersData?.forEach((order) => {
        const ord = order as { customer_id: string; total_amount: number; customers?: { id: string; name: string; email?: string; phone?: string; country?: string; created_at?: string; updated_at?: string } };
        if (ord.customers) {
          const customerId = ord.customer_id;

          if (customerMap.has(customerId)) {
            const existing = customerMap.get(customerId)!;
            existing.order_count = (existing.order_count || 0) + 1;
            existing.total_spent = (existing.total_spent || 0) + Number(ord.total_amount);
          } else {
            customerMap.set(customerId, {
              id: ord.customers.id,
              name: ord.customers.name,
              email: ord.customers.email || '',
              phone: ord.customers.phone || null,
              country: ord.customers.country || 'venezuela',
              created_at: ord.customers.created_at || new Date().toISOString(),
              updated_at: ord.customers.updated_at || new Date().toISOString(),
              order_count: 1,
              total_spent: Number(ord.total_amount),
            });
          }
        }
      });

      const customersArray = Array.from(customerMap.values());
      setCustomers(customersArray);
      setFilteredCustomers(customersArray);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchQuery, customers]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      country: customer.country,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          country: editForm.country,
        })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      toast.success("Cliente actualizado correctamente");
      setEditDialogOpen(false);
      fetchCustomers();
    } catch (error: unknown) {
      console.error("Error updating customer:", error);
      const err = error as { code?: string };
      if (err.code === "23505") {
        toast.error("Este email ya está en uso por otro cliente");
      } else {
        toast.error("Error al actualizar cliente");
      }
    }
  };

  const findDuplicates = (customer: Customer) => {
    const potentialDuplicates = customers.filter(c => {
      if (c.id === customer.id) return false;
      
      // Check for similar names (Levenshtein distance or simple contains)
      const nameSimilar = c.name.toLowerCase().includes(customer.name.toLowerCase().split(" ")[0].toLowerCase()) ||
                         customer.name.toLowerCase().includes(c.name.toLowerCase().split(" ")[0].toLowerCase());
      
      // Check for same phone
      const phoneSame = c.phone && customer.phone && c.phone === customer.phone;
      
      return nameSimilar || phoneSame;
    });

    setDuplicates(potentialDuplicates);
    setSelectedCustomer(customer);
    setMergeTargetId("");
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!selectedCustomer || !mergeTargetId) {
      toast.error("Selecciona un cliente para fusionar");
      return;
    }

    try {
      // Update all orders from the duplicate to point to the target customer
      const { error: updateError } = await supabase
        .from("orders")
        .update({ customer_id: mergeTargetId })
        .eq("customer_id", selectedCustomer.id);

      if (updateError) throw updateError;

      // Delete the duplicate customer
      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", selectedCustomer.id);

      if (deleteError) throw deleteError;

      toast.success("Clientes fusionados correctamente");
      setMergeDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error merging customers:", error);
      toast.error("Error al fusionar clientes");
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsDialogOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return <div className="text-center py-8">Cargando clientes...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gestión de Clientes
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchCustomers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Customers Grid/Table */}
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0 ? "No hay clientes registrados" : "No se encontraron clientes"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid gap-4 md:hidden">
                {currentCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onEdit={handleEdit}
                    onFindDuplicates={findDuplicates}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead>Total Gastado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(customer.created_at).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{customer.email}</TableCell>
                        <TableCell className="text-sm">{customer.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.order_count || 0}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(customer.total_spent || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(customer)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => findDuplicates(customer)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                     ))}
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => goToPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">País</Label>
              <Select value={editForm.country} onValueChange={(value) => setEditForm({ ...editForm, country: value })}>
                <SelectTrigger id="edit-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brazil">Brasil</SelectItem>
                  <SelectItem value="venezuela">Venezuela</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Fusionar Clientes Duplicados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Cliente seleccionado:</p>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            )}

            {duplicates.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No se encontraron duplicados potenciales para este cliente
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Se encontraron {duplicates.length} posible{duplicates.length !== 1 ? 's' : ''} duplicado{duplicates.length !== 1 ? 's' : ''}. 
                  Selecciona el cliente con el que deseas fusionar:
                </p>
                <div className="space-y-2">
                  {duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      onClick={() => setMergeTargetId(dup.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        mergeTargetId === dup.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{dup.name}</p>
                          <p className="text-sm text-muted-foreground">{dup.email}</p>
                          <p className="text-sm text-muted-foreground">{dup.phone}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{dup.order_count || 0} pedidos</Badge>
                          <p className="text-sm font-medium mt-1">${(dup.total_spent || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMerge} 
              disabled={!mergeTargetId || duplicates.length === 0}
              variant="destructive"
            >
              Fusionar Clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">País</p>
                  <p className="font-medium">{selectedCustomer.country === "brazil" ? "Brasil" : "Venezuela"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                  <p className="font-bold text-lg">{selectedCustomer.order_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Gastado</p>
                  <p className="font-bold text-lg text-primary">${(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente desde</p>
                  <p className="font-medium">
                    {new Date(selectedCustomer.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
                  <p className="font-medium">
                    {new Date(selectedCustomer.updated_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomersManager;
