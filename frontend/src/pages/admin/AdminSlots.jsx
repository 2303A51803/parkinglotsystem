import { useEffect, useState } from 'react';
import { parkingApi, extractErrorMessage } from '../../services';
import StatusBadge from '../../components/ui/StatusBadge';

const VEHICLE_TYPES = ['BIKE', 'CAR', 'SUV', 'EV'];
const STATUSES = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'MAINTENANCE'];

const emptyForm = {
  slotNumber: '',
  floor: 0,
  zone: 'A',
  vehicleTypes: ['CAR'],
  pricePerHour: 30,
  distanceFromEntrance: 20,
  hasCharger: false,
  coordinates: { row: 0, col: 1 },
};

const AdminSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await parkingApi.listSlots();
      setSlots(data.data.slots);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleVehicleType = (type) => {
    setForm((f) => ({
      ...f,
      vehicleTypes: f.vehicleTypes.includes(type)
        ? f.vehicleTypes.filter((t) => t !== type)
        : [...f.vehicleTypes, type],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.vehicleTypes.length === 0) {
      setFormError('Select at least one compatible vehicle type');
      return;
    }
    setSubmitting(true);
    try {
      await parkingApi.createSlot(form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (slot, status) => {
    try {
      await parkingApi.updateSlot(slot.id, { status });
      await load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  const handleDelete = async (slot) => {
    if (!window.confirm(`Delete slot ${slot.slotNumber}? This cannot be undone.`)) return;
    try {
      await parkingApi.deleteSlot(slot.id);
      await load();
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Slots</h1>
          <p className="subtitle">Create slots and control their status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New slot'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 560 }}>
          {formError && <div className="form-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div className="field-row">
              <div className="field">
                <label>Slot number</label>
                <input
                  value={form.slotNumber}
                  onChange={(e) => setForm({ ...form, slotNumber: e.target.value })}
                  placeholder="e.g. A07"
                  required
                />
              </div>
              <div className="field">
                <label>Zone</label>
                <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} required />
              </div>
              <div className="field">
                <label>Floor</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Price per hour (₹)</label>
                <input
                  type="number"
                  value={form.pricePerHour}
                  onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="field">
                <label>Distance from entrance (m)</label>
                <input
                  type="number"
                  value={form.distanceFromEntrance}
                  onChange={(e) => setForm({ ...form, distanceFromEntrance: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Compatible vehicle types</label>
              <div className="pill-select">
                {VEHICLE_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={form.vehicleTypes.includes(t) ? 'selected' : ''}
                    onClick={() => toggleVehicleType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.hasCharger}
                onChange={(e) => setForm({ ...form, hasCharger: e.target.checked })}
              />
              Has EV charger
            </label>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create slot'}
            </button>
          </form>
        </div>
      )}

      {loading && <div className="loading-state">Loading slots…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Zone/Floor</th>
              <th>Types</th>
              <th>Price</th>
              <th>EV</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.slotNumber}</td>
                <td className="mono">
                  {s.zone} / {s.floor}
                </td>
                <td>{s.vehicleTypes.join(', ')}</td>
                <td className="mono">₹{s.pricePerHour}/hr</td>
                <td>{s.hasCharger ? 'Yes' : '—'}</td>
                <td>
                  <select value={s.status} onChange={(e) => handleStatusChange(s, e.target.value)}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>
                    Delete
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

export default AdminSlots;
