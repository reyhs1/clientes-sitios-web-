import { describe, expect, it, vi } from 'vitest';
import {
  availableSlots, formatDate, formatTime, futureDates, limaDate, makeRepository, overlaps,
  type Appointment, type AppointmentType, type BranchId, type Slot,
} from './booking';

const now = new Date('2026-10-28T20:00:00.000Z');
const clock = () => new Date(now);
const date = futureDates(now)[0];
const slot = (branchId: BranchId = 'centro', type: AppointmentType = 'evaluation'): Slot =>
  availableSlots(branchId, date, type, [], now)[0];

describe('Lima dates and fixture availability', () => {
  it('calculates the date in Lima, independent of the UTC day and host zone', () => {
    expect(limaDate(new Date('2026-10-28T02:00:00Z'))).toBe('2026-10-27');
    expect(futureDates(new Date('2026-10-28T02:00:00Z'))[0]).toBe('2026-10-28');
    expect(futureDates(now)).toHaveLength(14);
    expect(formatTime('2026-10-29T14:00:00Z')).toBe('09:00');
    expect(formatDate('2026-10-29')).toContain('29 de octubre');
  });

  it('offers only future fixture times, no Sundays, no past or out-of-window dates', () => {
    expect(availableSlots('centro', '2026-11-01', 'evaluation', [], now)).toEqual([]);
    expect(availableSlots('centro', '2026-10-27', 'evaluation', [], now)).toEqual([]);
    expect(availableSlots('centro', '2027-01-01', 'evaluation', [], now)).toEqual([]);
    const choices = availableSlots('centro', date, 'evaluation', [], now);
    expect(choices).toHaveLength(12);
    expect(choices[0].startsAt).toBe('2026-10-29T14:00:00.000Z');
    expect(choices.at(-1)?.startsAt).toBe('2026-10-29T22:30:00.000Z');
    expect(availableSlots('centro', date, 'control', [], now)[0].durationMinutes).toBe(20);
    expect(choices.every((choice) => Date.parse(choice.startsAt) > now.getTime())).toBe(true);
  });

  it('formats the same time after the machine timezone changes', () => {
    try {
      vi.stubEnv('TZ', 'Asia/Tokyo');
      expect(formatTime(slot().startsAt)).toBe('09:00');
      vi.stubEnv('TZ', 'America/Los_Angeles');
      expect(formatTime(slot().startsAt)).toBe('09:00');
      expect(limaDate(new Date('2026-10-28T02:00:00Z'))).toBe('2026-10-27');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('single-session atomic demo repository', () => {
  it('creates unique synthetic appointments and simulated notifications; rejects duplicate submission', () => {
    const repo = makeRepository(undefined, clock);
    let updates = 0;
    const unsubscribe = repo.subscribe(() => { updates += 1; });
    const result = repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' });
    expect(result.id).toMatch(/^DEMO-/);
    expect(result.status).toBe('confirmed');
    expect(repo.getSnapshot().appointments).toEqual([result]);
    expect(repo.getSnapshot().notifications[0]).toMatchObject({
      appointmentId: result.id, kind: 'confirmation', status: 'Simulado, no enviado',
    });
    expect(() => repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('acaba de ocuparse');
    expect(repo.getSnapshot().appointments).toHaveLength(1);
    expect(updates).toBe(1);
    unsubscribe();
    repo.reset();
    expect(updates).toBe(1);
  });

  it('prevents one professional being booked at the same time across different branches', () => {
    const repo = makeRepository(undefined, clock);
    repo.create({ slot: slot('centro'), type: 'evaluation', profileId: 'demo-01' });
    const choices = availableSlots('vista', date, 'evaluation', repo.getSnapshot().appointments, now);
    expect(choices.some((choice) => choice.startsAt === slot('centro').startsAt)).toBe(false);
    expect(() => repo.create({ slot: slot('vista'), type: 'evaluation', profileId: 'demo-02' }))
      .toThrow('acaba de ocuparse');
    const independent = repo.create({ slot: slot('esperanza'), type: 'evaluation', profileId: 'demo-02' });
    expect(independent.id).not.toBe(repo.getSnapshot().appointments[0].id);
    expect(repo.getSnapshot().appointments).toHaveLength(2);
  });

  it('blocks a resource collision even when the professional is different', () => {
    const resourceOccupier: Appointment = {
      ...slot(), professionalId: 'professional-02', id: 'DEMO-resource',
      type: 'evaluation', profileId: 'demo-02', status: 'confirmed',
    };
    const repo = makeRepository({ appointments: [resourceOccupier], notifications: [] }, clock);
    expect(() => repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('acaba de ocuparse');
  });

  it('rejects malformed schedules, wrong durations, modified resources and personal profiles', () => {
    const repo = makeRepository(undefined, clock);
    expect(() => repo.create({ slot: { ...slot(), startsAt: '2026-10-27T14:00:00.000Z' }, type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('futuro');
    expect(() => repo.create({ slot: { ...slot(), startsAt: 'not-a-date' }, type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('futuro');
    expect(() => repo.create({ slot: { ...slot(), startsAt: '2026-10-29T13:00:00.000Z' }, type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('franjas');
    expect(() => repo.create({ slot: { ...slot(), durationMinutes: 60 }, type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('franjas');
    expect(() => repo.create({ slot: { ...slot(), resourceId: 'unexpected' }, type: 'evaluation', profileId: 'demo-01' }))
      .toThrow('franjas');
    expect(() => repo.create({ slot: slot(), type: 'control', profileId: 'demo-01' }))
      .toThrow('franjas');
    expect(() => repo.create({ slot: slot(), type: 'evaluation', profileId: 'personal-profile' }))
      .toThrow('sintético');
    expect(repo.getSnapshot().appointments).toEqual([]);
  });

  it('validates a reschedule before freeing the original appointment', () => {
    const repo = makeRepository(undefined, clock);
    const firstSlot = slot();
    const secondSlot = availableSlots('centro', date, 'evaluation', [], now)[1];
    const first = repo.create({ slot: firstSlot, type: 'evaluation', profileId: 'demo-01' });
    repo.create({ slot: secondSlot, type: 'evaluation', profileId: 'demo-02' });
    const before = repo.getSnapshot();
    expect(() => repo.reschedule(first.id, secondSlot)).toThrow('acaba de ocuparse');
    expect(repo.getSnapshot()).toBe(before);
    expect(repo.getSnapshot().appointments[0]).toEqual(first);
    const thirdSlot = availableSlots('centro', date, 'evaluation', [], now)[2];
    const changed = repo.reschedule(first.id, thirdSlot);
    expect(changed.id).toBe(first.id);
    expect(changed.startsAt).toBe(thirdSlot.startsAt);
    expect(availableSlots('centro', date, 'evaluation', repo.getSnapshot().appointments, now))
      .toContainEqual(firstSlot);
    expect(repo.getSnapshot().notifications[0].kind).toBe('reschedule');
  });

  it('cancels once and immediately releases the appointment slot for another reservation', () => {
    const repo = makeRepository(undefined, clock);
    const created = repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' });
    repo.cancel(created.id);
    expect(availableSlots('centro', date, 'evaluation', repo.getSnapshot().appointments, now))
      .toContainEqual(slot());
    repo.cancel(created.id);
    expect(repo.getSnapshot().notifications.filter((item) => item.kind === 'cancellation')).toHaveLength(1);
    expect(() => repo.reschedule(created.id, slot())).toThrow('cancelada');
    expect(() => repo.arrive(created.id)).toThrow('cancelada');
    expect(() => repo.simulateReminder(created.id)).toThrow('canceladas');
    repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-02' });
    expect(repo.getSnapshot().appointments).toHaveLength(2);
  });

  it('marks arrival, simulates reminders without delivery, resets all synthetic state', () => {
    const repo = makeRepository(undefined, clock);
    const created = repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' });
    repo.arrive(created.id);
    expect(repo.getSnapshot().appointments[0].status).toBe('arrived');
    const reminder = repo.simulateReminder(created.id);
    expect(reminder.status).toBe('Simulado, no enviado');
    expect(reminder.message).toContain('DEMO');
    const restored = makeRepository(repo.getSnapshot(), clock);
    expect(restored.getSnapshot()).toEqual(repo.getSnapshot());
    repo.reset();
    expect(repo.getSnapshot()).toEqual({ appointments: [], notifications: [] });
  });

  it('uses half-open appointment intervals for adjacent slots', () => {
    const first = slot();
    expect(overlaps(first, { ...first, startsAt: '2026-10-29T14:30:00.000Z' })).toBe(false);
    expect(overlaps({ ...first, durationMinutes: 60 }, { ...first, startsAt: '2026-10-29T14:30:00.000Z' })).toBe(true);
  });
});

describe('safe restoration of synthetic session state', () => {
  const savedState = () => {
    const repo = makeRepository(undefined, clock);
    const created = repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' });
    repo.simulateReminder(created.id);
    return repo.getSnapshot();
  };

  it('preserves valid records, notifications and past records without sharing stored objects', () => {
    const initial = savedState();
    const restored = makeRepository(initial, () => new Date('2027-01-01T20:00:00Z')).getSnapshot();
    expect(restored).toEqual(initial);
    expect(restored).not.toBe(initial);
    expect(restored.appointments[0]).not.toBe(initial.appointments[0]);
    expect(restored.notifications[0]).not.toBe(initial.notifications[0]);
  });

  it('keeps cancelled records beside the replacement booking in the same slot', () => {
    const repo = makeRepository(undefined, clock);
    const first = repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-01' });
    repo.cancel(first.id);
    repo.create({ slot: slot(), type: 'evaluation', profileId: 'demo-02' });
    expect(makeRepository(repo.getSnapshot(), clock).getSnapshot()).toEqual(repo.getSnapshot());
  });

  it.each([undefined, null, {}, [], { appointments: null, notifications: [] }, { appointments: [], notifications: 'invalid' }, { appointments: [null], notifications: [] }])('discards a malformed snapshot without crashing: %j', (initial) => {
      expect(makeRepository(initial, clock).getSnapshot()).toEqual({ appointments: [], notifications: [] });
    });

  const invalidAppointmentFields: [string, unknown][] = [
    ['id', 'REAL-appointment'], ['id', null], ['branchId', 'unknown'], ['branchId', '__proto__'],
    ['profileId', 'real-patient'], ['professionalId', 'real-doctor'], ['resourceId', 'unknown'],
    ['status', 'booked'], ['status', null], ['type', 'clinical-diagnosis'], ['durationMinutes', 500],
    ['startsAt', 'not-a-date'], ['startsAt', '2026-02-31T14:00:00.000Z'],
    ['startsAt', '2026-10-29T04:00:00.000Z'], ['startsAt', '2026-11-01T14:00:00.000Z'],
    ['startsAt', '2026-10-29T14:15:00.000Z'], ['startsAt', '2026-10-29T09:00:00-05:00'],
  ];
  it.each(invalidAppointmentFields)('discards a snapshot with invalid appointment %s=%j', (field, value) => {
    const initial = structuredClone(savedState()) as unknown as { appointments: Record<string, unknown>[]; notifications: unknown[] };
    initial.appointments[0][field] = value;
    expect(makeRepository(initial, clock).getSnapshot()).toEqual({ appointments: [], notifications: [] });
  });

  const invalidNotificationFields: [string, unknown][] = [
    ['appointmentId', 'DEMO-unknown'], ['id', 'REAL-notification'], ['kind', 'delivered'],
    ['status', 'Enviado'], ['message', null], ['message', 'An actual patient message'],
  ];
  it.each(invalidNotificationFields)('discards a snapshot with invalid notification %s=%j', (field, value) => {
    const initial = structuredClone(savedState()) as unknown as { appointments: unknown[]; notifications: Record<string, unknown>[] };
    initial.notifications[0][field] = value;
    expect(makeRepository(initial, clock).getSnapshot()).toEqual({ appointments: [], notifications: [] });
  });

  it('rejects duplicate appointment and notification IDs and active collisions', () => {
    const duplicateAppointment = structuredClone(savedState());
    duplicateAppointment.appointments.push({ ...duplicateAppointment.appointments[0] });
    expect(makeRepository(duplicateAppointment, clock).getSnapshot().appointments).toEqual([]);
    const duplicateNotification = structuredClone(savedState());
    duplicateNotification.notifications.push({ ...duplicateNotification.notifications[0] });
    expect(makeRepository(duplicateNotification, clock).getSnapshot().appointments).toEqual([]);
    const collision = structuredClone(savedState());
    collision.appointments.push({ ...collision.appointments[0], id: 'DEMO-second', profileId: 'demo-02' });
    expect(makeRepository(collision, clock).getSnapshot().appointments).toEqual([]);
  });

  it('copies only permitted fields from a valid snapshot', () => {
    const initial = savedState();
    const extra = {
      ...initial, arbitrary: 'discard me',
      appointments: initial.appointments.map((item) => ({ ...item, arbitrary: 'discard me' })),
      notifications: initial.notifications.map((item) => ({ ...item, arbitrary: 'discard me' })),
    };
    expect(makeRepository(extra, clock).getSnapshot()).toEqual(initial);
    expect(makeRepository(extra, clock).getSnapshot().appointments[0]).not.toHaveProperty('arbitrary');
  });
});
