import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ChatAI } from './components/ChatAI/ChatAI';

function GlobalChatAI() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  // Extract houseId from path if on HouseDetail page (e.g. /houses/:id)
  const houseMatch = location.pathname.match(/^\/houses\/([^/]+)/);
  const currentHouseId = houseMatch ? houseMatch[1] : undefined;

  return <ChatAI currentHouseId={currentHouseId} />;
}

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
        <GlobalChatAI />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
