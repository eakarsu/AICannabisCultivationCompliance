import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GrowRooms from './pages/GrowRooms';
import GrowRoomDetail from './pages/GrowRoomDetail';
import Plants from './pages/Plants';
import PlantDetail from './pages/PlantDetail';
import Compliance from './pages/Compliance';
import ComplianceDetail from './pages/ComplianceDetail';
import YieldPredictions from './pages/YieldPredictions';
import YieldPredictionDetail from './pages/YieldPredictionDetail';
import LabTests from './pages/LabTests';
import LabTestDetail from './pages/LabTestDetail';
import Inventory from './pages/Inventory';
import InventoryDetail from './pages/InventoryDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Harvests from './pages/Harvests';
import HarvestDetail from './pages/HarvestDetail';
import Strains from './pages/Strains';
import StrainDetail from './pages/StrainDetail';
import WasteRecords from './pages/WasteRecords';
import WasteRecordDetail from './pages/WasteRecordDetail';
import EnvironmentalAlerts from './pages/EnvironmentalAlerts';
import EnvironmentalAlertDetail from './pages/EnvironmentalAlertDetail';
import RegulatoryTracker from './pages/RegulatoryTracker';
import HarvestTimingOptimizer from './pages/HarvestTimingOptimizer';
import LicenseRenewal from './pages/LicenseRenewal';
import MicrobialAnalyzer from './pages/MicrobialAnalyzer';
import SupplyChainAudit from './pages/SupplyChainAudit';
import PestDetection from './pages/PestDetection';
import EnergyOptimizer from './pages/EnergyOptimizer';
import SeedSupplierAudit from './pages/SeedSupplierAudit';
import AIResultsHistory from './pages/AIResultsHistory';
import Webhooks from './pages/Webhooks';
import Operations from './pages/Operations';
import HarvestReadiness from './pages/HarvestReadiness';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <Routes>
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grow-rooms"
        element={
          <ProtectedRoute>
            <AppLayout><GrowRooms /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/grow-rooms/:id"
        element={
          <ProtectedRoute>
            <AppLayout><GrowRoomDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plants"
        element={
          <ProtectedRoute>
            <AppLayout><Plants /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plants/:id"
        element={
          <ProtectedRoute>
            <AppLayout><PlantDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <AppLayout><Compliance /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance/:id"
        element={
          <ProtectedRoute>
            <AppLayout><ComplianceDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/yield-predictions"
        element={
          <ProtectedRoute>
            <AppLayout><YieldPredictions /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/yield-predictions/:id"
        element={
          <ProtectedRoute>
            <AppLayout><YieldPredictionDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-tests"
        element={
          <ProtectedRoute>
            <AppLayout><LabTests /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-tests/:id"
        element={
          <ProtectedRoute>
            <AppLayout><LabTestDetail /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/inventory" element={<ProtectedRoute><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
      <Route path="/inventory/:id" element={<ProtectedRoute><AppLayout><InventoryDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><AppLayout><TaskDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/harvests" element={<ProtectedRoute><AppLayout><Harvests /></AppLayout></ProtectedRoute>} />
      <Route path="/harvests/:id" element={<ProtectedRoute><AppLayout><HarvestDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/strains" element={<ProtectedRoute><AppLayout><Strains /></AppLayout></ProtectedRoute>} />
      <Route path="/strains/:id" element={<ProtectedRoute><AppLayout><StrainDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/waste-records" element={<ProtectedRoute><AppLayout><WasteRecords /></AppLayout></ProtectedRoute>} />
      <Route path="/waste-records/:id" element={<ProtectedRoute><AppLayout><WasteRecordDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/environmental-alerts" element={<ProtectedRoute><AppLayout><EnvironmentalAlerts /></AppLayout></ProtectedRoute>} />
      <Route path="/environmental-alerts/:id" element={<ProtectedRoute><AppLayout><EnvironmentalAlertDetail /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/regulatory-tracker" element={<ProtectedRoute><AppLayout><RegulatoryTracker /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/harvest-timing" element={<ProtectedRoute><AppLayout><HarvestTimingOptimizer /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/license-renewal" element={<ProtectedRoute><AppLayout><LicenseRenewal /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/microbial-analyzer" element={<ProtectedRoute><AppLayout><MicrobialAnalyzer /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/supply-chain" element={<ProtectedRoute><AppLayout><SupplyChainAudit /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/harvest-readiness" element={<ProtectedRoute><AppLayout><HarvestReadiness /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/pest-detection" element={<ProtectedRoute><AppLayout><PestDetection /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/energy-optimizer" element={<ProtectedRoute><AppLayout><EnergyOptimizer /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/seed-supplier" element={<ProtectedRoute><AppLayout><SeedSupplierAudit /></AppLayout></ProtectedRoute>} />
      <Route path="/ai/history" element={<ProtectedRoute><AppLayout><AIResultsHistory /></AppLayout></ProtectedRoute>} />
      <Route path="/webhooks" element={<ProtectedRoute><AppLayout><Webhooks /></AppLayout></ProtectedRoute>} />
      <Route path="/operations" element={<ProtectedRoute><AppLayout><Operations /></AppLayout></ProtectedRoute>} />
      <Route path="/custom-views" element={<ProtectedRoute><AppLayout><CustomViewsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
