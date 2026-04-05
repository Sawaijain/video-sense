import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-700',
  };

  const navLinks = (
    <>
      <Link
        to="/"
        onClick={() => setMenuOpen(false)}
        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
      >
        Dashboard
      </Link>
      {(user?.role === 'editor' || user?.role === 'admin') && (
        <Link
          to="/upload"
          onClick={() => setMenuOpen(false)}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          Upload
        </Link>
      )}
      {user?.role === 'admin' && (
        <Link
          to="/admin/users"
          onClick={() => setMenuOpen(false)}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          Users
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-gray-900">
              VideoSense
            </Link>
            <div className="hidden sm:flex gap-4">
              {navLinks}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user?.role] || ''}`}>
              {user?.role}
            </span>
            <span className="hidden sm:inline text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="hidden sm:inline text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-3">
            {navLinks}
            <div className="border-t border-gray-100 pt-3 mt-1 flex items-center justify-between">
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
      )}
    </nav>
  );
}
