import { useState } from 'react';
import { useDemo } from '../DemoProvider';
import { branches } from '../data/business';
import { appointmentTypes, formatDate, formatTime, profiles, professionals } from '../lib/booking';
import { googleCalendarUrl, makeIcs } from '../lib/calendar';
import { Icon, Modal, Status } from './UI';

export default function AppointmentDetail({id}: {id:string}) {
  const {repo,snapshot}=useDemo();
  const [modal,setModal]=useState<'cancel'|'calendar'|null>(null);
  const [error,setError]=useState('');
  const [feedback,setFeedback]=useState('');
  const appointment=snapshot.appointments.find(item=>item.id===id);
  if(!appointment) return <main id="main-content" tabIndex={-1} className="page-shell narrow"><h1>No encontramos esta cita de prueba.</h1><p>Puede haberse eliminado al reiniciar la demo. Las referencias no son enlaces privados de producción.</p><a className="button" href="#/reservar">Crear una cita de prueba<Icon/></a></main>;
  const branch=branches.find(item=>item.id===appointment.branchId)!;
  const profile=profiles.find(item=>item.id===appointment.profileId)!;
  function download() {
    if(!appointment) return;
    const blob=new Blob([makeIcs(appointment,branch.name)],{type:'text/calendar;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${appointment.id}.ics`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setFeedback('Archivo de prueba generado. Si lo importas, se guardará manualmente en el calendario que elijas.');
  }
  function cancel() {
    try { repo.cancel(id);setModal(null);setFeedback('Cita de prueba cancelada. El horario vuelve a estar disponible. Si guardaste el evento personal, elimínalo manualmente.'); }
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo cancelar. Vuelve a intentarlo.');setModal(null);}
  }
  return <main id="main-content" tabIndex={-1} className="page-shell narrow appointment-page">
    <a className="text-link" href="#/inicio"><Icon name="back"/> Volver al inicio</a>
    <div className="page-heading"><div className="success-mark"><Icon name={appointment.status==='cancelled'?'close':'check'} size={30}/></div><h1>{appointment.status==='cancelled'?'Cita de prueba cancelada.':'Cita de prueba creada.'}</h1><p className="confirmation-message">{appointment.status==='cancelled'?'El horario de demostración se ha liberado.':'Cita de prueba creada. No válida para atención'}</p></div>
    <div className="panel"><div className="appointment-title"><h2>Tu visita de demostración</h2><Status status={appointment.status}/></div><p className="reference">Referencia <strong>{appointment.id}</strong></p>
      {error&&<p className="error" role="alert">{error}</p>}{feedback&&<p className="notice" role="status">{feedback}</p>}
      <dl className="summary-list"><div><dt>Sede</dt><dd>{branch.name} · {branch.city}</dd></div><div><dt>Fecha</dt><dd>{formatDate(appointment.startsAt)}</dd></div><div><dt>Hora de Lima</dt><dd>{formatTime(appointment.startsAt)} (UTC−5)</dd></div><div><dt>Duración de prueba</dt><dd>{appointment.durationMinutes} minutos</dd></div><div><dt>Tipo de prueba</dt><dd>{appointmentTypes.find(item=>item.id===appointment.type)?.name}</dd></div><div><dt>Perfil sintético</dt><dd>{profile.name}</dd></div><div><dt>Profesional sintético</dt><dd>{professionals.find(item=>item.id===appointment.professionalId)?.name}</dd></div></dl>
      {appointment.status!=='cancelled'&&<div className="actions"><a className="button" href={`#/reprogramar/${id}`}><Icon name="calendar"/> Reprogramar cita de prueba</a><button className="button ghost danger" onClick={()=>setModal('cancel')}>Cancelar cita de prueba</button></div>}
    </div>
    {appointment.status!=='cancelled'&&<section className="calendar-section"><h2>Llévala a tu calendario.</h2><p>Solo se incluye información sintética. Tú decides si quieres guardar el evento de prueba.</p><div className="actions"><button className="button secondary" onClick={()=>setModal('calendar')}><Icon name="calendar"/> Añadir evento de prueba a Google Calendar</button><button className="button secondary" onClick={download}><Icon name="download"/> Descargar .ics de prueba</button></div><p className="hint">No hay sincronización con Google ni con la clínica. Si reprogramas o cancelas la cita, actualiza o elimina el evento de tu calendario manualmente. No se envían invitaciones.</p></section>}
    <div className="notice"><Icon name="bell"/><div><strong>Confirmación simulada, sin envíos.</strong><p>Esta cita ya aparece en recepción dentro de la misma sesión. Desde allí puedes previsualizar un recordatorio.</p><a className="text-link" href="#/recepcion">Ver en recepción demo<Icon/></a></div></div>
    <p className="hint">La referencia permite navegar en esta demo local; no implementa seguridad de producción ni acceso privado.</p>
    {modal==='cancel'&&<Modal title="¿Cancelar esta cita de prueba?" onClose={()=>setModal(null)}><p>Se liberará el horario en la demo y recepción verá el mismo cambio. No se contactará a ninguna persona.</p><p className="hint">Si guardaste un evento personal, deberás eliminarlo manualmente.</p><div className="actions"><button className="button secondary" onClick={()=>setModal(null)}>Conservar cita</button><button className="button danger" onClick={cancel}>Sí, cancelar cita de prueba</button></div></Modal>}
    {modal==='calendar'&&<Modal title="Vas a abrir un evento de prueba" onClose={()=>setModal(null)}><p>Se abrirá Google Calendar con datos sintéticos. Si decides guardarlo, el evento se añadirá al calendario de la cuenta que elijas. No se conecta ninguna cuenta con esta demo.</p><p className="hint">Puedes cerrar esta ventana sin guardar nada. Reprogramaciones y cancelaciones requieren actualizar el evento personal manualmente.</p><div className="actions"><button className="button secondary" onClick={()=>setModal(null)}>Volver sin abrir</button><a className="button" href={googleCalendarUrl(appointment,branch.name)} target="_blank" rel="noopener noreferrer" onClick={()=>setModal(null)}>Abrir Google Calendar<Icon/></a></div></Modal>}
  </main>;
}
