import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";

// Lazy load all route components
const Index = lazy(() => import("./pages/Index"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Auth = lazy(() => import("./pages/Auth"));
const CreateStore = lazy(() => import("./pages/CreateStore"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ConfirmOrder = lazy(() => import("./pages/ConfirmOrder"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin routes - lazy load (heavy components)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminKitchen = lazy(() => import("./pages/admin/AdminKitchen"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminMenuItems = lazy(() => import("./pages/admin/AdminMenuItems"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const StoreSettings = lazy(() => import("./pages/admin/StoreSettings"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create-store" element={<CreateStore />} />
            <Route path="/landing" element={<LandingPage />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/confirm-order" element={<ConfirmOrder />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/track/:orderId" element={<TrackOrder />} />
                  <Route path="/products/:id" element={<ProductDetail />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <ProtectedRoute>
                        <AdminOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/kitchen"
                    element={
                      <ProtectedRoute>
                        <AdminKitchen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute>
                        <AdminReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <ProtectedRoute>
                        <AdminCategories />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/menu-items"
                    element={
                      <ProtectedRoute>
                        <AdminMenuItems />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/customers"
                    element={
                      <ProtectedRoute>
                        <AdminCustomers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/promotions"
                    element={
                      <ProtectedRoute>
                        <AdminPromotions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coupons"
                    element={
                      <ProtectedRoute>
                        <AdminCoupons />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <StoreSettings />
                      </ProtectedRoute>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </StoreProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
