import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-700',
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-900">
              VideoSense
            </Link>
            <div className="hidden sm:flex gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Dashboard
              </Link>
              {(user?.role === 'editor' || user?.role === 'admin') && (
                <Link to="/upload" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Upload
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Users
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user?.role] || ''}`}>
              {user?.role}
            </span>
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
