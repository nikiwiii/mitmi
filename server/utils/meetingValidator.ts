export interface CreateMeetingInput {
  title?: string;
  description?: string;
  dates?: string[];
  startHour?: number | string;
  endHour?: number | string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: {
    title: string;
    description: string;
    dates: string[];
    startHour: number;
    endHour: number;
  };
}

export function validateMeetingInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { isValid: false, error: "Nieprawidłowe dane spotkania" };
  }

  const { title, description, dates, startHour, endHour } = input as Record<
    string,
    unknown
  >;

  if (typeof title !== "string" || title.trim().length === 0) {
    return { isValid: false, error: "Tytuł spotkania jest wymagany" };
  }

  if (description !== undefined && typeof description !== "string") {
    return { isValid: false, error: "Nieprawidłowy opis spotkania" };
  }

  if (!Array.isArray(dates) || dates.length === 0) {
    return { isValid: false, error: "Wymagana jest przynajmniej jedna data" };
  }

  const now = new Date();
  const today = [
    now.getFullYear().toString().padStart(4, "0"),
    (now.getMonth() + 1).toString().padStart(2, "0"),
    now.getDate().toString().padStart(2, "0"),
  ].join("-");

  const invalidDates: string[] = [];
  const pastDates: string[] = [];
  const validDates: string[] = [];

  for (const value of dates) {
    if (typeof value !== "string") {
      invalidDates.push(String(value));
      continue;
    }

    const date = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) {
      invalidDates.push(date);
      continue;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [
      31,
      isLeapYear ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    if (
      year === 0 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > daysInMonth[month - 1]
    ) {
      invalidDates.push(date);
      continue;
    }

    if (date < today) {
      pastDates.push(date);
    }

    validDates.push(date);
  }

  if (invalidDates.length > 0) {
    return { isValid: false, error: "Nieprawidłowe daty" };
  }

  if (pastDates.length > 0) {
    return { isValid: false, error: "Wybrane daty są z przeszłości" };
  }

  const start = parseHour(startHour, 9);
  const end = parseHour(endHour, 18);

  if (
    start === null ||
    end === null ||
    start < 0 ||
    start >= 24 ||
    end < 1 ||
    end > 24 ||
    start >= end
  ) {
    return {
      isValid: false,
      error:
        "Nieprawidłowy zakres godzin (godziny muszą być całkowite, a startHour mniejszy niż endHour)",
    };
  }

  return {
    isValid: true,
    data: {
      title: title.trim(),
      description: (description || "").trim(),
      dates: Array.from(new Set(validDates)),
      startHour: start,
      endHour: end,
    },
  };
}

function parseHour(value: unknown, defaultValue: number): number | null {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

export interface SlotsValidationResult {
  isValid: boolean;
  error?: string;
  slots?: string[];
}

export function validateSlots(
  slots: unknown,
  meeting: { dates: string[]; startHour: number; endHour: number }
): SlotsValidationResult {
  if (!Array.isArray(slots)) {
    return {
      isValid: false,
      error: "Nieprawidłowy format slotów (wymagana tablica)",
    };
  }

  const maxPossibleSlots =
    meeting.dates.length * ((meeting.endHour - meeting.startHour) * 2 + 1);
  if (slots.length > Math.max(100, maxPossibleSlots * 2)) {
    return {
      isValid: false,
      error: "Zbyt duża liczba przekazanych slotów",
    };
  }

  const slotRegex = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;
  const allowedDates = new Set(meeting.dates);
  const validatedSlots: string[] = [];

  for (const item of slots) {
    if (typeof item !== "string") {
      return {
        isValid: false,
        error: "Każdy slot musi być ciągiem znaków",
      };
    }

    const trimmed = item.trim();
    const match = slotRegex.exec(trimmed);
    if (!match) {
      return {
        isValid: false,
        error: `Nieprawidłowy format slotu: "${trimmed}" (oczekiwany YYYY-MM-DDTHH:mm)`,
      };
    }

    const [, dateStr, hourStr, minuteStr] = match;
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    if (minute !== 0 && minute !== 30) {
      return {
        isValid: false,
        error: `Nieprawidłowy format minut w slocie: "${trimmed}" (dozwolone tylko :00 i :30)`,
      };
    }

    if (!allowedDates.has(dateStr)) {
      return {
        isValid: false,
        error: `Data slotu "${trimmed}" nie należy do zdefiniowanych dni spotkania`,
      };
    }

    const isWithinHours =
      hour >= meeting.startHour &&
      (hour < meeting.endHour || (hour === meeting.endHour && minute === 0));

    if (!isWithinHours) {
      return {
        isValid: false,
        error: `Godzina slotu "${trimmed}" wykracza poza ramy spotkania (${meeting.startHour}:00 - ${meeting.endHour}:00)`,
      };
    }

    validatedSlots.push(trimmed);
  }

  const uniqueSlots = Array.from(new Set(validatedSlots));

  return {
    isValid: true,
    slots: uniqueSlots,
  };
}

export const validateMeetingSlots = validateSlots;
