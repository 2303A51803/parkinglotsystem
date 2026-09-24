import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi, extractErrorMessage } from '../services';
import StatusBadge from '../components/ui/StatusBadge';

const BookingDetail = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await bookingApi.get(id);
      setBooking(data.data.booking);
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

  const runAction = async (fn) => {
    setActionError('');
    setActionLoading(true);
    try {
      const { data } = await fn(id);
      setBooking(data.data.booking);
      if (data.data.payment) setPayment(data.data.payment);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading booking…</div>;
  if (error) return <div className="form-error">{error}</div>;
  if (!booking) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/bookings" style={{ fontSize: '0.85rem' }}>
            ← Back to bookings
          </Link>
          <h1 style={{ marginTop: 8 }}>Booking</h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="two-col">
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Details</h3>
          <table className="data-table">
            <tbody>
              <tr>
                <td>Slot</td>
                <td className="mono">{booking.parkingSlot?.slotNumber}</td>
              </tr>
              <tr>
                <td>Vehicle</td>
                <td className="mono">{booking.vehicle?.vehicleNumber}</td>
              </tr>
              <tr>
                <td>Arrival (planned)</td>
                <td className="mono">{new Date(booking.startTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Expected departure</td>
                <td className="mono">{new Date(booking.expectedEndTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Actual entry</td>
                <td className="mono">
                  {booking.actualEntryTime ? new Date(booking.actualEntryTime).toLocaleString() : '—'}
                </td>
              </tr>
              <tr>
                <td>Actual exit</td>
                <td className="mono">
                  {booking.actualExitTime ? new Date(booking.actualExitTime).toLocaleString() : '—'}
                </td>
              </tr>
              <tr>
                <td>Base price</td>
                <td className="mono">₹{booking.basePrice}/hr</td>
              </tr>
              <tr>
                <td>Price charged</td>
                <td className="mono">₹{booking.dynamicPrice}/hr</td>
              </tr>
              <tr>
                <td>Total amount</td>
                <td className="mono">{booking.totalAmount !== null ? `₹${booking.totalAmount}` : 'Pending exit'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {booking.status === 'BOOKED' && (
              <>
                <button className="btn btn-primary" disabled={actionLoading} onClick={() => runAction(bookingApi.entry)}>
                  Record vehicle entry
                </button>
                <button className="btn btn-danger" disabled={actionLoading} onClick={() => runAction(bookingApi.cancel)}>
                  Cancel booking
                </button>
              </>
            )}
            {booking.status === 'ACTIVE' && (
              <button className="btn btn-primary" disabled={actionLoading} onClick={() => runAction(bookingApi.exit)}>
                Record vehicle exit &amp; calculate fee
              </button>
            )}
            {['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(booking.status) && (
              <p>This booking is closed. No further actions available.</p>
            )}
          </div>

          {payment && (
            <div className="form-success" style={{ marginTop: 16 }}>
              Payment simulated successfully — ₹{payment.amount} ({payment.paymentMethod})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
