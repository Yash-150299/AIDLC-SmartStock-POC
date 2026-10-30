/**
 * Route table (React Router). Public `/login`; everything else is guarded by `RequireAuth` and
 * rendered inside the authenticated `AppShell` (ST-2b). Unknown paths redirect to the dashboard.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { RequireAuth } from './app/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { InventoryListPage } from './features/inventory/InventoryListPage';
import { AddProductPage } from './features/inventory/AddProductPage';
import { EditProductPage } from './features/inventory/EditProductPage';
import { ProductDetailsPage } from './features/inventory/ProductDetailsPage';
import { StockAdjustmentPage } from './features/stock/StockAdjustmentPage';
import { AdjustmentHistoryPage } from './features/stock/AdjustmentHistoryPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryListPage />} />
        <Route path="/inventory/new" element={<AddProductPage />} />
        <Route path="/inventory/:id" element={<ProductDetailsPage />} />
        <Route path="/inventory/:id/edit" element={<EditProductPage />} />
        <Route path="/inventory/:id/adjust" element={<StockAdjustmentPage />} />
        <Route path="/inventory/:id/history" element={<AdjustmentHistoryPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
