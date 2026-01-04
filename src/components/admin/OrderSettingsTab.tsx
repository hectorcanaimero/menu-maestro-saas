import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const orderSettingsSchema = z.object({
  minimum_order_price: z.string().optional(),
  redirect_to_whatsapp: z.boolean(),
  order_product_template: z.string().trim().min(1, 'El template de productos es requerido'),
  order_message_template_delivery: z.string().trim().min(1, 'El template de entrega es requerido'),
  order_message_template_pickup: z.string().trim().min(1, 'El template de retiro es requerido'),
  order_message_template_digital_menu: z.string().trim().min(1, 'El template de menú digital es requerido'),
});

type OrderSettingsForm = z.infer<typeof orderSettingsSchema>;

interface OrderSettingsTabProps {
  storeId: string;
  initialData: {
    minimum_order_price?: number | null;
    redirect_to_whatsapp?: boolean | null;
    order_product_template?: string | null;
    order_message_template_delivery?: string | null;
    order_message_template_pickup?: string | null;
    order_message_template_digital_menu?: string | null;
  };
}

const defaultProductTemplate = `{product-qty} {product-name}
{product-extras}
Nota: {product-note}`;

const defaultDeliveryTemplate = `===== Orden {order-number} =====

{order-products}
Entrega: {shipping-price}
Total de Pédido: {order-total}
Método de Pago: {payment-method}
Cambiar: {payment-change}

===== Cliente =====

{customer-name}
{customer-phone}
{customer-address}, {customer-address-number}
{customer-address-complement}
{customer-address-neighborhood}
{customer-address-zipcode}

===== Rastreo de Ordenes =====

{order-track-page}`;

const defaultPickupTemplate = `===== Orden {order-number} =====

{order-products}
Total de Pédido: {order-total}
Método de Pago: {payment-method}

===== Cliente =====

{customer-name}
{customer-phone}`;

const defaultDigitalMenuTemplate = `===== Orden {order-number} =====

{order-products}
Mesa: {order-table}
Order Total: {order-total}`;

export function OrderSettingsTab({ storeId, initialData }: OrderSettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [messageType, setMessageType] = useState<'delivery' | 'pickup' | 'digital_menu'>('delivery');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderSettingsForm>({
    resolver: zodResolver(orderSettingsSchema),
    defaultValues: {
      minimum_order_price: initialData.minimum_order_price?.toString() || '',
      redirect_to_whatsapp: initialData.redirect_to_whatsapp ?? true,
      order_product_template: initialData.order_product_template || defaultProductTemplate,
      order_message_template_delivery: initialData.order_message_template_delivery || defaultDeliveryTemplate,
      order_message_template_pickup: initialData.order_message_template_pickup || defaultPickupTemplate,
      order_message_template_digital_menu:
        initialData.order_message_template_digital_menu || defaultDigitalMenuTemplate,
    },
  });

  const redirectToWhatsapp = watch('redirect_to_whatsapp');

  const onSubmit = async (data: OrderSettingsForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          minimum_order_price: data.minimum_order_price ? parseFloat(data.minimum_order_price) : null,
          redirect_to_whatsapp: data.redirect_to_whatsapp,
          order_product_template: data.order_product_template,
          order_message_template_delivery: data.order_message_template_delivery,
          order_message_template_pickup: data.order_message_template_pickup,
          order_message_template_digital_menu: data.order_message_template_digital_menu,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);

      if (error) throw error;

      toast.success('Configuración de pedidos guardada correctamente');
    } catch (error: unknown) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentTemplate = () => {
    switch (messageType) {
      case 'delivery':
        return watch('order_message_template_delivery');
      case 'pickup':
        return watch('order_message_template_pickup');
      case 'digital_menu':
        return watch('order_message_template_digital_menu');
    }
  };

  const setCurrentTemplate = (value: string) => {
    switch (messageType) {
      case 'delivery':
        setValue('order_message_template_delivery', value);
        break;
      case 'pickup':
        setValue('order_message_template_pickup', value);
        break;
      case 'digital_menu':
        setValue('order_message_template_digital_menu', value);
        break;
    }
  };

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-xl md:text-2xl">Configuración de Pedido</CardTitle>
        <CardDescription className="text-sm">
          En esta sección puedes configurar el mensaje de pedido utilizado cuando el cliente es redirigido a WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="minimum_order_price" className="text-sm md:text-base">
              Precio minimo de pedido
            </Label>
            <Input
              id="minimum_order_price"
              type="number"
              step="0.01"
              {...register('minimum_order_price')}
              placeholder="0.00"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Si no desea establecer un precio mínimo para los pedidos, simplemente deje esta entrada en blanco.
            </p>
            {errors.minimum_order_price && (
              <p className="text-xs md:text-sm text-destructive">{errors.minimum_order_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3 py-1">
              <Checkbox
                id="redirect_to_whatsapp"
                checked={redirectToWhatsapp}
                onCheckedChange={(checked) => setValue('redirect_to_whatsapp', checked as boolean)}
                className="h-5 w-5 md:h-4 md:w-4"
              />
              <label
                htmlFor="redirect_to_whatsapp"
                className="text-sm md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                ¿Redirigir a WhatsApp? Sí, redirige al cliente a WhatsApp después del pago
              </label>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Si no lo seleccionas, el plugin mostrará el botón para enviar el pedido en WhatsApp.
            </p>
          </div>

          <div className="border-t pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Mensaje personalizado del pedido</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm md:text-base font-medium mb-2">How to use?</h4>
                <h4 className="text-sm md:text-base font-medium mb-2">¿Cómo usar?</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li>
                    Define la plantilla para listar los productos del pedido en "Plantilla para Listar los Productos del
                    Pedido".
                  </li>
                  <li>Selecciona el tipo de mensaje que vas a personalizar (Entrega, Para llevar, Menú digital).</li>
                  <li>Crea el mensaje completo y personalizado en "Plantilla para el Mensaje del Pedido".</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_product_template" className="text-sm md:text-base">
                  Template to List the Order Products
                </Label>
                <Textarea
                  id="order_product_template"
                  {...register('order_product_template')}
                  rows={6}
                  className="font-mono text-xs md:text-sm"
                />
                <details className="text-xs md:text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Tokens disponibles:</summary>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>
                      <code>{'{product-qty}'}</code> - Cantidad del producto
                    </li>
                    <li>
                      <code>{'{product-name}'}</code> - Nombre del producto
                    </li>
                    <li>
                      <code>{'{product-price}'}</code> - Precio del producto con símbolo de moneda
                    </li>
                    <li>
                      <code>{'{product-extras}'}</code> - Extras del producto
                    </li>
                    <li>
                      <code>{'{product-note}'}</code> - Nota del producto
                    </li>
                  </ul>
                </details>
                {errors.order_product_template && (
                  <p className="text-xs md:text-sm text-destructive">{errors.order_product_template.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_type" className="text-sm md:text-base">
                  Tipo de Mensaje
                </Label>
                <Select
                  value={messageType}
                  onValueChange={(value: 'delivery' | 'pickup' | 'digital_menu') => setMessageType(value)}
                >
                  <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Entrega</SelectItem>
                    <SelectItem value="pickup">Retiro en tienda</SelectItem>
                    <SelectItem value="digital_menu">Menú Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_message_template" className="text-sm md:text-base">
                  Plantilla para el Mensaje del Pedido
                </Label>
                <Textarea
                  id="order_message_template"
                  value={getCurrentTemplate()}
                  onChange={(e) => setCurrentTemplate(e.target.value)}
                  rows={15}
                  className="font-mono text-xs md:text-sm"
                />
                <details className="text-xs md:text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Tokens disponibles:</summary>
                  <ul className="mt-2 space-y-1 ml-4 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <li>
                      <code>{'{order-number}'}</code> - Número del pedido
                    </li>
                    <li>
                      <code>{'{order-date-time}'}</code> - Fecha y hora del pedido
                    </li>
                    <li>
                      <code>{'{order-total}'}</code> - Total del pedido
                    </li>
                    <li>
                      <code>{'{order-products}'}</code> - Productos del pedido (requerido)
                    </li>
                    <li>
                      <code>{'{order-table}'}</code> - Número de la mesa
                    </li>
                    <li>
                      <code>{'{payment-method}'}</code> - Método de pago
                    </li>
                    <li>
                      <code>{'{payment-change}'}</code> - Cambio
                    </li>
                    <li>
                      <code>{'{payment-receipt-link}'}</code> - Enlace del comprobante de pago
                    </li>
                    <li>
                      <code>{'{customer-name}'}</code> - Nombre del cliente
                    </li>
                    <li>
                      <code>{'{customer-phone}'}</code> - Teléfono del cliente
                    </li>
                    <li>
                      <code>{'{customer-address}'}</code> - Dirección del cliente
                    </li>
                    <li>
                      <code>{'{customer-address-number}'}</code> - Número de la dirección
                    </li>
                    <li>
                      <code>{'{customer-address-complement}'}</code> - Complemento de la dirección
                    </li>
                    <li>
                      <code>{'{customer-address-neighborhood}'}</code> - Barrio
                    </li>
                    <li>
                      <code>{'{customer-address-zipcode}'}</code> - Código postal
                    </li>
                    <li>
                      <code>{'{shipping-price}'}</code> - Precio del envío
                    </li>
                    <li>
                      <code>{'{order-track-page}'}</code> - Enlace de rastreo del pedido
                    </li>
                    <li>
                      <code>{'{order-total-bolivares}'}</code> - Total del pedido en bolívares (requiere tasa de cambio)
                    </li>
                    <li>
                      <code>{'{order-subtotal-bolivares}'}</code> - Subtotal de productos en bolívares
                    </li>
                    <li>
                      <code>{'{shipping-price-bolivares}'}</code> - Precio del envío en bolívares
                    </li>
                  </ul>
                </details>
                <p className="text-xs md:text-sm text-muted-foreground">
                  <strong>Importante:</strong> El token <code>{'{order-products}'}</code> es requerido y listará los
                  productos según el template definido arriba.
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                  <strong>Nota:</strong> Para que las conversiones a bolívares funcionen, debe configurar la tasa de
                  cambio en la sección de{' '}
                  <a href="#currency-conversion" className="text-primary hover:underline">
                    Conversión de Moneda
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
