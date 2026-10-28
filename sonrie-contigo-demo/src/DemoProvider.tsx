import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { makeRepository, type Snapshot, type BranchId } from './lib/booking';

const STORAGE_KEY = 'sonrie-demo-state-v1';
function restore(): Snapshot | undefined {
  try { const raw = sessionStorage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) as Snapshot : undefined; return data && Array.isArray(data.appointments) && Array.isArray(data.notifications) ? data : undefined; } catch { return undefined; }
}
type Repository = ReturnType<typeof makeRepository>;
const Context = createContext<{repo: Repository; snapshot: Snapshot; selectedBranch: BranchId; setSelectedBranch: (id: BranchId) => void; reset: () => void; storageAvailable: boolean} | null>(null);
export function DemoProvider({children}: {children: ReactNode}) {
  const [repo] = useState(() => makeRepository(restore()));
  const snapshot = useSyncExternalStore(repo.subscribe, repo.getSnapshot);
  const [selectedBranch, select] = useState<BranchId>(() => { try { const value = sessionStorage.getItem('sonrie-demo-branch'); return ['centro','vista','esperanza','chimbote'].includes(value ?? '') ? value as BranchId : 'centro'; } catch { return 'centro'; } });
  const [storageAvailable] = useState(() => { try { sessionStorage.setItem('sonrie-storage-check', '1'); sessionStorage.removeItem('sonrie-storage-check'); return true; } catch { return false; } });
  // Persist only synthetic state; this session is deliberately not shared across users/tabs.
  useEffect(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* In-memory workflow remains usable. */ } }, [snapshot]);
  function setSelectedBranch(id: BranchId) { select(id); try { sessionStorage.setItem('sonrie-demo-branch', id); } catch { /* memory fallback */ } }
  function reset() { repo.reset(); setSelectedBranch('centro'); try { sessionStorage.removeItem('sonrie-demo-draft'); } catch { /* memory fallback */ } }
  return <Context.Provider value={{repo,snapshot,selectedBranch,setSelectedBranch,reset,storageAvailable}}>{children}</Context.Provider>;
}
export function useDemo() { const value=useContext(Context); if(!value) throw new Error('DemoProvider requerido'); return value; }
