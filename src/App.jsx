import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetsView from './pages/AssetsView';
import PortfoliosView from './pages/PortfoliosView';
import PortfolioDetail from './pages/PortfolioDetail';
import ScenariosView from './pages/ScenariosView';
import SimulateView from './pages/SimulateView';
import SimulationDetail from './pages/SimulationDetail';
import CompareView from './pages/CompareView';
import HistoryView from './pages/HistoryView';

import SettingsView from './pages/SettingsView';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  // Role string is returned by /auth/me (e.g. 'ADMIN', 'ANALYST', 'VIEWER')
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Unauthorized Access</h2>
        <p>Your role ({user?.role}) does not have permission to view this page.</p>
      </div>
    );
  }
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            
            {/* Analyst & Admin Area (Creators) */}
            <Route path="assets" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST']}><AssetsView /></RoleRoute>} />
            <Route path="portfolios" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST']}><PortfoliosView /></RoleRoute>} />
            <Route path="portfolios/:id" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST']}><PortfolioDetail /></RoleRoute>} />
            <Route path="scenarios" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST']}><ScenariosView /></RoleRoute>} />
            
            <Route path="simulate" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST']}><SimulateView /></RoleRoute>} />

            
            {/* Viewers Area */}
            <Route path="simulations/:id" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST', 'VIEWER']}><SimulationDetail /></RoleRoute>} />
            <Route path="compare" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST', 'VIEWER']}><CompareView /></RoleRoute>} />
            <Route path="history" element={<RoleRoute allowedRoles={['ADMIN', 'ANALYST', 'VIEWER']}><HistoryView /></RoleRoute>} />

            {/* Settings & Admin Controls */}
            <Route path="settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
            <Route path="admin/users" element={<RoleRoute allowedRoles={['ADMIN']}><UserManagement /></RoleRoute>} />
          </Route>
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
