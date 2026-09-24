import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi, extractErrorMessage } from '../services';
import StatusBadge from '../components/ui/StatusBadge';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await bookingApi.mine();
      setBookings(data.data.bookings);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Bookings</h1>
          <p className="subtitle">Active reservations and parking history.</p>
        </div>
      </div>

      {loading && <div className="loading-state">Loading bookings…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          No bookings yet. <Link to="/parking">Find a slot to book.</Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Vehicle</th>
              <th>Arrival</th>
              <th>Status</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="mono">{b.parkingSlot?.slotNumber || '—'}</td>
                <td className="mono">{b.vehicle?.vehicleNumber || '—'}</td>
                <td className="mono">{new Date(b.startTime).toLocaleString()}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="mono">{b.totalAmount !== null ? `₹${b.totalAmount}` : '—'}</td>
                <td>
                  <Link to={`/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Bookings;
