import { useEffect, useRef, type ReactNode } from 'react';
export function Icon({name='arrow',size=20}: {name?: 'arrow'|'back'|'pin'|'check'|'calendar'|'clock'|'close'|'chevron'|'download'|'spark'|'bell'|'reset';size?:number}) {
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7"/></>, back: <><path d="M20 12H5m7-7-7 7 7 7"/></>, reset: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    check:<path d="m5 12 4 4L19 6"/>, calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,close:<path d="m6 6 12 12M6 18 18 6"/>,chevron:<path d="m9 5 7 7-7 7"/>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></>,spark:<><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/></>,bell:<><path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4Zm5 3h4"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Modal({title,children,onClose}: {title:string;children:ReactNode;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current;const before=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();before?.focus();};},[]);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={(e)=>{e.preventDefault();onClose();}}><div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Cerrar diálogo" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function Status({status}: {status:string}) { return <span className={`status status-${status}`}>{status==='confirmed'?'Confirmada · DEMO':status==='arrived'?'Llegó · DEMO':status==='cancelled'?'Cancelada · DEMO':status}</span>; }
