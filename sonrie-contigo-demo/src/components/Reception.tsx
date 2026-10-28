import { useState } from 'react';
import { useDemo } from '../DemoProvider';
import { branches } from '../data/business';
import { appointmentTypes } from '../data/fixtures';
import { formatDate, formatTime, futureDates, limaDate, profiles, professionals, type Appointment, type DemoNotification } from '../lib/booking';
import { Icon, Modal, Status } from './UI';

const notificationLabels: Record<DemoNotification['kind'], string> = {
  confirmation: 'Confirmación de prueba',
  reschedule: 'Reprogramación de prueba',
  cancellation: 'Cancelación de prueba',
  reminder: 'Recordatorio de prueba',
};

export default function Reception() {
  const { repo, snapshot } = useDemo();
  const dates = futureDates();
  const [view, setView] = useState<'daily' | 'list'>('daily');
  const [date, setDate] = useState(dates[0]);
  const [branchId, setBranchId] = useState('all');
  const [professionalId, setProfessionalId] = useState('all');
  const [status, setStatus] = useState('all');
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const appointments = snapshot.appointments.filter((appointment) =>
    (date === 'all' || limaDate(new Date(appointment.startsAt)) === date)
    && (branchId === 'all' || appointment.branchId === branchId)
    && (professionalId === 'all' || appointment.professionalId === professionalId)
    && (status === 'all' || appointment.status === status),
  ).sort((left, right) => left.startsAt.localeCompare(right.startsAt));

  // Include saved past dates so a restored session can still be inspected.
  const availableDates = [...new Set([...dates, ...snapshot.appointments.map((appointment) => limaDate(new Date(appointment.startsAt)))])].sort();
  const counts = {
    confirmed: snapshot.appointments.filter((appointment) => appointment.status === 'confirmed').length,
    arrived: snapshot.appointments.filter((appointment) => appointment.status === 'arrived').length,
    cancelled: snapshot.appointments.filter((appointment) => appointment.status === 'cancelled').length,
  };

  function act(action: () => unknown, message: string) {
    setError('');
    setFeedback('');
    try { action(); setFeedback(message); } catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo actualizar la demo. Vuelve a intentarlo.'); }
  }

  function switchView(next: 'daily' | 'list') {
    setView(next);
    if (next === 'list') setDate('all');
    else if (date === 'all') setDate(dates[0]);
  }

  return <main id="main-content" tabIndex={-1} className="page-shell reception-page">
    <header className="page-heading reception-heading">
      <div><h1>Recepción demo</h1><p>La reserva del paciente aparece aquí, en la misma sesión.</p></div>
      <a className="button" href="#/reservar"><Icon name="calendar"/>Crear cita manual de prueba</a>
    </header>

    <p className="notice">Acceso de demostración, sin inicio de sesión. Todos los registros son sintéticos y se guardan solo en esta sesión. No representa una agenda clínica ni concurrencia entre usuarios.</p>

    <dl className="stat-row" aria-label="Citas sintéticas de esta sesión">
      <div className="stat"><dt>Confirmadas · DEMO</dt><dd>{counts.confirmed}</dd></div>
      <div className="stat"><dt>Llegadas · DEMO</dt><dd>{counts.arrived}</dd></div>
      <div className="stat"><dt>Canceladas · DEMO</dt><dd>{counts.cancelled}</dd></div>
    </dl>

    {error && <p className="error" role="alert">{error}</p>}
    <p className="hint reception-feedback" role="status" aria-live="polite">{feedback}</p>

    <section className="panel" aria-labelledby="agenda-title">
      <div className="toolbar">
        <div><h2 id="agenda-title">Agenda sintética</h2><p className="hint">Hora de Lima · America/Lima</p></div>
        <div className="view-switch" role="group" aria-label="Vista de agenda">
          <button className={`button ${view === 'daily' ? '' : 'secondary'}`} aria-pressed={view === 'daily'} onClick={() => switchView('daily')}>Agenda diaria</button>
          <button className={`button ${view === 'list' ? '' : 'secondary'}`} aria-pressed={view === 'list'} onClick={() => switchView('list')}>Lista de citas</button>
        </div>
      </div>

      <div className="filters">
        <label className="field">Fecha de prueba
          <select value={date} onChange={(event) => setDate(event.target.value)}>
            {view === 'list' && <option value="all">Todas las fechas</option>}
            {availableDates.map((day) => <option key={day} value={day}>{formatDate(day)}</option>)}
          </select>
        </label>
        <label className="field">Sede
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            <option value="all">Todas las sedes</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        <label className="field">Profesional de prueba
          <select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>
            <option value="all">Todos los profesionales demo</option>
            {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
          </select>
        </label>
        <label className="field">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmada · DEMO</option>
            <option value="arrived">Llegó · DEMO</option>
            <option value="cancelled">Cancelada · DEMO</option>
          </select>
        </label>
      </div>

      <p className="hint" role="status">{appointments.length} {appointments.length === 1 ? 'cita sintética' : 'citas sintéticas'} con estos filtros. Los contadores superiores incluyen toda la sesión.</p>

      {appointments.length === 0 ? <div className="empty-state">
        <Icon name="calendar" size={32}/><h3>No hay citas de prueba en esta vista</h3>
        <p>Crea una reserva desde la web o revisa otras fechas y filtros.</p>
        <div className="actions"><a className="button secondary" href="#/reservar">Crear una cita de prueba</a><button className="button ghost" onClick={() => { setView('list'); setDate('all'); setBranchId('all'); setProfessionalId('all'); setStatus('all'); }}>Ver toda la sesión</button></div>
      </div> : <div className="appointment-list">
        {appointments.map((appointment) => {
          const branch = branches.find((item) => item.id === appointment.branchId);
          const profile = profiles.find((item) => item.id === appointment.profileId);
          const professional = professionals.find((item) => item.id === appointment.professionalId);
          const appointmentType = appointmentTypes.find((item) => item.id === appointment.type);
          return <article className="appointment-row" key={appointment.id} aria-label={`Cita de ${profile?.name ?? 'perfil sintético'}, ${formatTime(appointment.startsAt)}, ${branch?.name ?? 'sede de prueba'}`}>
            <div className="appointment-time"><strong>{formatTime(appointment.startsAt)}</strong><span>{appointment.durationMinutes} min · DEMO</span></div>
            <div className="appointment-body">
              <div className="appointment-title"><h3><a href={`#/cita/${appointment.id}`}>{profile?.name ?? 'Perfil sintético'}</a></h3><Status status={appointment.status}/></div>
              <p>{branch?.name} · {appointmentType?.name}</p>
              <p className="hint">{formatDate(appointment.startsAt)} · {professional?.name}</p>
              <p className="hint appointment-reference">Referencia: {appointment.id}</p>
            </div>
            <div className="row-actions" aria-label={`Acciones de ${profile?.name ?? 'cita de prueba'}`}>
              <a className="button ghost" href={`#/cita/${appointment.id}`}>Ver cita</a>
              {appointment.status !== 'cancelled' && <>
                {appointment.status === 'confirmed' && <button className="button secondary" onClick={() => act(() => repo.arrive(appointment.id), 'Llegada registrada en la demo. La cita del paciente muestra el mismo estado.')}>Marcar llegada</button>}
                <a className="button ghost" href={`#/reprogramar/${appointment.id}`}>Reprogramar</a>
                <button className="button ghost" onClick={() => act(() => repo.simulateReminder(appointment.id), 'Recordatorio simulado. Revisa la bandeja: no se envió ningún mensaje.')}><Icon name="bell"/>Simular recordatorio</button>
                <button className="button ghost" onClick={() => setCancelling(appointment)}>Cancelar cita</button>
              </>}
            </div>
          </article>;
        })}
      </div>}
    </section>

    <section className="panel notification-panel" aria-labelledby="notifications-title">
      <div className="toolbar"><div><h2 id="notifications-title">Simulación de notificaciones</h2><p className="hint">Vistas previas locales. No hay servicios de correo, WhatsApp ni calendario conectados.</p></div><Icon name="bell" size={26}/></div>
      {snapshot.notifications.length === 0 ? <div className="empty-state"><h3>La bandeja está lista para la prueba</h3><p>Crear, reprogramar o cancelar una cita genera una vista previa. Después puedes simular un recordatorio desde su fila.</p></div> : <ul className="notification-list">
        {snapshot.notifications.map((notification) => <li className="notification-item" key={notification.id}>
          <div className="toolbar"><h3>{notificationLabels[notification.kind]}</h3><span className="status">{notification.status}</span></div>
          <p>{notification.message}</p>
        </li>)}
      </ul>}
    </section>

    {cancelling && <Modal title="¿Cancelar la cita de prueba?" onClose={() => setCancelling(null)}>
      <p>Se cancelará la cita sintética de {profiles.find((profile) => profile.id === cancelling.profileId)?.name}, el {formatDate(cancelling.startsAt)} a las {formatTime(cancelling.startsAt)} (Lima). El horario volverá a estar disponible en la demo.</p>
      <p className="hint">Si guardaste un evento personal, elimínalo manualmente. La demo no modifica calendarios ni envía mensajes.</p>
      <div className="actions"><button className="button secondary" onClick={() => setCancelling(null)}>Conservar cita</button><button className="button" onClick={() => { act(() => repo.cancel(cancelling.id), 'Cita de prueba cancelada. El horario volvió a la disponibilidad sintética.'); setCancelling(null); }}>Confirmar cancelación de prueba</button></div>
    </Modal>}
  </main>;
}
