import { useEffect, useState } from 'react';
import { analyticsApi, extractErrorMessage } from '../../services';
import BarChart from '../../components/ui/BarChart';

const AdminAnalytics = () => {
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

  const { slots, peakHours, mostUsedSlots, vehicleTypeDistribution, evUsage, averageParkingDurationHours, totalRevenue } =
    data;

  const slotStatusData = [
    { label: 'AVAIL', value: slots.availableSlots },
    { label: 'BOOKED', value: slots.bookedSlots },
    { label: 'OCCUP', value: slots.occupiedSlots },
    { label: 'MAINT', value: slots.maintenanceSlots },
  ];

  const vehicleTypeData = Object.entries(vehicleTypeDistribution).map(([label, value]) => ({ label, value }));
  const mostUsedData = mostUsedSlots.map((s) => ({ label: s.slotNumber || '—', value: s.bookingCount }));
  const peakHourData = peakHours.map((h) => ({ label: `${h.hour}:00`, value: h.bookingCount }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="subtitle">Deeper usage patterns across the facility.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total revenue</div>
          <div className="value small">₹{totalRevenue}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg. parking duration</div>
          <div className="value small">{averageParkingDurationHours}h</div>
        </div>
        <div className="stat-card">
          <div className="label">EV slots total</div>
          <div className="value">{evUsage.evSlotsTotal}</div>
        </div>
        <div className="stat-card">
          <div className="label">EV slots in use</div>
          <div className="value">{evUsage.evSlotsInUse}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <div className="chart-title">Slot status distribution</div>
          <BarChart data={slotStatusData} color="var(--brand)" />
        </div>
        <div className="chart-card">
          <div className="chart-title">Vehicle-type distribution</div>
          <BarChart data={vehicleTypeData} color="var(--ev)" />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Peak parking hours</div>
          <BarChart data={peakHourData} color="var(--status-booked)" />
        </div>
        <div className="chart-card">
          <div className="chart-title">Most frequently used slots</div>
          <BarChart data={mostUsedData} color="var(--status-available)" />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
