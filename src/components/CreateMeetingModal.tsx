import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    dates: string[];
    startHour: number;
    endHour: number;
  }) => Promise<void>;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('Spotkanie zespołu BIT Web');
  const [description, setDescription] = useState('Ustalenie optymalnego terminu na warsztat projektowy.');
  const [datesStr, setDatesStr] = useState('2026-10-24, 2026-10-25, 2026-10-26, 2026-10-27');
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(19);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // rozdzielenie dat
    const dates = datesStr
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await onCreate({
        title,
        description,
        dates,
        startHour: Number(startHour),
        endHour: Number(endHour)
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#10b981" />
            <h3 className="modal-title">Nowe spotkanie</h3>
          </div>
          <button
            type="button"
            className="btn-icon-tiny"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nazwa wydarzenia / projektu</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. BIT Web Sprint Planning"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Opis (opcjonalny)</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="np. Sala 104 lub Google Meet"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dni do wyboru (oddzielone przecinkami RRRR-MM-DD)</label>
            <input
              type="text"
              className="form-input"
              value={datesStr}
              onChange={e => setDatesStr(e.target.value)}
              placeholder="2026-10-24, 2026-10-25"
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Godzina rozpoczęcia</label>
              <input
                type="number"
                min="0"
                max="23"
                className="form-input"
                value={startHour}
                onChange={e => setStartHour(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Godzina zakończenia</label>
              <input
                type="number"
                min="1"
                max="24"
                className="form-input"
                value={endHour}
                onChange={e => setEndHour(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="action-btn-secondary"
              onClick={onClose}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="action-btn-primary"
              disabled={loading}
            >
              {loading ? 'Tworzenie...' : 'Utwórz i wygeneruj link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
