import type { Appointment } from './booking';

export const CALENDAR_TITLE = 'DEMO — cita de prueba, no válida para atención';
const DEMO_DESCRIPTION = 'Propuesta privada no oficial. Evento sintético; no válida para atención. No se envían invitaciones ni recordatorios. Al reprogramar o cancelar, actualiza o elimina manualmente este evento personal.';

function utcStamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function googleCalendarUrl(appointment: Appointment, branchName: string): string {
  const end = new Date(Date.parse(appointment.startsAt) + appointment.durationMinutes * 60_000);
  const url = new URL('https://calendar.google.com/calendar/render');
  url.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: CALENDAR_TITLE,
    dates: `${utcStamp(appointment.startsAt)}/${utcStamp(end)}`,
    ctz: 'America/Lima',
    details: DEMO_DESCRIPTION,
    location: `${branchName} · sede referencial de la demo, sin dirección confirmada`,
  }).toString();
  return url.toString();
}

export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

/** RFC 5545 line folding: no more than 75 UTF-8 octets per physical line. */
export function foldIcsLine(value: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = '';
  let count = 0;
  for (const character of value) {
    const width = encoder.encode(character).length;
    if (count + width > 75) {
      lines.push(current);
      current = ' ';
      count = 1;
    }
    current += character;
    count += width;
  }
  lines.push(current);
  return lines.join('\r\n');
}

export function makeIcs(appointment: Appointment, branchName: string, now: Date = new Date()): string {
  const end = new Date(Date.parse(appointment.startsAt) + appointment.durationMinutes * 60_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Private Demo//Sonrie Contigo Proposal//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(appointment.id)}@sonrie-contigo.example.invalid`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(appointment.startsAt)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeIcsText(CALENDAR_TITLE)}`,
    `DESCRIPTION:${escapeIcsText(DEMO_DESCRIPTION)}`,
    `LOCATION:${escapeIcsText(`${branchName} · sede referencial de la demo, sin dirección confirmada`)}`,
    `STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(foldIcsLine).join('\r\n') + '\r\n';
}
