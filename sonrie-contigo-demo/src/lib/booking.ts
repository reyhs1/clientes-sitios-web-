import {
  demoAssignments,
  demoSessionWindows,
  durationForType,
  profiles,
  professionals,
  type AppointmentType,
} from '../data/fixtures';

export { profiles, professionals, durationForType, appointmentTypes } from '../data/fixtures';
export type { AppointmentType } from '../data/fixtures';
export type BranchId = keyof typeof demoAssignments;
export type AppointmentStatus = 'confirmed' | 'arrived' | 'cancelled';
export interface Slot {
  branchId: BranchId;
  professionalId: string;
  resourceId: string;
  startsAt: string;
  durationMinutes: number;
}
export interface Appointment extends Slot {
  id: string;
  type: AppointmentType;
  profileId: string;
  status: AppointmentStatus;
}
export interface DemoNotification {
  id: string;
  appointmentId: string;
  kind: 'confirmation' | 'reschedule' | 'cancellation' | 'reminder';
  message: string;
  status: 'Simulado, no enviado';
}
export interface Snapshot {
  appointments: Appointment[];
  notifications: DemoNotification[];
}
export type Clock = () => Date;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const limaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function limaDate(now: Date = new Date()): string {
  const parts = limaDateFormatter.formatToParts(now);
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function futureDates(now: Date = new Date()): string[] {
  const first = new Date(`${limaDate(now)}T12:00:00Z`);
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date(first);
    day.setUTCDate(day.getUTCDate() + index + 1);
    return day.toISOString().slice(0, 10);
  });
}

export function formatDate(value: string): string {
  const date = new Date(DATE_PATTERN.test(value) ? `${value}T17:00:00Z` : value);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long',
  }).format(date);
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value));
}

function allSlots(branchId: BranchId, date: string, type: AppointmentType, now: Date): Slot[] {
  const assignment = demoAssignments[branchId];
  const durationMinutes = durationForType(type);
  if (!assignment || !durationMinutes || !futureDates(now).includes(date)) return [];
  if (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) return [];
  return demoSessionWindows.flatMap(({ startHour, endHour }) => {
    const slots: Slot[] = [];
    for (let minutes = startHour * 60; minutes + durationMinutes <= endHour * 60; minutes += 30) {
      const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
      const minute = String(minutes % 60).padStart(2, '0');
      // Peru's current civil zone is UTC−05:00. Output UTC, never host-local dates.
      const startsAt = new Date(`${date}T${hour}:${minute}:00-05:00`).toISOString();
      if (Date.parse(startsAt) > now.getTime()) {
        slots.push({ branchId, ...assignment, startsAt, durationMinutes });
      }
    }
    return slots;
  });
}

export function overlaps(left: Slot, right: Slot): boolean {
  const startLeft = Date.parse(left.startsAt);
  const startRight = Date.parse(right.startsAt);
  return startLeft < startRight + right.durationMinutes * 60_000
    && startRight < startLeft + left.durationMinutes * 60_000;
}

function conflicts(slot: Slot, appointment: Appointment): boolean {
  return appointment.status !== 'cancelled'
    && (slot.professionalId === appointment.professionalId || slot.resourceId === appointment.resourceId)
    && overlaps(slot, appointment);
}

export function availableSlots(
  branchId: BranchId,
  date: string,
  type: AppointmentType,
  appointments: readonly Appointment[],
  now: Date = new Date(),
): Slot[] {
  return allSlots(branchId, date, type, now)
    .filter((slot) => !appointments.some((appointment) => conflicts(slot, appointment)));
}

const knownResourceIds = new Set<string>(Object.values(demoAssignments).map((item) => item.resourceId));
const knownStatuses = new Set<unknown>(['confirmed', 'arrived', 'cancelled']);
const knownNotificationKinds = new Set<unknown>(['confirmation', 'reschedule', 'cancellation', 'reminder']);
const demoIdPattern = /^DEMO-[A-Za-z0-9-]{1,100}$/;
const utcDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStoredAppointment(value: unknown): value is Appointment {
  if (!isRecord(value)
    || typeof value.id !== 'string' || !demoIdPattern.test(value.id)
    || typeof value.branchId !== 'string' || !Object.keys(demoAssignments).includes(value.branchId)
    || !profiles.some((profile) => profile.id === value.profileId)
    || !professionals.some((professional) => professional.id === value.professionalId)
    || typeof value.resourceId !== 'string' || !knownResourceIds.has(value.resourceId)
    || !knownStatuses.has(value.status)
    || (value.type !== 'evaluation' && value.type !== 'control')
    || value.durationMinutes !== durationForType(value.type)
    || typeof value.startsAt !== 'string' || !utcDatePattern.test(value.startsAt)) return false;
  const start = new Date(value.startsAt);
  if (!Number.isFinite(start.getTime()) || start.toISOString() !== value.startsAt) return false;
  const [hours, minutes] = formatTime(value.startsAt).split(':').map(Number);
  const minuteOfDay = hours * 60 + minutes;
  if (minutes !== 0 && minutes !== 30) return false;
  const isFixtureWindow = demoSessionWindows.some(({ startHour, endHour }) =>
    minuteOfDay >= startHour * 60 && minuteOfDay + (value.durationMinutes as number) <= endHour * 60);
  // Old valid session records remain inspectable; only new operations require future dates.
  return isFixtureWindow && new Date(`${limaDate(start)}T12:00:00Z`).getUTCDay() !== 0;
}

function isStoredNotification(value: unknown, appointmentIds: Set<string>): value is DemoNotification {
  return isRecord(value)
    && typeof value.id === 'string' && demoIdPattern.test(value.id)
    && typeof value.appointmentId === 'string' && appointmentIds.has(value.appointmentId)
    && knownNotificationKinds.has(value.kind)
    && value.status === 'Simulado, no enviado'
    && typeof value.message === 'string' && value.message.startsWith('DEMO · ') && value.message.length <= 1000;
}

/** Session storage is untrusted. Discard an inconsistent snapshot as one unit. */
function restoreSnapshot(initial: unknown): Snapshot {
  const empty: Snapshot = { appointments: [], notifications: [] };
  if (!isRecord(initial) || !Array.isArray(initial.appointments) || !Array.isArray(initial.notifications)) return empty;
  if (!initial.appointments.every(isStoredAppointment)) return empty;
  const appointments = initial.appointments;
  const appointmentIds = new Set(appointments.map((item) => item.id));
  if (appointmentIds.size !== appointments.length) return empty;
  if (appointments.some((item, index) => appointments.slice(index + 1).some((other) =>
    item.status !== 'cancelled' && conflicts(item, other)))) return empty;
  if (!initial.notifications.every((value) => isStoredNotification(value, appointmentIds))) return empty;
  const notifications = initial.notifications as DemoNotification[];
  const allIds = new Set([...appointmentIds, ...notifications.map((item) => item.id)]);
  if (allIds.size !== appointments.length + notifications.length) return empty;
  // Copy only the schema's fields; never retain arbitrary extra properties from storage.
  return {
    appointments: appointments.map((item) => ({
      id: item.id, branchId: item.branchId, professionalId: item.professionalId,
      resourceId: item.resourceId, startsAt: item.startsAt, durationMinutes: item.durationMinutes,
      type: item.type, profileId: item.profileId, status: item.status,
    })),
    notifications: notifications.map((item) => ({
      id: item.id, appointmentId: item.appointmentId, kind: item.kind,
      message: item.message, status: item.status,
    })),
  };
}

/** A single-tab synchronous demo repository. This is not a multiuser backend. */
export function makeRepository(initial?: unknown, clock: Clock = () => new Date()) {
  let snapshot: Snapshot = restoreSnapshot(initial);
  const listeners = new Set<() => void>();
  const uniqueId = () => `DEMO-${crypto.randomUUID()}`;

  function publish(next: Snapshot) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  function findAppointment(id: string): Appointment {
    const appointment = snapshot.appointments.find((item) => item.id === id);
    if (!appointment) throw new Error('No se encontró la cita de prueba. Vuelve a la agenda.');
    return appointment;
  }

  function validate(slot: Slot, type: AppointmentType, excludeId?: string) {
    const start = new Date(slot.startsAt);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= clock().getTime()) {
      throw new Error('El horario debe estar en el futuro. Selecciona otra fecha de prueba.');
    }
    const valid = allSlots(slot.branchId, limaDate(start), type, clock()).some((candidate) =>
      candidate.startsAt === slot.startsAt
      && candidate.professionalId === slot.professionalId
      && candidate.resourceId === slot.resourceId
      && candidate.durationMinutes === slot.durationMinutes);
    if (!valid) {
      throw new Error('El horario no pertenece a las franjas de prueba. Selecciona uno de la lista.');
    }
    if (snapshot.appointments.some((appointment) => appointment.id !== excludeId && conflicts(slot, appointment))) {
      throw new Error('Ese horario acaba de ocuparse. Elige otro; tu cita anterior se conserva.');
    }
  }

  function notification(appointment: Appointment, kind: DemoNotification['kind']): DemoNotification {
    const action = {
      confirmation: 'Confirmación', reschedule: 'Reprogramación',
      cancellation: 'Cancelación', reminder: 'Recordatorio',
    }[kind];
    return {
      id: uniqueId(), appointmentId: appointment.id, kind,
      message: `DEMO · ${action} de cita de prueba ${appointment.id}. ${formatDate(appointment.startsAt)}, ${formatTime(appointment.startsAt)} (Lima). No válida para atención.`,
      status: 'Simulado, no enviado',
    };
  }

  function replace(appointment: Appointment, kind?: DemoNotification['kind']) {
    publish({
      appointments: snapshot.appointments.map((item) => item.id === appointment.id ? appointment : item),
      notifications: kind ? [notification(appointment, kind), ...snapshot.notifications] : snapshot.notifications,
    });
    return appointment;
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    create: ({ slot, type, profileId }: { slot: Slot; type: AppointmentType; profileId: string }): Appointment => {
      if (!profiles.some((profile) => profile.id === profileId)) {
        throw new Error('Selecciona un perfil sintético de la lista. No se admiten datos personales.');
      }
      validate(slot, type);
      const appointment: Appointment = { ...slot, type, profileId, id: uniqueId(), status: 'confirmed' };
      publish({
        appointments: [...snapshot.appointments, appointment],
        notifications: [notification(appointment, 'confirmation'), ...snapshot.notifications],
      });
      return appointment;
    },
    reschedule: (id: string, slot: Slot): Appointment => {
      const original = findAppointment(id);
      if (original.status === 'cancelled') throw new Error('La cita está cancelada. Crea una nueva cita de prueba.');
      validate(slot, original.type, id);
      return replace({ ...original, ...slot, status: 'confirmed' }, 'reschedule');
    },
    cancel: (id: string): Appointment => {
      const original = findAppointment(id);
      if (original.status === 'cancelled') return original;
      return replace({ ...original, status: 'cancelled' }, 'cancellation');
    },
    arrive: (id: string): Appointment => {
      const original = findAppointment(id);
      if (original.status === 'cancelled') throw new Error('Una cita cancelada no puede marcarse como llegada.');
      return replace({ ...original, status: 'arrived' });
    },
    simulateReminder: (id: string): DemoNotification => {
      const appointment = findAppointment(id);
      if (appointment.status === 'cancelled') throw new Error('No se simulan recordatorios para citas canceladas.');
      const item = notification(appointment, 'reminder');
      publish({ ...snapshot, notifications: [item, ...snapshot.notifications] });
      return item;
    },
    reset: () => publish({ appointments: [], notifications: [] }),
  };
}

export type DemoRepository = ReturnType<typeof makeRepository>;
