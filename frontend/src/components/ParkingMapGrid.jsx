import { useNavigate } from 'react-router-dom';

const STATUS_LEGEND = [
  { status: 'AVAILABLE', color: 'var(--status-available)' },
  { status: 'BOOKED', color: 'var(--status-booked)' },
  { status: 'OCCUPIED', color: 'var(--status-occupied)' },
  { status: 'MAINTENANCE', color: 'var(--status-maintenance)' },
];

const ParkingMapGrid = ({ slots, recommendedSlotId }) => {
  const navigate = useNavigate();

  const zones = [...new Set(slots.map((s) => s.zone))].sort();

  return (
    <div className="parking-map">
      <div className="entrance-marker">ENTRANCE</div>

      {zones.map((zone) => (
        <div className="map-zone" key={zone}>
          <div className="map-zone-label">ZONE {zone}</div>
          <div className="map-zone-slots">
            {slots
              .filter((s) => s.zone === zone)
              .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
              .map((slot) => (
                <button
                  key={slot.id}
                  className={`map-slot status-${slot.status} ${slot.id === recommendedSlotId ? 'recommended' : ''}`}
                  onClick={() => navigate(`/parking/${slot.id}`)}
                  title={`${slot.slotNumber} — ${slot.status}`}
                  type="button"
                >
                  {slot.hasCharger && <span className="ev-dot" title="EV charger" />}
                  {slot.slotNumber}
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="map-legend">
        {STATUS_LEGEND.map((l) => (
          <div className="legend-item" key={l.status}>
            <span className="swatch" style={{ background: l.color }} />
            {l.status}
          </div>
        ))}
        <div className="legend-item">
          <span className="swatch" style={{ background: 'var(--ev)' }} />
          EV CHARGER
        </div>
      </div>
    </div>
  );
};

export default ParkingMapGrid;
