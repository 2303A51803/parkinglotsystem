import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parkingApi, vehicleApi, bookingApi, extractErrorMessage } from '../services';
import StatusBadge from '../components/ui/StatusBadge';

const toLocalInputValue = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const ParkingSlotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [slot, setSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [vehicleId, setVehicleId] = useState('');
  const [startTime, setStartTime] = useState(toLocalInputValue(new Date(Date.now() + 10 * 60000)));
  const [expectedEndTime, setExpectedEndTime] = useState(
    toLocalInputValue(new Date(Date.now() + 2.5 * 60 * 60000))
  );
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [slotRes, vehiclesRes] = await Promise.all([parkingApi.getSlot(id), vehicleApi.list()]);
      setSlot(slotRes.data.data.slot);
      setVehicles(vehiclesRes.data.data.vehicles);
      if (vehiclesRes.data.data.vehicles.length > 0) {
        setVehicleId(vehiclesRes.data.data.vehicles[0].id);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setSubmitting(true);
    try {
      await bookingApi.create({
        vehicleId,
        parkingSlotId: id,
        startTime: new Date(startTime).toISOString(),
        expectedEndTime: new Date(expectedEndTime).toISOString(),
      });
      setBookingSuccess('Booking confirmed! Redirecting to your bookings…');
      setTimeout(() => navigate('/bookings'), 1200);
    } catch (err) {
      setBookingError(extractErrorMessage(err));
      // Refresh slot in case it just became unavailable (double-booking race)
      load();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading slot…</div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!slot) return null;

  const canBook = slot.status === 'AVAILABLE';

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/parking" style={{ fontSize: '0.85rem' }}>
            ← Back to map
          </Link>
          <h1 style={{ marginTop: 8 }}>
            Slot <span className="mono">{slot.slotNumber}</span>
          </h1>
          <p className="subtitle">
            Zone {slot.zone} · Floor {slot.floor}
          </p>
        </div>
        <StatusBadge status={slot.status} />
      </div>

      <div className="two-col">
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Slot details</h3>
          <table className="data-table">
            <tbody>
              <tr>
                <td>Vehicle compatibility</td>
                <td className="mono">{slot.vehicleTypes.join(', ')}</td>
              </tr>
              <tr>
                <td>Base price</td>
                <td className="mono">₹{slot.pricePerHour}/hour</td>
              </tr>
              <tr>
                <td>Distance from entrance</td>
                <td className="mono">{slot.distanceFromEntrance}m</td>
              </tr>
              <tr>
                <td>EV charger</td>
                <td className="mono">
                  {slot.hasCharger ? `Yes — ${slot.chargerStatus}` : 'No'}
                </td>
              </tr>
              <tr>
                <td>Current status</td>
                <td>
                  <StatusBadge status={slot.status} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Book this slot</h3>

          {!canBook && (
            <div className="empty-state">This slot is currently {slot.status.toLowerCase()} and can't be booked.</div>
          )}

          {canBook && vehicles.length === 0 && (
            <div className="empty-state">
              You need a vehicle to book. <Link to="/vehicles">Add one here.</Link>
            </div>
          )}

          {canBook && vehicles.length > 0 && (
            <form onSubmit={handleBook}>
              {bookingError && <div className="form-error">{bookingError}</div>}
              {bookingSuccess && <div className="form-success">{bookingSuccess}</div>}

              <div className="field">
                <label htmlFor="vehicleId">Vehicle</label>
                <select id="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="startTime">Arrival time</label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="expectedEndTime">Expected departure</label>
                  <input
                    id="expectedEndTime"
                    type="datetime-local"
                    value={expectedEndTime}
                    onChange={(e) => setExpectedEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.8rem' }}>
                Arrive within the grace period after your booking time or the reservation will
                automatically expire and the slot will be released.
              </p>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Booking…' : `Confirm booking · ₹${slot.pricePerHour}/hr base`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParkingSlotDetail;
