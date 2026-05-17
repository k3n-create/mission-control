import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGate } from "./auth/AuthGate";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Stores = lazy(() => import("./pages/Stores"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

const wrap = (el: React.ReactNode) => <Suspense fallback={<RouteFallback />}>{el}</Suspense>;

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public route — must NOT be behind AuthGate */}
        <Route path="/reset-password" element={wrap(<ResetPassword />)} />

        <Route
          element={
            <AuthGate>
              <AppLayout />
            </AuthGate>
          }
        >
          <Route index element={wrap(<Dashboard />)} />
          <Route path="/ingredients" element={wrap(<Ingredients />)} />
          <Route path="/recipes" element={wrap(<Recipes />)} />
          <Route path="/integrations" element={wrap(<Integrations />)} />
          <Route path="/stores" element={wrap(<Stores />)} />
          <Route path="/settings" element={wrap(<Settings />)} />
          <Route path="*" element={wrap(<NotFound />)} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
