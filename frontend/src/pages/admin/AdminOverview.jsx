import { useEffect, useState } from 'react';
import { analyticsApi, extractErrorMessage } from '../../services';
import BarChart from '../../components/ui/BarChart';

const AdminOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsApi
      .overview()
      .then(({ data }) => setData(data.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading analytics…</div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!data) return null;

  const { slots, occupancyPercentage, todaysRevenue, todaysBookings, peakHours, prediction } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Overview</h1>
          <p className="subtitle">Facility status at a glance.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total slots</div>
          <div className="value">{slots.totalSlots}</div>
        </div>
        <div className="stat-card">
          <div className="label">Available</div>
          <div className="value" style={{ color: 'var(--status-available)' }}>
            {slots.availableSlots}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Booked</div>
          <div className="value" style={{ color: 'var(--status-booked)' }}>
            {slots.bookedSlots}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Occupied</div>
          <div className="value" style={{ color: 'var(--status-occupied)' }}>
            {slots.occupiedSlots}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Maintenance</div>
          <div className="value" style={{ color: 'var(--status-maintenance)' }}>
            {slots.maintenanceSlots}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Occupancy</div>
          <div className="value">{occupancyPercentage}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Today's revenue</div>
          <div className="value small">₹{todaysRevenue}</div>
        </div>
        <div className="stat-card">
          <div className="label">Today's bookings</div>
          <div className="value">{todaysBookings}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Peak parking hours (by entry count)</div>
          <BarChart
            data={peakHours.map((h) => ({ label: `${h.hour}:00`, value: h.bookingCount }))}
            color="var(--brand)"
          />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Occupancy prediction</h3>
          <p>
            Current: <strong>{prediction.currentOccupancy}%</strong> · Predicted:{' '}
            <strong>{prediction.predictedOccupancy}%</strong>
          </p>
          <p>
            Demand level: <strong>{prediction.demandLevel}</strong>
          </p>
          <p style={{ fontSize: '0.85rem' }}>{prediction.recommendation}</p>
          {!prediction.basedOnHistory && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
              (Based on current occupancy — not enough historical data yet for this hour.)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
