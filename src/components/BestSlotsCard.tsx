import React from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { UserAvailability } from '../types.js';

interface BestSlotsCardProps {
  participants: UserAvailability[];
  bestSlot: { date: string; time: string; count: number } | null;
  onSelectSlot?: (slot: string) => void;
}

export const BestSlotsCard: React.FC<BestSlotsCardProps> = ({
  participants,
  bestSlot,
  onSelectSlot
}) => {
  const total = participants.length;
  const count = bestSlot ? bestSlot.count : 0;
  const percentage = total > 0 && bestSlot ? Math.round((count / total) * 100) : 0;

  // formatowanie daty
  const formatDateFull = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = bestSlot ? formatDateFull(bestSlot.date) : 'Wybierz sloty w ankiecie';
  const timeRange = bestSlot ? `${bestSlot.time} — 1.5h` : 'Brak danych';

  return (
    <div className="forecast-card">
      <div className="forecast-header">
        <div>
          <span className="forecast-title">Rekomendowany termin koła</span>
          <div className="forecast-best-slot">
            <span>{formattedDate}, {timeRange}</span>
            {bestSlot && (
              <span className="forecast-tag">
                <CheckCircle2 size={13} />
                {percentage}% zgodności ({count}/{total} osób)
              </span>
            )}
          </div>
          <span className="forecast-sub">
            Optymalny przedział czasowy z najwyższą frekwencją członków BIT Web
          </span>
        </div>
      </div>

      <div className="breakdown-bar-container">
        <div className="breakdown-strip">
          <div className="seg-col seg-unused">
            <div className="seg-label">60%</div>
            <div className="strip-segment-unused">
              {[...Array(34)].map((_, i) => (
                <div key={i} className="strip-dot" />
              ))}
            </div>
          </div>
          <div className="seg-col seg-used">
            <div className="seg-label">30%</div>
            <div className="strip-segment-used" />
          </div>
          <div className="seg-col seg-reserved">
            <div className="seg-label">45%</div>
            <div className="strip-segment-reserved">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="strip-block-green" />
              ))}
            </div>
          </div>
        </div>

        <div className="breakdown-legend">
          <div className="legend-item">
            <div className="legend-item-dot" style={{ background: '#3fb0e6' }} />
            <span>Niezagospodarowane</span>
          </div>
          <div className="legend-item">
            <div className="legend-item-dot" style={{ background: '#f07a12' }} />
            <span>Częściowa obecność</span>
          </div>
          <div className="legend-item">
            <div className="legend-item-dot" style={{ background: '#2f9e45' }} />
            <span>Rekomendowany blok</span>
          </div>
        </div>
      </div>

      <div className="forecast-confidence-bar">
        <div className="confidence-left">
          <AlertCircle size={15} color="#b45309" />
          <span>Wskaźnik pewności terminu</span>
        </div>
        <div className="confidence-right">
          <span>{percentage > 0 ? `${Math.min(98, percentage + 5)}%` : '85%'}</span> vs pozostałe opcje
        </div>
      </div>
    </div>
  );
};
