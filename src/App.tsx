import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ScrollToTop } from "@/components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";

// Lazy load all route components
const Index = lazy(() => import("./pages/Index"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const CreateStore = lazy(() => import("./pages/CreateStore"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ConfirmOrder = lazy(() => import("./pages/ConfirmOrder"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin routes - lazy load (heavy components)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminKitchen = lazy(() => import("./pages/admin/AdminKitchen"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminMenuItems = lazy(() => import("./pages/admin/AdminMenuItems"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminSubscription = lazy(() => import("./pages/admin/AdminSubscription"));
const StoreSettings = lazy(() => import("./pages/admin/StoreSettings"));

// Platform Admin routes - super admin panel
const PlatformAdminLayout = lazy(() => import("./pages/platform-admin/PlatformAdminLayout"));
const PlatformDashboard = lazy(() => import("./pages/platform-admin/PlatformDashboard"));
const PaymentValidations = lazy(() => import("./pages/platform-admin/PaymentValidations"));
const SubscriptionsManager = lazy(() => import("./pages/platform-admin/SubscriptionsManager"));
const StoresManager = lazy(() => import("./pages/platform-admin/StoresManager"));
const PlansManager = lazy(() => import("./pages/platform-admin/PlansManager"));
const AdminsManager = lazy(() => import("./pages/platform-admin/AdminsManager"));
const PostHogAnalytics = lazy(() => import("./pages/platform-admin/PostHogAnalytics"));
const CatalogViewsManager = lazy(() => import("./pages/platform-admin/CatalogViewsManager"));
import { PlatformAdminGuard } from "./components/platform-admin/PlatformAdminGuard";

// Driver routes - PWA for delivery drivers
const DriverLogin = lazy(() => import("./pages/driver/DriverLogin"));
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const ActiveDelivery = lazy(() => import("./pages/driver/ActiveDelivery"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetch on window focus (tab switch)
      refetchOnWindowFocus: false,
      // Prevent refetch when component mounts
      refetchOnMount: false,
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Internal component to use hooks that require router context
const AppContent = () => {
  // Note: Chatwoot is now initialized in AdminDashboard only
  // See src/pages/admin/AdminDashboard.tsx for implementation

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/"
                    element={
                      <SectionErrorBoundary>
                        <Index />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/welcome"
                    element={
                      <SectionErrorBoundary>
                        <Welcome />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/auth"
                    element={
                      <SectionErrorBoundary>
                        <Auth />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/verify-email"
                    element={
                      <SectionErrorBoundary>
                        <VerifyEmail />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <SectionErrorBoundary>
                        <ResetPassword />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/update-password"
                    element={
                      <SectionErrorBoundary>
                        <UpdatePassword />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/create-store"
                    element={
                      <SectionErrorBoundary>
                        <CreateStore />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/landing"
                    element={
                      <SectionErrorBoundary>
                        <LandingPage />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <SectionErrorBoundary>
                        <Checkout />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/confirm-order"
                    element={
                      <SectionErrorBoundary>
                        <ConfirmOrder />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <SectionErrorBoundary>
                        <MyOrders />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/track/:orderId"
                    element={
                      <SectionErrorBoundary>
                        <TrackOrder />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <SectionErrorBoundary>
                        <ProductDetail />
                      </SectionErrorBoundary>
                    }
                  />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminDashboard />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminOrders />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/kitchen"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminKitchen />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminAnalytics />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminCategories />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/menu-items"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminMenuItems />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/customers"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminCustomers />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/promotions"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminPromotions />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coupons"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminCoupons />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/ai"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminAI />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/whatsapp"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminWhatsApp />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <StoreSettings />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/delivery"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminDelivery />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/subscription"
                    element={
                      <ProtectedRoute>
                        <SectionErrorBoundary>
                          <AdminSubscription />
                        </SectionErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Platform Admin Routes - Super Admin Panel */}
                  <Route
                    path="/platform-admin"
                    element={
                      <PlatformAdminGuard>
                        <Suspense fallback={<LoadingScreen />}>
                          <PlatformAdminLayout />
                        </Suspense>
                      </PlatformAdminGuard>
                    }
                  >
                    <Route
                      index
                      element={
                        <SectionErrorBoundary>
                          <PlatformDashboard />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="payments"
                      element={
                        <SectionErrorBoundary>
                          <PaymentValidations />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="subscriptions"
                      element={
                        <SectionErrorBoundary>
                          <SubscriptionsManager />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="stores"
                      element={
                        <SectionErrorBoundary>
                          <StoresManager />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="catalogs"
                      element={
                        <SectionErrorBoundary>
                          <CatalogViewsManager />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="plans"
                      element={
                        <SectionErrorBoundary>
                          <PlansManager />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="admins"
                      element={
                        <SectionErrorBoundary>
                          <AdminsManager />
                        </SectionErrorBoundary>
                      }
                    />
                    <Route
                      path="posthog"
                      element={
                        <SectionErrorBoundary>
                          <PostHogAnalytics />
                        </SectionErrorBoundary>
                      }
                    />
                  </Route>

                  {/* Driver Routes - PWA for delivery drivers */}
                  <Route
                    path="/driver/login"
                    element={
                      <SectionErrorBoundary>
                        <DriverLogin />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/driver/dashboard"
                    element={
                      <SectionErrorBoundary>
                        <DriverDashboard />
                      </SectionErrorBoundary>
                    }
                  />
                  <Route
                    path="/driver/delivery/:assignmentId"
                    element={
                      <SectionErrorBoundary>
                        <ActiveDelivery />
                      </SectionErrorBoundary>
                    }
                  />

                  {/* Debug route - only available in development */}
                  {import.meta.env.DEV && (
                    <Route
                      path="/debug-auth"
                      element={
                        <SectionErrorBoundary>
                          <DebugAuth />
                        </SectionErrorBoundary>
                      }
                    />
                  )}

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </>
  );
};

const App = () => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </StoreProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
