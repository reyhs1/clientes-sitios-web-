# Fuentes y materiales

Consulta intentada: **28 de octubre de 2026**. Documento de base: `PROMPT_CODEX_SONRIE_CONTIGO.md`, aportado por el usuario, que declara comprobaciones en esa fecha. El documento es la procedencia de los nombres usados; **no constituye autorización del negocio ni reverificación independiente**.

## Datos del negocio

| Dato del encargo | Fuente pública indicada | Resultado en este entorno |
| --- | --- | --- |
| Sonríe Contigo, centro dental | https://linktr.ee/sonriecontigo.pe | Proxy: túnel rechazado, HTTP 403. Pendiente de reverificación. |
| Centro de Trujillo | https://wa.link/yv8lmf | Mismo bloqueo; no se alcanzó la redirección. |
| Vista Alegre, Trujillo | https://wa.link/nuar07 | Mismo bloqueo; no se alcanzó la redirección. |
| La Esperanza, Trujillo | https://wa.link/rezhse | Mismo bloqueo; no se alcanzó la redirección. |
| Nuevo Chimbote | https://wa.link/6cajnu | Mismo bloqueo; no se alcanzó la redirección. |
| Cuenta de Instagram de referencia | https://www.instagram.com/sonriecontigo.pe/ | Mismo bloqueo; no se vieron publicaciones ni vínculos. |
| Cuenta de TikTok de referencia | https://www.tiktok.com/@sonriecontigo.pe | Mismo bloqueo; no se vieron publicaciones ni vínculos. |
| Facebook de referencia | https://www.facebook.com/SonriePeruCentroDental/ | Mismo bloqueo; relación entre cuentas no comprobada. |

Se hicieron solicitudes HTTPS de lectura; no se enviaron mensajes ni formularios. El error proviene del proxy, **no prueba que las páginas hayan desaparecido**. No se intentó eludirlo. La app centraliza procedencia, fecha y estado en `src/data/business.ts`; todos estos datos permanecen `pendiente`. Los enlaces se documentan como fuentes y no se utilizan para comunicaciones desde la demo. No se incorporan teléfonos. Horarios, direcciones, profesionales, precios, prestaciones por sede, razón social y autorizaciones siguen sin confirmación y no se publican como hechos.

## Referencias de experiencia

También se intentó consultar https://odin.com.pe/, https://mcgrupodental.com/reservar-en-agenda-en-vivo/, https://cobbadental.com/sedes/ y https://odentid.pe/contacto/. Los cuatro destinos devolvieron el mismo rechazo 403 del proxy. No se analizaron sus pantallas ni se extraen conclusiones sobre sus servicios. La composición y el recorrido se desarrollan a partir del encargo, sin copiar estas webs.

## Materiales y derechos

- **Nombre y nombres de sedes:** uso referencial en propuesta no oficial. Permiso de marca no acreditado; requiere autorización antes de uso comercial o publicación.
- **Curvas, puntos y otros motivos vectoriales/CSS:** composición original creada para esta demo; no son un mapa, logotipo oficial ni material descargado de la clínica. Sin assets de terceros incorporados a ese motivo.
- **Fotografía, video, logo, testimonios y retratos:** no incorporados; no hay evidencia de licencia ni autorización para reutilizarlos.
- **Tipografía:** pila de fuentes del sistema. No se descargan, empaquetan ni redistribuyen archivos de fuentes; no hay solicitudes a servicios tipográficos externos.
- **Perfiles, citas, profesionales, recursos, disponibilidad y notificaciones:** fixtures sintéticos de demostración, separados de datos de referencia. No acreditan servicios, horarios ni personal del negocio.

Para producción: confirmar datos con el negocio, obtener derechos sobre marca y materiales, validar contenidos clínicos y revisar privacidad, seguridad, proveedores y flujos de datos. Esta nota no certifica cumplimiento jurídico.

## Herramientas reutilizadas y dependencias

Entorno real: Codex cloud Linux, Node 24.19.0 y npm 11.9.0. Se reutilizó `/usr/bin/chromium`; no se descargó otro navegador ni se registraron puentes/MCPs, hooks o configuraciones globales. No había conexión Context7 ni herramientas de investigación/navegador nativo con control disponibles; las consultas fueron HTTPS de lectura y la verificación visual se realizó con Playwright sobre Chromium instalado. La apertura del panel nativo se solicitó, pero la herramienta respondió `queued`; no se presenta como preview remota accesible ni protegida.

Skills disponibles leídas mediante su almacenamiento cloud reconocido: `frontend-workflow`, `impeccable`, `vercel-react-best-practices`, `vercel-composition-patterns` y `web-design-guidelines`. Se usaron como guías sin reinstalarlas; el lanzador de contexto de Impeccable no estaba expuesto en el filesystem, por lo que no se ejecutó. El encargo fija la dirección visual y autoriza continuar sin una ronda de variantes. No se inicializó shadcn, Motion ni otros sistemas: controles HTML nativos, CSS y React bastan para este alcance.

Las [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) se pudieron leer el 28 de octubre de 2026 y se aplicaron en la revisión. Se intentó también la [referencia de calendario de Google](https://developers.google.com/workspace/calendar/api/concepts/inviting-attendees-to-events) del encargo: rechazo 403 del proxy; no se afirma haberla releído. Se verificaron el formato y parámetros de la plantilla generada sin abrir ni guardar el evento en una cuenta real. La exportación sigue [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), con CRLF, folding UTF-8, escapes, UID y horas UTC; se parseó realmente con `ical.js`.

Versiones instaladas y licencias declaradas en sus paquetes oficiales, fijadas por `package-lock.json`:

| Dependencia | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| React / React DOM | 19.3.1 | MIT | Interfaz y estado compartido |
| Vite | 8.3.5 | MIT | Desarrollo/build local |
| TypeScript | 5.9.3 | Apache-2.0 | Tipos estrictos |
| ESLint | 9.39.5 | MIT | Análisis estático |
| Vitest | 4.1.11 | MIT | Agenda, fechas y calendario |
| Playwright Test | 1.64.1 | Apache-2.0 | Recorridos y capturas |
| axe-core/Playwright | 4.14.0 | MPL-2.0 | Detección automática de accesibilidad |
| ical.js | 2.2.1 | MPL-2.0 | Parseo del archivo descargado en tests |

Las dependencias se obtuvieron de `registry.npmjs.org` conservando verificación TLS e integridad del lockfile. Las licencias y avisos completos se conservan en sus paquetes; las herramientas de pruebas y `ical.js` son dependencias de desarrollo y no se incluyen en el bundle de la app. No se añaden fuentes, iconos ni paquetes visuales externos: iconos SVG y curvas escritos para esta demo.

## Resultado observado de validación

28 de octubre de 2026, en esta máquina:

- TypeScript estricto, ESLint y build de Vite: aprobados.
- Vitest: **49 pruebas aprobadas**, 2 archivos. Agenda/fechas, conflictos globales de profesional/recurso, doble envío, reprogramación que conserva el original si falla, cancelación/liberación, restauración de sesión válida/corrupta y calendario RFC 5545.
- Playwright: **10 pruebas aprobadas**, 30,7 segundos en la corrida final. Reserva completa, elecciones al retroceder, recarga, recepción, llegada, recordatorio simulado, reprogramación, cancelación, reset, error/vacío/ocupado recuperables y selección explícita de Nuevo Chimbote desde móvil.
- Enlace Google inspeccionado tras advertencia sin abrirlo. `.ics` descargado y parseado; UTC/duración/acentos/escapes/UID/ausencia de asistentes comprobados.
- Navegador en Tokio y Los Ángeles mantiene cita a las 09:00 de Lima. Reloj fijo de tests: `2026-10-28T17:00:00Z`; disponibilidad de ejecución normal usa el reloj actual con zona Lima explícita.
- Capturas de inicio, horario, confirmación y recepción poblada a **390, 768 y 1440 px**, inspeccionadas visualmente. También sin desbordamiento horizontal a **320 px** y tras duplicar los tamaños de texto computados (emulación de texto al 200 %, no zoom nativo). Se revisa el área interior con scroll, además del documento.
- Axe sin violaciones detectadas en esas cuatro pantallas a los tres tamaños. Comprobación de teclado, destino del skip-link, Escape/restauración de foco en diálogo y `prefers-reduced-motion`. No es certificación completa de accesibilidad ni una matriz de navegadores.
- **Cero intentos de peticiones externas** y cero errores de consola/ejecución en los recorridos comprobados. Las rutas no locales se interceptan y bloquean en tests; el enlace voluntario Google no se abrió. No se guardó ningún evento en cuentas reales.

En la revisión se corrigieron contraste del botón de cancelación, nombres accesibles de fechas/controles, foco/destino de navegación, estado al alternar creación/reprogramación, borrador de cambio de sede y desbordamiento interior al ampliar texto. La acción móvil ocupa un área propia, sin superponerse a los controles. No se ejecutaron pruebas de backend, concurrencia multiusuario, integración de producción, envío, cuentas reales, otros motores de navegador ni Lighthouse; esos componentes no forman parte de esta demo.

## Cambio de alcance: publicación mediante Git

El 28 de octubre de 2026 el usuario solicitó alojamiento con enlace estable y después autorizó explícitamente **demo pública en GitHub Pages**, sustituyendo el requisito inicial de acceso privado para esta publicación. Se subió el código a `https://github.com/reyhs1/clientes-sitios-web-`, rama `main`. No se ha cambiado la visibilidad del repositorio ni creado otro repositorio o dominio. La aplicación mantiene el aviso no oficial, los datos sintéticos y la ausencia de integraciones reales. La descripción de calendario ya no afirma que la propuesta sea privada.

Se preparó `.github/workflows/demo-pages.yml` con acciones oficiales de GitHub fijadas a sus SHAs, resueltas con `git ls-remote` y contrastadas con sus `action.yml`: checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5 y deploy-pages v5. Repositorios upstream: `https://github.com/actions/<nombre>`, licencia MIT. Se consultó la documentación oficial de fuentes de publicación en `https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site.md`. No se reutiliza contenido visual.

`configure-pages` documenta que `GITHUB_TOKEN` por sí solo no habilita automáticamente Pages. La activación inicial debe realizarla un administrador desde Settings/Pages o mediante API con permisos suficientes. En este entorno el acceso Git de lectura/escritura funciona; `gh api` a `api.github.com` está bloqueado por el proxy. Se guardaron en el borrador de red `api.github.com` y `reyhs1.github.io`, preservando los presets existentes. Guardar ese borrador no lo aplica ni activa Pages. Mientras no se compruebe la publicación y su respuesta, el sitio queda **pendiente**, sin presentar una URL inferida como ya disponible.

Comprobación del cambio de publicación: TypeScript, lint, las 49 pruebas unitarias, el E2E afectado de Google/ICS y build con la subruta de Pages aprobados. Se sirvió ese artefacto compilado en `/clientes-sitios-web-/` y se recorrieron reserva, recepción y cancelación en Chromium: HTTP 200, assets cargados y cero errores de consola o peticiones externas. Se añadió un favicon geométrico original para evitar la petición implícita a un icono inexistente, y `@types/node` 24.19.2 (MIT, DefinitelyTyped) como dependencia de desarrollo para tipar la selección de navegador del runner. Estos son resultados locales del artefacto; no prueban que el job remoto ni el despliegue hayan finalizado.
