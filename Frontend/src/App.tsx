import { Routes, Route, useNavigate } from 'react-router-dom';
import { Landing } from './components/Landing/Landing';
import { Login } from './components/Login/Login';
import { Register } from './components/Register/Register';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Houses } from './components/Houses/Houses';
import { HouseDetail } from './components/HouseDetail/HouseDetail';
import { Devices } from './components/Devices/Devices';
import { Alerts } from './components/Alerts/Alerts';
import { ForgotPassword } from './components/ForgotPassword/ForgotPassword';
import { ResetPassword } from './components/ResetPassword/ResetPassword';
import { Analytics } from './components/Analytics/Analytics';
import { PresetsPage } from './components/Presets/PresetsPage';


// Import AuthProvider và ProtectedRoute
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const navigate = useNavigate();

  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Các Route công khai (Public) */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLoginSuccess={() => navigate('/dashboard')} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Các Route được bảo vệ (Protected) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/houses" 
            element={
              <ProtectedRoute>
                <Houses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/houses/:id" 
            element={
              <ProtectedRoute>
                <HouseDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/devices" 
            element={
              <ProtectedRoute>
                <Devices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/presets" 
            element={
              <ProtectedRoute>
                <PresetsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
