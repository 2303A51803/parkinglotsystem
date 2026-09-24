import { useEffect, useState } from 'react';
import { adminApi, extractErrorMessage } from '../../services';
import StatusBadge from '../../components/ui/StatusBadge';

const STATUS_FILTERS = ['', 'BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'];

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (status) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.bookings(status ? { status } : {});
      setBookings(data.data.bookings);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p className="subtitle">Monitor every reservation across the facility.</p>
        </div>
      </div>

      <div className="pill-select" style={{ marginBottom: 18 }}>
        {STATUS_FILTERS.map((s) => (
          <button key={s || 'ALL'} className={statusFilter === s ? 'selected' : ''} onClick={() => setStatusFilter(s)}>
            {s || 'ALL'}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Loading bookings…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && <div className="empty-state">No bookings match this filter.</div>}

      {!loading && bookings.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Vehicle</th>
              <th>Slot</th>
              <th>Arrival</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.User?.name || b.user?.name}</td>
                <td className="mono">{b.vehicle?.vehicleNumber}</td>
                <td className="mono">{b.parkingSlot?.slotNumber}</td>
                <td className="mono">{new Date(b.startTime).toLocaleString()}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="mono">{b.totalAmount !== null ? `₹${b.totalAmount}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminBookings;
