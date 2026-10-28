import { useEffect, useRef, useState } from 'react';
import { DemoProvider, useDemo } from './DemoProvider';
import { branches, business, type City } from './data/business';
import { formatDate, formatTime } from './lib/booking';
import Booking from './components/Booking';
import AppointmentDetail from './components/AppointmentDetail';
import Reception from './components/Reception';
import { Icon, Modal, Status } from './components/UI';

function Connections() {
  return <svg className="connections" viewBox="0 0 460 152" fill="none" role="img" aria-label="Motivo abstracto original de cuatro puntos conectados; no es un mapa">
    <path d="M26 112C88 112 60 30 139 37S215 148 279 103 338 25 427 48" stroke="#0B6177" strokeWidth="2"/>
    <path d="M26 128C88 128 60 46 139 53S215 164 279 119 338 41 427 64" stroke="#8bcbd4" strokeWidth="1"/>
    {[{x:26,y:112,n:'C'},{x:139,y:37,n:'V'},{x:279,y:103,n:'E'},{x:427,y:48,n:'N'}].map(p=><g key={p.n}><circle cx={p.x} cy={p.y} r="18" fill="#f6f9f6" stroke="#0b6177" strokeWidth="1.5"/><text x={p.x} y={p.y+4} textAnchor="middle" fill="#16434c" fontSize="12" fontFamily="system-ui">{p.n}</text></g>)}
  </svg>;
}

function Footer() { return <footer className="site-footer page-shell"><div><strong>Propuesta para Sonríe Contigo</strong><p>Una experiencia de demostración. Ninguna cita es válida para atención.</p></div><a href="#/propuesta">Alcance, fuentes y datos pendientes <Icon name="arrow" size={16}/></a></footer>; }

function BranchPicker({city,setCity}: {city:City;setCity:(city:City)=>void}) {
  const {selectedBranch,setSelectedBranch}=useDemo();
  const branch=branches.find(b=>b.id===selectedBranch)!;
  return <section className="branch-picker" aria-labelledby="choose-heading">
    <div className="picker-art"><Connections/><div className="art-caption">Cuatro sedes. Un recorrido más sencillo.</div></div>
    <div className="picker-content"><h2 id="choose-heading">¿Dónde empezamos?</h2><p className="hint">Elige una sede para probar la experiencia.</p>
      <div className="city-switch" aria-label="Ciudad">{(['Trujillo','Nuevo Chimbote'] as City[]).map(c=><button key={c} aria-pressed={city===c} onClick={()=>setCity(c)}>{c}</button>)}</div>
      <div className="branch-options">{branches.filter(b=>b.city===city).map(b=><button key={b.id} className={`branch-option ${selectedBranch===b.id?'selected':''}`} aria-pressed={selectedBranch===b.id} onClick={()=>setSelectedBranch(b.id)}><span className="radio-mark"/><span>{b.name}<small>{b.city}</small></span><Icon name="pin" size={19}/></button>)}</div>
      {branch.city!==city ? <p className="hint" role="status">Selecciona una sede en {city} para continuar.</p> : null}
      <a className={`button full ${branch.city!==city?'disabled':''}`} href={branch.city===city?'#/reservar':undefined} aria-disabled={branch.city!==city}>Probar reserva <Icon/></a>
      <p className="picker-foot"><Icon name="calendar" size={15}/> Horarios de prueba · Sin reserva real</p>
    </div>
  </section>;
}

function Home() {
  const {snapshot,selectedBranch,setSelectedBranch}=useDemo();
  const selected=branches.find(b=>b.id===selectedBranch)!;
  const [city,setCity]=useState<City>(selected.city);
  const validCity=city===selected.city;
  return <>
    <main id="main-content">
      <div className="hero page-shell">
        <div className="hero-copy"><h1>Encuentra tu sede.<br/>Organiza tu<br/><em>próxima visita.</em></h1><p className="hero-lead">Cuatro sedes de Sonríe Contigo, una experiencia pensada para que el siguiente paso sea más sencillo.</p><div className="hero-links"><a className="text-link" href="#/reservar">Explorar la reserva de prueba <Icon/></a><a className="subtle-link" href="#/propuesta">Conoce esta propuesta</a></div><div className="hero-bottom"><span className="small-orbit"><Icon name="spark" size={24}/></span><p>Elegir. Reservar. Organizar.<br/><span>Todo claro, desde el primer momento.</span></p></div></div>
        <BranchPicker city={city} setCity={setCity}/>
      </div>
      <section className="journey-section"><div className="page-shell journey"><div className="journey-intro"><h2>Menos vueltas.<br/><em>Más claridad.</em></h2><p>Una propuesta que acompaña cada paso, también desde recepción.</p></div><ol className="journey-list"><li><span className="journey-num">1</span><div><h3>Elige dónde y cuándo</h3><p>Explora una sede y sus horarios de demostración.</p></div></li><li><span className="journey-num">2</span><div><h3>Guarda tu cita de prueba</h3><p>Consulta el resumen y descarga un evento para tu calendario.</p></div></li><li><span className="journey-num">3</span><div><h3>Cambia de planes con calma</h3><p>Reprograma o cancela. Recepción verá el mismo cambio en esta sesión.</p></div></li></ol></div></section>
      <section className="page-shell locations" aria-labelledby="locations-heading"><div className="section-intro"><h2 id="locations-heading">Cuatro sedes.<br/><em>Elige tu punto de partida.</em></h2><p>Nombres de sedes tomados del encargo. Direcciones y datos de atención pendientes de confirmación.</p></div><div className="location-list">{branches.map(b=><a key={b.id} href="#/reservar" onClick={()=>setSelectedBranch(b.id)}><Icon name="pin"/><span><strong>{b.name}</strong><small>{b.city}</small></span><span className="location-action">Elegir sede <Icon/></span></a>)}</div></section>
      {snapshot.appointments.length ? <section className="page-shell my-visits"><h2>Tus citas de prueba</h2><p className="hint">Solo datos sintéticos de esta sesión.</p>{snapshot.appointments.map(a=><a key={a.id} className="visit-link" href={`#/cita/${a.id}`}><span><strong>{branches.find(b=>b.id===a.branchId)?.name}</strong><small>{formatDate(a.startsAt)} · {formatTime(a.startsAt)} (Lima)</small></span><Status status={a.status}/><Icon/></a>)}</section> : null}
      <Footer/>
    </main><nav className="mobile-action" aria-label="Acceso rápido a la reserva de prueba"><a className={`button full ${validCity?'':'disabled'}`} href={validCity?'#/reservar':undefined} aria-disabled={!validCity}>{validCity?'Probar reserva':'Elige una sede para continuar'} <Icon/></a></nav>
  </>;
}

function Proposal() {
  return <main id="main-content" className="page-shell narrow"><div className="page-heading"><a href="#/inicio" className="text-link"><Icon name="back"/> Volver al inicio</a><h1>Una experiencia conectada.<br/><em>Una propuesta por validar.</em></h1><p>Propuesta para Sonríe Contigo. Diseño original y datos sintéticos para recorrer la reserva y su operación.</p></div><div className="proposal-grid"><section className="panel"><h2>Lo que puedes probar</h2><ul className="plain-list"><li>Elegir entre las cuatro sedes del encargo.</li><li>Reservar, reprogramar, cancelar y marcar llegada.</li><li>Ver los mismos cambios desde recepción.</li><li>Descargar un .ics o abrir voluntariamente un evento de prueba en Google Calendar.</li><li>Simular notificaciones. No se envía ninguna.</li></ul></section><section className="panel"><h2>El alcance de esta demo</h2><p>La agenda vive en la memoria y el almacenamiento de esta sesión del navegador. No comparte disponibilidad entre usuarios ni demuestra concurrencia de producción.</p><p>No hay autenticación, pagos, diagnóstico, conexión con cuentas ni reservas reales. El acceso a recepción es una vista de demostración.</p></section><section className="panel"><h2>Fuentes y datos pendientes</h2><p>{business.provenance}</p><p>Las fuentes públicas indicadas —Linktree, sus enlaces de sede y redes sociales— no pudieron leerse por un rechazo 403 del proxy el 28 de octubre de 2026. Los nombres proceden del documento aportado.</p><ul className="plain-list">{branches.map(b=><li key={b.id}><strong>{b.name}</strong><br/><span className="hint">{b.source} · {b.status}</span></li>)}</ul><p className="hint">El registro completo de intentos y referencias está en docs/SOURCES.md del proyecto.</p></section><section className="panel"><h2>Antes de producción</h2><p>Confirmar sedes, direcciones, horarios, servicios y contenido clínico; obtener autorización de marca y materiales.</p><p>Diseñar acceso del equipo, backend con operaciones atómicas y pruebas de concurrencia, protección de datos y retención. Conectar únicamente cuentas autorizadas del negocio, con permisos mínimos y revisión de proveedores.</p><p className="hint">No se han incorporado logos, fotos, videos, testimonios ni retratos. Motivo abstracto original y fuentes del sistema; no es un mapa ni un logotipo oficial.</p></section></div></main>;
}

function Shell() {
  const [route,setRoute]=useState(()=>window.location.hash.slice(1)||'/inicio');
  const [resetOpen,setResetOpen]=useState(false);
  const [resetVersion,setResetVersion]=useState(0);
  const {reset,storageAvailable}=useDemo();
  const mainRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const onHash=()=>{setRoute(window.location.hash.slice(1)||'/inicio');window.scrollTo(0,0);};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash);},[]);
  useEffect(()=>{document.title=`${route.startsWith('/recepcion')?'Recepción demo':route.startsWith('/reservar')?'Reserva de prueba':'Propuesta para Sonríe Contigo'} · No oficial`; mainRef.current?.querySelector('main')?.setAttribute('tabindex','-1'); const heading=mainRef.current?.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});},[route]);
  let content;
  if(route==='/inicio'||route==='/') content=<Home key={resetVersion}/>;
  else if(route==='/reservar') content=<Booking key={route}/>;
  else if(route.startsWith('/reprogramar/')) content=<Booking key={route} appointmentId={route.split('/')[2]}/>;
  else if(route.startsWith('/cita/')) content=<AppointmentDetail id={route.split('/')[2]}/>;
  else if(route==='/recepcion') content=<Reception/>;
  else if(route==='/propuesta') content=<Proposal/>;
  else content=<main className="page-shell narrow" id="main-content"><h1>No encontramos esa página</h1><a className="button" href="#/inicio">Volver al inicio</a></main>;
  const isHome=route==='/inicio'||route==='/';
  return <><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Saltar al contenido</a><div className="demo-band" role="region" aria-label="Aviso de demostración">Propuesta de demo · No es el sitio oficial · No realiza reservas reales</div><header className="site-header page-shell"><a href="#/inicio" className="wordmark"><span className="brand-symbol" aria-hidden="true"><span/><span/><span/><span/></span><span><small>Propuesta para</small><strong>Sonríe Contigo<span className="brand-dot">.</span></strong></span></a><nav aria-label="Navegación principal"><a className={isHome?'active':''} href="#/inicio">La experiencia</a><a className={route==='/recepcion'?'active nav-reception':'nav-reception'} href="#/recepcion">Recepción <span className="demo-tag">DEMO</span></a><button className="reset-link" onClick={()=>setResetOpen(true)} title="Reiniciar demo"><span>Reiniciar demo</span><Icon name="reset" size={17}/></button></nav></header>{!storageAvailable?<div className="page-shell notice" role="status">Almacenamiento no disponible: los cambios durarán mientras esta página permanezca abierta.</div>:null}<div ref={mainRef} className={`route-content ${isHome?'home-route':''}`}>{content}</div>{!isHome?<Footer/>:null}{resetOpen?<Modal title="¿Reiniciar la demo?" onClose={()=>setResetOpen(false)}><p>Se eliminarán las citas y las notificaciones sintéticas de esta sesión. No afecta a ningún servicio real.</p><div className="actions"><button className="button secondary" onClick={()=>setResetOpen(false)}>Conservar datos</button><button className="button" onClick={()=>{reset();setResetVersion(value=>value+1);setResetOpen(false);window.location.hash='/inicio';}}>Sí, reiniciar demo</button></div></Modal>:null}</>;
}
export default function App(){return <DemoProvider><Shell/></DemoProvider>;}
