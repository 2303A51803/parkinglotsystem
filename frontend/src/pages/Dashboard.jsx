import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleApi, bookingApi, parkingApi, extractErrorMessage } from '../services';
import StatusBadge from '../components/ui/StatusBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [vehiclesRes, bookingsRes, slotsRes] = await Promise.all([
          vehicleApi.list(),
          bookingApi.mine(),
          parkingApi.listSlots(),
        ]);
        setVehicles(vehiclesRes.data.data.vehicles);
        setBookings(bookingsRes.data.data.bookings);

        const slots = slotsRes.data.data.slots;
        const total = slots.length;
        const unavailable = slots.filter((s) => ['BOOKED', 'OCCUPIED'].includes(s.status)).length;
        setOccupancy({
          total,
          available: slots.filter((s) => s.status === 'AVAILABLE').length,
          occupancyPercentage: total === 0 ? 0 : Math.round((unavailable / total) * 10000) / 100,
        });
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-state">Loading your dashboard…</div>;
  if (error) return <div className="form-error">{error}</div>;

  const activeBooking = bookings.find((b) => b.status === 'ACTIVE');
  const upcomingBooking = bookings.find((b) => b.status === 'BOOKED');
  const recentHistory = bookings.filter((b) => b.status === 'COMPLETED').slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="subtitle">Here's what's happening with your parking today.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Available slots</div>
          <div className="value">{occupancy?.available ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Current occupancy</div>
          <div className="value">{occupancy?.occupancyPercentage ?? '—'}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Your vehicles</div>
          <div className="value">{vehicles.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total bookings</div>
          <div className="value">{bookings.length}</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title-row">
              <h3>Current parking status</h3>
            </div>
            {activeBooking ? (
              <div>
                <p>
                  Your vehicle <strong>{activeBooking.vehicle?.vehicleNumber}</strong> is currently parked in slot{' '}
                  <strong className="mono">{activeBooking.parkingSlot?.slotNumber}</strong>.
                </p>
                <StatusBadge status={activeBooking.status} />
                <div style={{ marginTop: 12 }}>
                  <Link to={`/bookings/${activeBooking.id}`} className="btn btn-primary btn-sm">
                    Manage this booking
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state">No vehicle currently parked.</div>
            )}
          </div>

          <div className="card">
            <div className="section-title-row">
              <h3>Upcoming booking</h3>
            </div>
            {upcomingBooking ? (
              <div>
                <p>
                  Slot <strong className="mono">{upcomingBooking.parkingSlot?.slotNumber}</strong> reserved for{' '}
                  {new Date(upcomingBooking.startTime).toLocaleString()}.
                </p>
                <Link to={`/bookings/${upcomingBooking.id}`} className="btn btn-secondary btn-sm">
                  View booking
                </Link>
              </div>
            ) : (
              <div className="empty-state">
                No upcoming bookings. <Link to="/parking">Find a slot.</Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title-row">
              <h3>Your vehicles</h3>
              <Link to="/vehicles" style={{ fontSize: '0.82rem' }}>
                Manage →
              </Link>
            </div>
            {vehicles.length === 0 ? (
              <div className="empty-state">No vehicles added yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {vehicles.slice(0, 4).map((v) => (
                  <li key={v.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="mono">{v.vehicleNumber}</span> · {v.vehicleType}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="section-title-row">
              <h3>Recent history</h3>
              <Link to="/bookings" style={{ fontSize: '0.82rem' }}>
                View all →
              </Link>
            </div>
            {recentHistory.length === 0 ? (
              <div className="empty-state">No completed bookings yet.</div>
            ) : (
              <table className="data-table">
                <tbody>
                  {recentHistory.map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.parkingSlot?.slotNumber}</td>
                      <td className="mono">₹{b.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
