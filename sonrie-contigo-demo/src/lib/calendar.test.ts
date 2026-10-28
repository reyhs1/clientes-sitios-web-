import { describe, expect, it } from 'vitest';
import ICAL from 'ical.js';
import { availableSlots, futureDates, makeRepository } from './booking';
import { CALENDAR_TITLE, escapeIcsText, foldIcsLine, googleCalendarUrl, makeIcs } from './calendar';

const now = new Date('2026-10-28T20:00:00.000Z');
const repo = () => makeRepository(undefined, () => now);
const appointment = () => repo().create({
  slot: availableSlots('centro', futureDates(now)[0], 'evaluation', [], now)[0],
  type: 'evaluation', profileId: 'demo-01',
});

describe('calendar artifacts without account connections', () => {
  it('creates a prefilled Google Calendar template using UTC dates and Lima timezone', () => {
    const item = appointment();
    const url = new URL(googleCalendarUrl(item, 'Centro de Trujillo'));
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.pathname).toBe('/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(CALENDAR_TITLE);
    expect(url.searchParams.get('dates')).toBe('20261029T140000Z/20261029T143000Z');
    expect(url.searchParams.get('ctz')).toBe('America/Lima');
    expect(url.searchParams.get('details')).toContain('manualmente');
    expect(url.searchParams.has('add')).toBe(false);
    expect(url.toString()).not.toContain('paciente');
    expect(url.toString()).not.toContain('demo01');
  });

  it('downloads RFC5545 data independently parsed with UTC, stable UID, accents and no patient information', () => {
    const item = appointment();
    const output = makeIcs(item, 'Centro de Trujillo', now);
    const component = new ICAL.Component(ICAL.parse(output));
    const event = new ICAL.Event(component.getFirstSubcomponent('vevent')!);
    expect(event.summary).toBe(CALENDAR_TITLE);
    expect(event.uid).toContain(item.id);
    expect(event.startDate.toJSDate().toISOString()).toBe(item.startsAt);
    expect(event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime()).toBe(30 * 60_000);
    const stamp = event.component.getFirstPropertyValue('dtstamp');
    expect(stamp).toBeInstanceOf(ICAL.Time);
    if (!(stamp instanceof ICAL.Time)) throw new Error('DTSTAMP must parse as an ICAL time');
    expect(stamp.toJSDate().toISOString()).toBe(now.toISOString());
    expect(event.component.getAllProperties('attendee')).toHaveLength(0);
    expect(event.component.getAllProperties('organizer')).toHaveLength(0);
    expect(output).not.toMatch(/paciente|demo01|tel:|mailto:|BEGIN:VALARM/i);
    expect(event.description).toContain('Evento sintético; no válida para atención.');
    expect(output.endsWith('\r\n')).toBe(true);
    expect(output.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    const changed = new ICAL.Component(ICAL.parse(makeIcs({ ...item, startsAt: '2026-10-29T15:00:00.000Z' }, 'Centro de Trujillo', now)));
    expect(new ICAL.Event(changed.getFirstSubcomponent('vevent')!).uid).toBe(event.uid);
  });

  it('escapes punctuation and line breaks without allowing calendar-property injection', () => {
    const branchName = 'Sede, referencial; Trujillo\\demo\nSegunda línea\r\nATTENDEE:malicious';
    const output = makeIcs(appointment(), branchName, now);
    const component = new ICAL.Component(ICAL.parse(output));
    const event = new ICAL.Event(component.getFirstSubcomponent('vevent')!);
    expect(event.location).toContain(branchName.replace(/\r\n/g, '\n'));
    expect(event.component.getAllProperties('attendee')).toHaveLength(0);
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds long UTF-8 content by octets, preserving every codepoint', () => {
    const line = `SUMMARY:${'á🙂'.repeat(50)}`;
    const folded = foldIcsLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    for (const physical of folded.split('\r\n')) {
      expect(new TextEncoder().encode(physical).length).toBeLessThanOrEqual(75);
    }
  });
});
