/** Synthetic demonstration data only. No professional or availability is real. */
export const profiles = [
  { id: 'demo-01', name: 'Paciente demo 01', email: 'paciente.demo01@example.invalid' },
  { id: 'demo-02', name: 'Paciente demo 02', email: 'paciente.demo02@example.invalid' },
  { id: 'demo-03', name: 'Paciente demo 03', email: 'paciente.demo03@example.invalid' },
] as const;

export const professionals = [
  { id: 'professional-01', name: 'Profesional demo 01' },
  { id: 'professional-02', name: 'Profesional demo 02' },
  { id: 'professional-03', name: 'Profesional demo 03' },
] as const;

export const appointmentTypes = [
  { id: 'evaluation', name: 'Primera evaluación', durationMinutes: 30 },
  { id: 'control', name: 'Control indicado por el profesional', durationMinutes: 20 },
] as const;

export type AppointmentType = (typeof appointmentTypes)[number]['id'];
export const durationForType = (type: AppointmentType): number =>
  appointmentTypes.find((item) => item.id === type)?.durationMinutes ?? 0;

/** The shared professional intentionally exercises cross-branch conflicts. */
export const demoAssignments = {
  centro: { professionalId: 'professional-01', resourceId: 'resource-centro-01' },
  vista: { professionalId: 'professional-01', resourceId: 'resource-vista-01' },
  esperanza: { professionalId: 'professional-02', resourceId: 'resource-esperanza-01' },
  chimbote: { professionalId: 'professional-03', resourceId: 'resource-chimbote-01' },
} as const;

export const demoSessionWindows = [
  { startHour: 9, endHour: 12 },
  { startHour: 15, endHour: 18 },
] as const;
