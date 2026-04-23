import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Login from '../pages/Login';
import Register from '../pages/Register';
import FlatDashboard from '../pages/flatOwner/FlatDashboard';
import FlatBills from '../pages/flatOwner/FlatBills';
import FlatAlerts from '../pages/flatOwner/FlatAlerts';
import FlatSettings from '../pages/flatOwner/FlatSettings';
import AdminDashboard from '../pages/societyAdmin/AdminDashboard';
import AdminDevices from '../pages/societyAdmin/AdminDevices';
import AdminFlats from '../pages/societyAdmin/AdminFlats';
import AdminBilling from '../pages/societyAdmin/AdminBilling';
import FlatAnalytics from '../pages/societyAdmin/FlatAnalytics';
import AdminAnalytics from '../pages/societyAdmin/AdminAnalytics';
import AdminHeatmap from '../pages/societyAdmin/AdminHeatmap';
import AdminAlerts from '../pages/societyAdmin/AdminAlerts';
import AdminSettings from '../pages/societyAdmin/AdminSettings';
import BuilderDashboard from '../pages/builderAdmin/BuilderDashboard';

function Guard({ role }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If authenticated but user object not yet populated in the store (hydration)
  if (!user) return null; 
  
  if (role && !role.includes(user?.role)) {
    const homeMap = {
      flat_owner: '/flat',
      society_admin: '/admin',
      builder_admin: '/builder'
    };
    return <Navigate to={homeMap[user?.role] || '/login'} replace />;
  }
  
  return <Outlet />;
}

export default function AppRoutes() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Flat Owner Nested Routes */}
      <Route path="/flat" element={<Guard role={['flat_owner']} />}>
        <Route index element={<FlatDashboard />} />
        <Route path="bills" element={<FlatBills />} />
        <Route path="alerts" element={<FlatAlerts />} />
        <Route path="settings" element={<FlatSettings />} />
      </Route>

      {/* Society Admin Nested Routes */}
      <Route path="/admin" element={<Guard role={['society_admin']} />}>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="heatmap" element={<AdminHeatmap />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="devices" element={<AdminDevices />} />
        <Route path="flats" element={<AdminFlats />} />
        <Route path="flats/:id/analytics" element={<FlatAnalytics />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Builder Admin Routes */}
      <Route path="/builder" element={<Guard role={['builder_admin']} />}>
        <Route index element={<BuilderDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
