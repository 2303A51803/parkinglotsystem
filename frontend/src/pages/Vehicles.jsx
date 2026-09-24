import { useEffect, useState } from 'react';
import { vehicleApi, extractErrorMessage } from '../services';

const VEHICLE_TYPES = ['BIKE', 'CAR', 'SUV', 'EV'];
const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID'];

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [fuelType, setFuelType] = useState('PETROL');

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await vehicleApi.list();
      setVehicles(data.data.vehicles);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const resetForm = () => {
    setVehicleNumber('');
    setVehicleType('CAR');
    setFuelType('PETROL');
    setFormError('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await vehicleApi.create({ vehicleNumber, vehicleType, fuelType });
      resetForm();
      setShowForm(false);
      await loadVehicles();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle? This cannot be undone.')) return;
    try {
      await vehicleApi.remove(id);
      await loadVehicles();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Vehicles</h1>
          <p className="subtitle">Vehicles you can book parking for.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add vehicle'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
          {formError && <div className="form-error">{formError}</div>}
          <form onSubmit={handleAdd}>
            <div className="field">
              <label htmlFor="vehicleNumber">Vehicle number</label>
              <input
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TS09AB1234"
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="vehicleType">Vehicle type</label>
                <select id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="fuelType">Fuel type</label>
                <select
                  id="fuelType"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  disabled={vehicleType === 'EV'}
                >
                  {FUEL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add vehicle'}
            </button>
          </form>
        </div>
      )}

      {loading && <div className="loading-state">Loading vehicles…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && vehicles.length === 0 && (
        <div className="empty-state">
          No vehicles yet. Add one to start booking parking.
        </div>
      )}

      {!loading && vehicles.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Type</th>
              <th>Fuel</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="mono">{v.vehicleNumber}</td>
                <td>{v.vehicleType}</td>
                <td>{v.fuelType}</td>
                <td className="mono">{new Date(v.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Vehicles;
