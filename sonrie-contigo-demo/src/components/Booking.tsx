import { useEffect, useRef, useState } from 'react';
import { useDemo } from '../DemoProvider';
import { branches, type BranchId, type City } from '../data/business';
import { appointmentTypes, availableSlots, durationForType, formatDate, formatTime, futureDates, profiles, professionals, type AppointmentType, type Slot } from '../lib/booking';
import { Icon } from './UI';

interface Draft { step: number; branchId: BranchId | ''; city: City; type: AppointmentType; date: string; slot?: Slot; profileId: string; appointmentId?: string }
const draftKey = 'sonrie-demo-draft';
function loadDraft(branchId: BranchId, appointmentId: string | undefined, appointments: ReturnType<typeof useDemo>['snapshot']['appointments']): Draft {
  const appointment = appointments.find(item => item.id === appointmentId);
  const defaultBranch = appointment?.branchId ?? branchId;
  const initial: Draft = { step: 1, branchId: defaultBranch, city: branches.find(item => item.id === defaultBranch)!.city, type: appointment?.type ?? 'evaluation', date: futureDates()[0], profileId: appointment?.profileId ?? profiles[0].id, appointmentId };
  try {
    const raw = sessionStorage.getItem(draftKey);
    const saved = raw ? JSON.parse(raw) as Draft : undefined;
    if (saved && saved.appointmentId === appointmentId && (appointmentId || saved.branchId === defaultBranch) && branches.some(item => item.id === saved.branchId && item.city === saved.city) && futureDates().includes(saved.date) && saved.step >= 1 && saved.step <= 4 && appointmentTypes.some(item => item.id === saved.type) && profiles.some(item => item.id === saved.profileId)) return saved;
  } catch { /* Invalid local drafts are discarded, never sent elsewhere. */ }
  return initial;
}

export default function Booking({appointmentId}: {appointmentId?: string}) {
  const {repo, snapshot, selectedBranch, setSelectedBranch} = useDemo();
  const [draft, setDraft] = useState(() => loadDraft(selectedBranch, appointmentId, snapshot.appointments));
  const [loading, setLoading] = useState(true);
  const [loadVersion, setLoadVersion] = useState(0);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState(false);
  const [forceEmpty, setForceEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dates = futureDates();
  const original = snapshot.appointments.find(item => item.id === appointmentId);
  const appointments = snapshot.appointments.filter(item => item.id !== appointmentId);
  const branch = branches.find(item => item.id === draft.branchId);
  const slots = !forceEmpty && draft.branchId ? availableSlots(draft.branchId, draft.date, draft.type, appointments) : [];
  const profile = profiles.find(item => item.id === draft.profileId)!;
  const professional = professionals.find(item => item.id === draft.slot?.professionalId);
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 220); return () => clearTimeout(timer); }, [loadVersion]);
  useEffect(() => { try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* Memory-only mode. */ } }, [draft]);
  useEffect(() => { heading.current?.focus(); }, [draft.step]);

  function update(values: Partial<Draft>) { setDraft(previous => ({...previous, ...values})); setError(''); }
  function requestLoading() { setLoading(true); setLoadVersion(value => value + 1); }
  function chooseBranch(id: BranchId) { setSelectedBranch(id); update({branchId: id, slot: undefined}); requestLoading(); setForceEmpty(false); setAvailabilityError(false); }
  function chooseDate(date: string) { update({date, slot: undefined}); requestLoading(); setForceEmpty(false); setAvailabilityError(false); }
  function firstAvailable() {
    if (!draft.branchId) { setError('Elige una sede para buscar su primer horario de prueba.'); return; }
    for (const date of dates) {
      const first = availableSlots(draft.branchId, date, draft.type, appointments)[0];
      if (first) { update({date, slot:first, step:2}); requestLoading(); setForceEmpty(false); setAvailabilityError(false); return; }
    }
    setError('No hay horarios de prueba en los próximos 14 días. Puedes revisar otra sede.');
  }
  function next() {
    if (draft.step === 1 && !draft.branchId) { setError('Selecciona explícitamente una sede de la ciudad elegida.'); return; }
    if (draft.step === 2 && !draft.slot) { setError('Selecciona un horario de prueba para continuar.'); return; }
    update({step: Math.min(draft.step + 1, 4)});
  }
  function submit() {
    if (lock.current || !draft.slot) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const appointment = appointmentId ? repo.reschedule(appointmentId, draft.slot) : repo.create({slot: draft.slot, type:draft.type, profileId:draft.profileId});
      try { sessionStorage.removeItem(draftKey); } catch { /* Memory-only mode. */ }
      window.location.hash = `/cita/${appointment.id}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar. Elige otro horario e inténtalo nuevamente.');
      setDraft(previous => ({...previous, step:2, slot:undefined}));
      lock.current=false; setBusy(false);
    }
  }
  function occupySelected() {
    if (!draft.slot) return;
    try { repo.create({slot:draft.slot,type:draft.type,profileId:profiles[2].id}); setError('Otro perfil sintético acaba de ocupar este horario. Al confirmar se volverá a validar; puedes elegir otro.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo simular la ocupación.'); }
  }
  if (appointmentId && (!original || original.status === 'cancelled')) return <main id="main-content" tabIndex={-1} className="page-shell narrow"><h1>Esta cita no puede reprogramarse</h1><p>La referencia no existe o ya fue cancelada.</p><a className="button" href="#/reservar">Crear otra cita de prueba</a></main>;
  return <main id="main-content" tabIndex={-1} className="page-shell narrow booking-page">
    <a className="text-link" href={appointmentId ? `#/cita/${appointmentId}` : '#/inicio'}><Icon name="back"/> {appointmentId ? 'Volver a la cita' : 'Volver al inicio'}</a>
    <div className="page-heading"><h1>{appointmentId ? 'Reprograma tu cita de prueba.' : 'Un espacio en tu agenda.'}</h1><p>{appointmentId ? 'Tu cita actual se conserva hasta validar el nuevo horario.' : 'Elige una sede y recorre la experiencia. Todos los datos son de demostración.'}</p></div>
    <ol className="steps" aria-label="Pasos de reserva">{['Sede y cita','Fecha y hora','Perfil demo','Resumen'].map((label,index)=><li key={label} className={`step ${draft.step===index+1?'active':''} ${draft.step>index+1?'complete':''}`} aria-current={draft.step===index+1?'step':undefined}><span>{draft.step>index+1?<Icon name="check" size={14}/>:index+1}</span>{label}</li>)}</ol>
    <div className="panel booking-panel">
      <h2 ref={heading} tabIndex={-1}>{['Elige dónde empezar','Encuentra tu horario de prueba','Un perfil, solo de prueba','Revisa antes de confirmar'][draft.step-1]}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {draft.step===1 && <>
        <fieldset className="field"><legend>Ciudad</legend><div className="segmented">{(['Trujillo','Nuevo Chimbote'] as const).map(city=><button key={city} type="button" className={draft.city===city?'selected':''} aria-pressed={draft.city===city} onClick={()=>{if(city!==draft.city) update({city,branchId:'',slot:undefined});}}>{city}</button>)}</div></fieldset>
        <fieldset className="field"><legend>Sede</legend><div className="option-grid">{branches.filter(item=>item.city===draft.city).map(item=><button key={item.id} className={`option ${draft.branchId===item.id?'selected':''}`} aria-pressed={draft.branchId===item.id} onClick={()=>chooseBranch(item.id)}><Icon name="pin"/><span><strong>{item.name}</strong><small>{item.city}</small></span>{draft.branchId===item.id&&<Icon name="check"/>}</button>)}</div></fieldset>
        <fieldset className="field"><legend>Tipo de cita de prueba</legend><div className="option-grid">{appointmentTypes.map(item=><button key={item.id} disabled={Boolean(appointmentId)} className={`option ${draft.type===item.id?'selected':''}`} aria-pressed={draft.type===item.id} onClick={()=>{update({type:item.id,slot:undefined});requestLoading();}}><span><strong>{item.name}</strong><small>{item.durationMinutes} minutos · duración de demostración</small></span>{draft.type===item.id&&<Icon name="check"/>}</button>)}</div></fieldset>
        <p className="hint">Sedes según el encargo; datos pendientes de reverificación. No se ofrecen diagnósticos ni disponibilidad real.</p>
      </>}
      {draft.step===2 && <>
        <div className="booking-context"><Icon name="pin"/><strong>{branch?.name}</strong><span>{durationForType(draft.type)} min · prueba</span><button className="text-link" onClick={()=>update({step:1})}>Cambiar sede</button></div>
        <p className="hint">Horarios, profesional y recurso sintéticos. Todas las horas corresponden a Lima (UTC−5).</p>
        <button className="button secondary" onClick={firstAvailable}><Icon name="spark"/> Primer horario disponible</button>
        <fieldset className="field"><legend>Fecha de prueba</legend><div className="date-grid">{dates.map(date=><button key={date} className={`date-option ${draft.date===date?'selected':''}`} aria-pressed={draft.date===date} onClick={()=>chooseDate(date)}><span className="sr-only">{formatDate(date)}</span><span aria-hidden="true">{new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',weekday:'short'}).format(new Date(`${date}T17:00:00Z`))}</span><strong aria-hidden="true">{date.slice(-2)}</strong><small aria-hidden="true">{new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',month:'short'}).format(new Date(`${date}T17:00:00Z`))}</small></button>)}</div></fieldset>
        <fieldset className="field"><legend>Horario de prueba · Lima</legend>{loading?<p className="notice" role="status">Buscando horarios de demostración…</p>:availabilityError?<div className="notice"><p role="alert">No se pudieron cargar los horarios de prueba.</p><button className="button secondary" onClick={()=>{setAvailabilityError(false);setLoading(false);}}>Reintentar carga</button></div>:slots.length?<div className="time-grid">{slots.map(slot=><button key={slot.startsAt} className={`time-option ${draft.slot?.startsAt===slot.startsAt?'selected':''}`} aria-pressed={draft.slot?.startsAt===slot.startsAt} onClick={()=>update({slot})}>{formatTime(slot.startsAt)}</button>)}</div>:<div className="notice"><p>No hay horarios de prueba para esta fecha.</p><button className="button secondary" onClick={firstAvailable}>Buscar la próxima fecha</button></div>}</fieldset>
        <div className="same-city"><p className="hint">También puedes revisar otra sede de {draft.city}. El cambio siempre lo eliges tú.</p><div className="actions">{branches.filter(item=>item.city===draft.city&&item.id!==draft.branchId).map(item=><button key={item.id} className="text-link" onClick={()=>chooseBranch(item.id)}>{item.name}<Icon name="chevron" size={16}/></button>)}</div></div>
        <details className="demo-tools"><summary>Probar estados de la demo</summary><div className="actions"><button className="button ghost" onClick={()=>{setAvailabilityError(true);setLoading(false);}}>Simular error de carga</button><button className="button ghost" onClick={()=>{setForceEmpty(true);setLoading(false);update({slot:undefined});}}>Simular sin horarios</button></div><p className="hint">Solo cambia esta vista de prueba. Elige otra fecha o reintenta para recuperarla.</p></details>
      </>}
      {draft.step===3 && <><p>No introduzcas datos personales. Estos perfiles ya están preparados para explorar la demo.</p><fieldset className="field"><legend>Perfil sintético</legend><div className="option-grid">{profiles.map(item=><button key={item.id} disabled={Boolean(appointmentId)} className={`option ${draft.profileId===item.id?'selected':''}`} aria-pressed={draft.profileId===item.id} onClick={()=>update({profileId:item.id})}><span><strong>{item.name}</strong><small>{item.email}</small></span>{draft.profileId===item.id&&<Icon name="check"/>}</button>)}</div></fieldset><p className="notice"><Icon name="check"/> No se solicitan DNI, teléfono, síntomas ni información clínica.</p></>}
      {draft.step===4 && <><p>Vas a {appointmentId?'reprogramar':'crear'} una cita sintética. No es válida para atención.</p><dl className="summary-list"><div><dt>Sede</dt><dd>{branch?.name} · {branch?.city}</dd></div><div><dt>Cita de prueba</dt><dd>{appointmentTypes.find(item=>item.id===draft.type)?.name}</dd></div><div><dt>Fecha</dt><dd>{draft.slot&&formatDate(draft.slot.startsAt)}</dd></div><div><dt>Hora de Lima</dt><dd>{draft.slot&&formatTime(draft.slot.startsAt)} · {durationForType(draft.type)} min de prueba</dd></div><div><dt>Perfil sintético</dt><dd>{profile.name}</dd></div><div><dt>Profesional sintético</dt><dd>{professional?.name}</dd></div></dl><p className="notice">No se enviarán mensajes, invitaciones ni recordatorios reales.</p><details className="demo-tools"><summary>Probar horario recién ocupado</summary><p className="hint">Otro perfil demo ocupará este hueco. La confirmación deberá rechazarlo y conservará la cita anterior si estás reprogramando.</p><button className="button ghost" onClick={occupySelected}>Simular horario ocupado</button></details></>}
      <div className="actions booking-actions">{draft.step>1&&<button className="button secondary" onClick={()=>update({step:draft.step-1})}><Icon name="back"/> Atrás</button>}{draft.step<4?<button className="button" onClick={next} disabled={draft.step===2&&(loading||availabilityError)}>Continuar<Icon/></button>:<button className="button" disabled={busy||!draft.slot} onClick={submit}>{busy?'Validando…':appointmentId?'Confirmar reprogramación de prueba':'Confirmar reserva de prueba'}<Icon name="check"/></button>}</div>
    </div>
  </main>;
}
