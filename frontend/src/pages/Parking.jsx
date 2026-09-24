import { useEffect, useState } from 'react';
import { parkingApi, vehicleApi, extractErrorMessage } from '../services';
import ParkingMapGrid from '../components/ParkingMapGrid';
import RecommendationList from '../components/RecommendationList';

const ZONES = ['A', 'B', 'C'];

const Parking = () => {
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [error, setError] = useState('');

  const [vehicleId, setVehicleId] = useState('');
  const [zone, setZone] = useState('');
  const [needsCharger, setNeedsCharger] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const { data } = await parkingApi.listSlots();
      setSlots(data.data.slots);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots();
    vehicleApi
      .list()
      .then(({ data }) => {
        setVehicles(data.data.vehicles);
        if (data.data.vehicles.length > 0) setVehicleId(data.data.vehicles[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const handleFindSlots = async (e) => {
    e.preventDefault();
    setRecError('');
    if (!selectedVehicle) {
      setRecError('Add a vehicle first to get recommendations.');
      return;
    }
    setRecLoading(true);
    try {
      const { data } = await parkingApi.recommend({
        vehicleType: selectedVehicle.vehicleType,
        zone: zone || undefined,
        needsCharger: needsCharger || selectedVehicle.vehicleType === 'EV',
      });
      setRecommendations(data.data.recommendations);
    } catch (err) {
      setRecError(extractErrorMessage(err));
    } finally {
      setRecLoading(false);
    }
  };

  const topRecommendedId = recommendations?.[0]?.slot?.id;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Parking</h1>
          <p className="subtitle">Tell us what you need — we'll tell you the best slot, and why.</p>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14 }}>Recommended For You</h3>

            {vehicles.length === 0 ? (
              <div className="empty-state">Add a vehicle on the Vehicles page to get recommendations.</div>
            ) : (
              <form onSubmit={handleFindSlots} style={{ marginBottom: 18 }}>
                <div className="field-row">
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
                  <div className="field">
                    <label htmlFor="zone">Preferred zone</label>
                    <select id="zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                      <option value="">Any zone</option>
                      {ZONES.map((z) => (
                        <option key={z} value={z}>
                          Zone {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={needsCharger}
                    onChange={(e) => setNeedsCharger(e.target.checked)}
                    disabled={selectedVehicle?.vehicleType === 'EV'}
                  />
                  {selectedVehicle?.vehicleType === 'EV'
                    ? 'EV charger required (automatic for EV vehicles)'
                    : 'I need EV charging'}
                </label>

                {recError && <div className="form-error">{recError}</div>}

                <button type="submit" className="btn btn-primary" disabled={recLoading}>
                  {recLoading ? 'Finding best slots…' : 'Find best slots'}
                </button>
              </form>
            )}

            {recommendations !== null && <RecommendationList recommendations={recommendations} />}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Live Occupancy Map</h3>
            {loadingSlots && <div className="loading-state">Loading map…</div>}
            {error && <div className="form-error">{error}</div>}
            {!loadingSlots && !error && <ParkingMapGrid slots={slots} recommendedSlotId={topRecommendedId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parking;
