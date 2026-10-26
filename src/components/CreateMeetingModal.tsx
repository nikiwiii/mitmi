import React, { useState } from "react";
import { X, Clock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

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
  onCreate,
}) => {
  const [title, setTitle] = useState("Spotkanie zespołu BIT Web");
  const [description, setDescription] = useState(
    "Ustalenie optymalnego terminu na warsztat projektowy.",
  );
  const [dates, setDates] = useState<string[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [datesError, setDatesError] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(19);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const minDate = [
    today.getFullYear().toString().padStart(4, "0"),
    (today.getMonth() + 1).toString().padStart(2, "0"),
    today.getDate().toString().padStart(2, "0"),
  ].join("-");
  const monthStart = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const monthDayOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays = [
    ...Array.from({ length: monthDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const formatDateValue = (day: number) =>
    [
      visibleMonth.getFullYear().toString().padStart(4, "0"),
      (visibleMonth.getMonth() + 1).toString().padStart(2, "0"),
      day.toString().padStart(2, "0"),
    ].join("-");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (dates.length === 0) {
      setDatesError(true);
      return;
    }

    setLoading(true);
    setCreationError("");
    try {
      await onCreate({
        title,
        description,
        dates,
        startHour: Number(startHour),
        endHour: Number(endHour),
      });
      onClose();
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć spotkania.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="#10b981" />
            <h3 className="modal-title">Nowe spotkanie</h3>
          </div>
          <button type="button" className="btn-icon-tiny" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="form-group">
            <label className="form-label">Nazwa wydarzenia / projektu</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Sala 104 lub Google Meet"
            />
          </div>

          <div className="form-group">
            <span className="form-label">Dni do wyboru</span>
            <div className="meeting-calendar">
              <div className="meeting-calendar-header">
                <button
                  type="button"
                  className="meeting-calendar-nav"
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                  disabled={
                    visibleMonth.getFullYear() === today.getFullYear() &&
                    visibleMonth.getMonth() === today.getMonth()
                  }
                  aria-label="Poprzedni miesiąc"
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  {new Intl.DateTimeFormat("pl-PL", {
                    month: "long",
                    year: "numeric",
                  }).format(visibleMonth)}
                </strong>
                <button
                  type="button"
                  className="meeting-calendar-nav"
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                  aria-label="Następny miesiąc"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="meeting-calendar-grid" role="group" aria-label="Wybierz dni spotkania">
                {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
                  <span className="meeting-calendar-weekday" key={day}>
                    {day}
                  </span>
                ))}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <span className="meeting-calendar-empty" key={`empty-${index}`} />;
                  }
                  const date = formatDateValue(day);
                  const isAdded = dates.includes(date);
                  return (
                    <button
                      type="button"
                      key={date}
                      className={`meeting-calendar-day${isAdded ? " added" : ""}`}
                      disabled={date < minDate}
                      aria-pressed={isAdded}
                      aria-label={`${day} ${new Intl.DateTimeFormat("pl-PL", {
                        month: "long",
                      }).format(visibleMonth)}${isAdded ? ", zaznaczono" : ""}`}
                      onClick={() => {
                        setDates((currentDates) =>
                          isAdded
                            ? currentDates.filter((item) => item !== date)
                            : [...currentDates, date].sort(),
                        );
                        setDatesError(false);
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            {dates.length > 0 && (
              <details className="meeting-date-details">
                <summary>Wybrane daty ({dates.length})</summary>
                <ul className="meeting-date-list" aria-label="Wybrane daty">
                  {dates.map((date) => (
                    <li className="meeting-date-chip" key={date}>
                      <span>
                        {new Intl.DateTimeFormat("pl-PL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(`${date}T00:00:00Z`))}
                      </span>
                      <button
                        type="button"
                        className="meeting-date-remove"
                        onClick={() =>
                          setDates((currentDates) =>
                            currentDates.filter((item) => item !== date),
                          )
                        }
                        aria-label={`Usuń datę ${date}`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {datesError && (
              <span className="form-error">
                Wybierz co najmniej jeden dzień.
              </span>
            )}
          </div>

          {creationError && (
            <div className="form-error" role="alert">
              {creationError}
            </div>
          )}

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Godzina rozpoczęcia</label>
              <select
                className="form-input"
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Godzina zakończenia</label>
              <select
                className="form-input"
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, index) => index + 1).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}:00
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
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
              {loading ? "Tworzenie..." : "Utwórz i wygeneruj link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
