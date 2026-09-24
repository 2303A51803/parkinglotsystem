import { useEffect, useState } from 'react';
import { adminApi, extractErrorMessage } from '../../services';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.users();
      setUsers(data.data.users);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      await load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="subtitle">Everyone registered on the platform.</p>
        </div>
      </div>

      {loading && <div className="loading-state">Loading users…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="mono">{u.email}</td>
                <td>{u.role}</td>
                <td className="mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'ADMIN' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsers;
