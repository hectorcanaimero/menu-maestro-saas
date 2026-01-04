import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSubdomainFromHostname } from "@/lib/subdomain-validation";

export default function DebugAuth() {
  const [session, setSession] = useState<any>(null);
  const [userStore, setUserStore] = useState<any>(null);
  const [directStoreQuery, setDirectStoreQuery] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [platformAdminRole, setPlatformAdminRole] = useState<any>(null);
  const [newSubdomain, setNewSubdomain] = useState("");

  const handleGetSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data);
  };

  const handleGetUserStore = async () => {
    const { data, error } = await supabase.rpc('get_user_owned_store').single();
    setUserStore({ data, error });
  };

  const handleDirectStoreQuery = async () => {
    const subdomain = getSubdomainFromHostname();
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('subdomain', subdomain)
      .single();
    setDirectStoreQuery({ data, error });
  };

  const handleGetUserRoles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id);
    setUserRoles(data || []);
  };

  const handleGetPlatformAdminRole = async () => {
    const { data: isPlatformAdmin, error: isPlatformAdminError } = await supabase
      .rpc('is_platform_admin');
    const { data: adminRole, error: adminRoleError } = await supabase
      .rpc('get_admin_role');

    setPlatformAdminRole({
      isPlatformAdmin,
      adminRole,
      errors: { isPlatformAdminError, adminRoleError }
    });
  };

  const handleChangeSubdomain = () => {
    localStorage.setItem('dev_subdomain', newSubdomain);
    window.location.reload();
  };

  const currentSubdomain = getSubdomainFromHostname();
  const storedSubdomain = localStorage.getItem('dev_subdomain');

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug de Autenticación</h1>
      <p className="text-muted-foreground mb-8">
        Esta página solo está disponible en modo desarrollo y te ayuda a diagnosticar problemas de autenticación.
      </p>

      {/* Subdomain Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de Subdominio</CardTitle>
          <CardDescription>Estado actual del subdominio en desarrollo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Hostname:</strong> {window.location.hostname}
          </div>
          <div>
            <strong>Subdominio actual:</strong> {currentSubdomain}
          </div>
          <div>
            <strong>localStorage.dev_subdomain:</strong> {storedSubdomain || 'No definido'}
          </div>

          <div className="pt-4 space-y-2">
            <Label htmlFor="newSubdomain">Cambiar subdominio de desarrollo:</Label>
            <div className="flex gap-2">
              <Input
                id="newSubdomain"
                value={newSubdomain}
                onChange={(e) => setNewSubdomain(e.target.value)}
                placeholder="Ej: totus, mitienda, etc."
              />
              <Button onClick={handleChangeSubdomain}>
                Cambiar y Recargar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sesión de Supabase</CardTitle>
          <CardDescription>Información del usuario autenticado</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetSession} className="mb-4">
            Obtener Sesión Actual
          </Button>
          {session && (
            <div className="space-y-2">
              <div>
                <strong>User ID:</strong> {session.session?.user?.id || 'N/A'}
              </div>
              <div>
                <strong>Email:</strong> {session.session?.user?.email || 'N/A'}
              </div>
              <div>
                <strong>Autenticado:</strong> {session.session ? 'Sí' : 'No'}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Store RPC */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>RPC: get_user_owned_store()</CardTitle>
          <CardDescription>Verifica si el usuario tiene una tienda asociada</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetUserStore} className="mb-4">
            Ejecutar RPC
          </Button>
          {userStore && (
            <div className="space-y-2">
              {userStore.error ? (
                <div className="text-destructive">
                  <strong>Error:</strong> {userStore.error.message}
                </div>
              ) : userStore.data ? (
                <div>
                  <div><strong>Tienda encontrada:</strong> {userStore.data.name}</div>
                  <div><strong>Subdominio:</strong> {userStore.data.subdomain}</div>
                  <div><strong>Owner ID:</strong> {userStore.data.owner_id}</div>
                  <div><strong>Activa:</strong> {userStore.data.is_active ? 'Sí' : 'No'}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No se encontró tienda asociada
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(userStore, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Store Query */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Query Directo a Tabla stores</CardTitle>
          <CardDescription>Busca la tienda por subdominio actual (sin RPC)</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDirectStoreQuery} className="mb-4">
            Ejecutar Query
          </Button>
          {directStoreQuery && (
            <div className="space-y-2">
              {directStoreQuery.error ? (
                <div className="text-destructive">
                  <strong>Error:</strong> {directStoreQuery.error.message}
                </div>
              ) : directStoreQuery.data ? (
                <div>
                  <div><strong>Tienda encontrada:</strong> {directStoreQuery.data.name}</div>
                  <div><strong>Subdominio:</strong> {directStoreQuery.data.subdomain}</div>
                  <div><strong>Owner ID:</strong> {directStoreQuery.data.owner_id}</div>
                  <div><strong>Activa:</strong> {directStoreQuery.data.is_active ? 'Sí' : 'No'}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No se encontró tienda con subdominio: {currentSubdomain}
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(directStoreQuery, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Roles del Usuario (user_roles)</CardTitle>
          <CardDescription>Roles asignados en la tabla user_roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetUserRoles} className="mb-4">
            Obtener Roles
          </Button>
          {userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((role, index) => (
                <div key={index} className="p-2 bg-muted rounded">
                  <strong>Rol:</strong> {role.role}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">
              No se encontraron roles o no se ha ejecutado la consulta
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Admin Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estado de Platform Admin</CardTitle>
          <CardDescription>Verifica si el usuario es platform admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetPlatformAdminRole} className="mb-4">
            Verificar Platform Admin
          </Button>
          {platformAdminRole && (
            <div className="space-y-2">
              <div>
                <strong>¿Es Platform Admin?:</strong>{' '}
                {platformAdminRole.isPlatformAdmin ? 'Sí' : 'No'}
              </div>
              <div>
                <strong>Rol:</strong>{' '}
                {platformAdminRole.adminRole || 'No tiene rol de platform admin'}
              </div>
              {(platformAdminRole.errors.isPlatformAdminError || platformAdminRole.errors.adminRoleError) && (
                <div className="text-destructive text-sm">
                  Errores en RPC - ver consola
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(platformAdminRole, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo usar esta herramienta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong>1. Verifica tu sesión:</strong> Haz clic en "Obtener Sesión Actual" para ver tu user_id
          </div>
          <div>
            <strong>2. Prueba el RPC:</strong> Ejecuta get_user_owned_store() para ver si encuentra tu tienda
          </div>
          <div>
            <strong>3. Query directo:</strong> Si el RPC falla, prueba el query directo a la tabla stores
          </div>
          <div>
            <strong>4. Revisa roles:</strong> Verifica tus roles en user_roles y platform_admins
          </div>
          <div>
            <strong>5. Cambia subdomain:</strong> Si necesitas probar con otro subdomain, cámbialo y recarga
          </div>
          <div className="pt-4 border-t">
            <strong>Problema común:</strong> Si el RPC retorna null pero el query directo encuentra la tienda,
            probablemente hay un mismatch entre el user_id de tu sesión y el owner_id de la tienda.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
