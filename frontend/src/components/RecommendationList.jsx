import { useNavigate } from 'react-router-dom';

const RANK_LABELS = ['⭐ Best Match', 'Second Best', 'Third Best'];

const RecommendationList = ({ recommendations }) => {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="empty-state">
        No matching slots right now. Try widening your zone/floor preference or removing the EV filter.
      </div>
    );
  }

  return (
    <div className="rec-list">
      {recommendations.map((item, index) => (
        <div className={`rec-card ${index === 0 ? 'best' : ''}`} key={item.slot.id}>
          <div className="rec-score">
            {item.score}
            <span className="of100">/ 100</span>
          </div>
          <div className="rec-body">
            <div className="rec-rank-label">{RANK_LABELS[index] || `Match ${index + 1}`}</div>
            <div className="rec-slot-number">Slot {item.slot.slotNumber}</div>
            <ul className="rec-reasons">
              {item.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/parking/${item.slot.id}`)}>
            Book This Slot
          </button>
        </div>
      ))}
    </div>
  );
};

export default RecommendationList;
