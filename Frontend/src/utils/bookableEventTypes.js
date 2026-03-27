export const BOOKABLE_EVENT_TYPES = [
  "Corporate Event",
  "Conference",
  "Concert",
  "Sports Event",
  "Exhibition",
  "Seminar",
  "Charity Event",
];

export const isBookableEventType = (eventType) =>
  BOOKABLE_EVENT_TYPES.includes(String(eventType || "").trim());
