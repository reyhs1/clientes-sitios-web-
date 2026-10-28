/**
 * Datos de referencia, separados de la agenda sintética.
 * Intento de reverificación: 2026-10-28. El proxy de este entorno respondió 403.
 * Los nombres proceden del encargo aportado; no se presentan como reverificados.
 * No incorporar estos enlaces a adaptadores de envío ni convertirlos en contactos.
 */
export type VerificationStatus = 'verificado' | 'pendiente' | 'demostracion';
export type BranchId = 'centro' | 'vista' | 'esperanza' | 'chimbote';
export type City = 'Trujillo' | 'Nuevo Chimbote';

export interface Branch {
  id: BranchId;
  name: string;
  city: City;
  source: string;
  status: VerificationStatus;
  checkedAt: string;
}

export const business = {
  name: 'Sonríe Contigo',
  source: 'https://linktr.ee/sonriecontigo.pe',
  checkedAt: '2026-10-28',
  status: 'pendiente' as const,
  provenance: 'Nombres y sedes del encargo aportado; reverificación web pendiente por bloqueo del proxy.',
};

export const branches: Branch[] = [
  { id: 'centro', name: 'Centro de Trujillo', city: 'Trujillo', source: 'https://wa.link/yv8lmf', status: 'pendiente', checkedAt: '2026-10-28' },
  { id: 'vista', name: 'Vista Alegre', city: 'Trujillo', source: 'https://wa.link/nuar07', status: 'pendiente', checkedAt: '2026-10-28' },
  { id: 'esperanza', name: 'La Esperanza', city: 'Trujillo', source: 'https://wa.link/rezhse', status: 'pendiente', checkedAt: '2026-10-28' },
  { id: 'chimbote', name: 'Nuevo Chimbote', city: 'Nuevo Chimbote', source: 'https://wa.link/6cajnu', status: 'pendiente', checkedAt: '2026-10-28' },
];
