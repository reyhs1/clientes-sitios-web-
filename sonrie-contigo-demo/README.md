# Propuesta para Sonríe Contigo

Demo no oficial: cuatro sedes del encargo, reserva sintética y recepción sobre el mismo repositorio de sesión. Sin pacientes reales, cuentas, pagos ni comunicaciones. El usuario autorizó expresamente la publicación pública en GitHub Pages el 28 de octubre de 2026. Código subido a `reyhs1/clientes-sitios-web-`, rama `main`; activación del sitio y primer despliegue pendientes de comprobación.

## Publicación automática con enlace estable

El workflow `../.github/workflows/demo-pages.yml` valida tipos, lint, pruebas unitarias y recorridos E2E antes de compilar y desplegar únicamente `dist`. Cada push a `main` que afecte a la demo actualiza el mismo sitio; no depende de mantener Vite ni la computadora encendida. Las acciones oficiales se fijan por SHA y solo el job de despliegue recibe permisos Pages/OIDC.

Activación inicial del administrador del repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Si la primera ejecución falló antes de activar Pages, abrir **Actions → Validate and deploy the demo → Run workflow → main**. No hay que crear otro workflow ni proporcionar un token en el código. GitHub mostrará la URL efectiva del despliegue en el entorno `github-pages`.

La compilación utiliza `--base=/clientes-sitios-web-/`; las rutas internas usan hash. GitHub Pages público no tiene autenticación: la banda DEMO y `noindex` son avisos, no controles de acceso. No se añade dominio propio ni se cambia la visibilidad del repositorio. La disponibilidad depende de que GitHub Pages y el repositorio permanezcan habilitados.

## Ejecutar

Comprobado con Node 24.19.0 y npm 11.9.0, en el checkout existente (cada tarea cloud ya está aislada; no hace falta crear un worktree):

```bash
cd /workspace/clientes-sitios-web-/sonrie-contigo-demo
npm ci --cache /tmp/sonrie-npm-cache
npm run dev
```

Vite escucha **solo en 127.0.0.1, puerto 5173** y falla si el puerto ya está ocupado. Abrir esa dirección desde la misma máquina. No hay preview remota con autenticación verificada. Un aviso DEMO o `noindex` no protege una publicación; no exponer el servidor a Internet. Los procesos deben iniciarse otra vez en una nueva sesión.

## Presentarla en cinco pasos

1. En inicio, elegir Trujillo o Nuevo Chimbote y seleccionar explícitamente una sede. Probar reserva.
2. Elegir tipo, primer horario disponible y un perfil sintético; volver atrás para comprobar que conserva las elecciones. Confirmar.
3. En el detalle, descargar el `.ics` o revisar la advertencia de Google Calendar y volver sin abrir. Guardar un evento, si se decide hacerlo, siempre es manual.
4. Abrir Recepción demo: la misma cita aparece en la agenda. Marcar llegada y simular un recordatorio; la bandeja indica «Simulado, no enviado».
5. Reprogramar y verificar el cambio en ambas vistas. Cancelar, comprobar que se libera el horario y reiniciar la demo con confirmación.

En el paso de horarios, «Probar estados de la demo» permite recuperar un error o una fecha sin disponibilidad. En resumen, «Probar horario recién ocupado» crea una segunda cita sintética real para comprobar que la validación rechaza el conflicto.

## Qué funciona y qué representa

- **Funcional localmente:** creación, cancelación, llegada, reprogramación con validación previa, IDs únicos, bloqueo de solapamientos del mismo profesional o recurso entre sedes, estado compartido entre vistas, persistencia al recargar esta pestaña, filtros y contadores derivados, enlace Google y archivo ICS válido en UTC.
- **Simulado:** perfiles, profesionales, recursos, franjas, duraciones y notificaciones. Horarios de mañana a 14 días según `America/Lima`, sin franjas los domingos; evaluación 30 min y control 20 min. No acreditan servicios ni disponibilidad del negocio.
- **Límites:** repositorio síncrono en memoria con `sessionStorage`; no es backend, autenticación ni control de concurrencia multiusuario. Pestañas distintas no se sincronizan. Sin almacenamiento disponible, la demo funciona en memoria. Estado corrupto se descarta de forma segura. Cerrar la sesión de navegador puede eliminar los datos.
- **Calendario:** no hay OAuth, sincronización bidireccional, invitados, alarmas ni envíos. Cambios y cancelaciones requieren actualizar/eliminar manualmente el evento personal.
- **Producción:** requiere autorización del negocio y materiales, confirmación de datos y contenido clínico, backend con operaciones atómicas, acceso del equipo, pruebas de concurrencia, privacidad/retención y cuentas de negocio autorizadas con permisos mínimos. No se ha activado ningún adaptador de producción.

## Verificar

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Localmente, Playwright Test utiliza el Chromium ya instalado en `/usr/bin/chromium`, sin descargar otro navegador. En GitHub Actions se instala el Chromium oficial de Playwright que falta en el runner y se selecciona con `PLAYWRIGHT_USE_BUNDLED_CHROMIUM=true`. Los tests inician Vite si no está ejecutándose. Usan reloj fijo, bloquean peticiones externas, comprueban consola, el recorrido de reserva/recepción, conflictos, calendario descargado y zonas horarias; generan capturas en `test-results/` para 390, 768 y 1440 px. También revisan 320 px, teclado, foco, movimiento reducido y emulación de ampliación de texto al 200 %. Axe detecta una parte de los problemas de accesibilidad; no certifica accesibilidad completa. No se mide ni se afirma una puntuación Lighthouse.

Fuentes, intentos bloqueados, materiales, herramientas y resultados: [docs/SOURCES.md](docs/SOURCES.md). Los nombres de negocio/sedes proceden del encargo; reverificación independiente pendiente por rechazo 403 del proxy. No se inventan direcciones ni teléfonos.
