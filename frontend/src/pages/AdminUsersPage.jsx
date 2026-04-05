import { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from '../components/common/Spinner';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then((res) => {
      setUsers(res.data.data);
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.data : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/active`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.data : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleColors[u.role]}`}
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(u._id)}
                    className={`text-xs font-medium ${
                      u.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
