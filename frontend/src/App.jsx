import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import VideoDetailPage from './pages/VideoDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';

function AppRoutes() {
  const { token } = useAuth();

  return (
    <SocketProvider token={token}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/videos/:id" element={<VideoDetailPage />} />
        </Route>

        {/* Editor + Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['editor', 'admin']} />}>
          <Route path="/upload" element={<UploadPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
