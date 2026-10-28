import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import ICAL from 'ical.js';
import type { Snapshot } from '../src/lib/booking';

const fixedNow = new Date('2026-10-28T17:00:00Z');
const diagnostics = new WeakMap<Page, { external: string[]; errors: string[] }>();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(fixedNow);
  const data = { external: [] as string[], errors: [] as string[] };
  diagnostics.set(page, data);
  page.on('pageerror', error => data.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') data.errors.push(message.text()); });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      data.external.push(url.origin);
      await route.abort();
    } else await route.continue();
  });
});

test.afterEach(async ({ page }) => {
  const data = diagnostics.get(page)!;
  expect(data.external, 'La demo no debe intentar integraciones ni cargas externas').toEqual([]);
  expect(data.errors, 'No debe haber errores de ejecución en consola').toEqual([]);
});

async function snapshot(page: Page): Promise<Snapshot> {
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('sonrie-demo-state-v1'))).not.toBeNull();
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('sonrie-demo-state-v1')!));
}

async function begin(page: Page, branch = 'Centro de Trujillo') {
  await page.goto('/#/reservar');
  await page.getByRole('button', { name: new RegExp(branch) }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Encuentra tu horario de prueba' })).toBeVisible();
  await page.getByRole('button', { name: 'Primer horario disponible', exact: true }).click();
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toBeVisible();
}

async function submitFromTime(page: Page, time = '09:00') {
  await page.getByRole('button', { name: time, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Un perfil, solo de prueba' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reserva de prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cita de prueba creada.', exact: true })).toBeVisible();
  return (await snapshot(page)).appointments.at(-1)!;
}

test('reserva conserva elecciones, impide doble envío y comparte recepción, reprogramación y cancelación', async ({ page }) => {
  await begin(page, 'Vista Alegre');
  await page.getByRole('button', { name: '09:00', exact: true }).click();
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(page.getByRole('button', { name: /Vista Alegre/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: /Paciente demo 02/ }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reserva de prueba', exact: true }).evaluate(button => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByRole('heading', { name: 'Cita de prueba creada.', exact: true })).toBeVisible();
  const original = (await snapshot(page)).appointments[0];
  expect((await snapshot(page)).appointments).toHaveLength(1);
  expect(original.profileId).toBe('demo-02');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Cita de prueba creada.', exact: true })).toBeVisible();
  expect((await snapshot(page)).appointments[0].id).toBe(original.id);

  await page.getByRole('link', { name: 'Ver en recepción demo' }).click();
  const row = page.getByRole('article', { name: /Paciente demo 02/ });
  await expect(row).toContainText('Vista Alegre');
  await row.getByRole('button', { name: 'Marcar llegada', exact: true }).click();
  await expect(row).toContainText('Llegó · DEMO');
  await row.getByRole('button', { name: 'Simular recordatorio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recordatorio de prueba', exact: true })).toBeVisible();
  expect((await snapshot(page)).notifications.every(n => n.status === 'Simulado, no enviado')).toBe(true);

  await row.getByRole('link', { name: 'Reprogramar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: '09:30', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reprogramación de prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cita de prueba creada.', exact: true })).toBeVisible();
  const changed = (await snapshot(page)).appointments[0];
  expect(changed.id).toBe(original.id);
  expect(changed.startsAt).toBe('2026-10-29T14:30:00.000Z');

  await page.getByRole('link', { name: 'Reprogramar cita de prueba', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Volver a la cita', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar cita de prueba', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, cancelar cita de prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cita de prueba cancelada.', exact: true })).toBeVisible();
  expect((await snapshot(page)).appointments[0].status).toBe('cancelled');

  await page.getByRole('link', { name: /Recepción/ }).click();
  await expect(page.getByRole('article', { name: /Paciente demo 02/ })).toContainText('Cancelada · DEMO');
  await page.getByRole('link', { name: 'Crear cita manual de prueba', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('button', { name: '09:30', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Reiniciar demo/ }).click();
  await page.getByRole('button', { name: 'Sí, reiniciar demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Encuentra tu sede/ })).toBeVisible();
  expect((await snapshot(page)).appointments).toHaveLength(0);
  expect((await snapshot(page)).notifications).toHaveLength(0);
});

test('recupera error, vacío y horario recién ocupado mediante validación real', async ({ page }) => {
  await begin(page);
  await page.getByText('Probar estados de la demo', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular error de carga', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar');
  await page.getByRole('button', { name: 'Reintentar carga', exact: true }).click();
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Simular sin horarios', exact: true }).click();
  await expect(page.getByText('No hay horarios de prueba para esta fecha.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Buscar la próxima fecha', exact: true }).click();
  await page.getByRole('button', { name: '09:00', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByText('Probar horario recién ocupado', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular horario ocupado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reserva de prueba', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Ese horario acaba de ocuparse');
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toHaveCount(0);
  const appointment = await submitFromTime(page, '09:30');
  expect(appointment.startsAt).toBe('2026-10-29T14:30:00.000Z');
  expect((await snapshot(page)).appointments).toHaveLength(2);
});

test('cambiar de ciudad exige elegir sede también desde la acción móvil persistente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Nuevo Chimbote', exact: true }).click();
  // The disabled anchor correctly has no href, so it has no implicit link role.
  const quickReserve = page.getByRole('navigation', { name: 'Acceso rápido a la reserva de prueba' }).locator('a');
  await expect(quickReserve).toHaveAttribute('aria-disabled', 'true');
  await expect(quickReserve).toContainText('Elige una sede');
  await page.locator('.branch-option').filter({ hasText: 'Nuevo Chimbote' }).click();
  await expect(quickReserve).not.toHaveAttribute('aria-disabled', 'true');
  await quickReserve.click();
  await expect(page.locator('.option').filter({ hasText: 'Nuevo Chimbote' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Primer horario disponible', exact: true }).click();
  const appointment = await submitFromTime(page);
  expect(appointment.branchId).toBe('chimbote');
});

test('Google Calendar requiere advertencia y el .ics descargado es válido, UTC y sintético', async ({ page }) => {
  await begin(page);
  const appointment = await submitFromTime(page);
  await page.getByRole('button', { name: 'Añadir evento de prueba a Google Calendar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('el evento se añadirá al calendario de la cuenta que elijas');
  const calendarUrl = new URL((await dialog.getByRole('link', { name: 'Abrir Google Calendar', exact: true }).getAttribute('href'))!);
  expect(calendarUrl.origin).toBe('https://calendar.google.com');
  expect(calendarUrl.searchParams.get('action')).toBe('TEMPLATE');
  expect(calendarUrl.searchParams.get('text')).toBe('DEMO — cita de prueba, no válida para atención');
  expect(calendarUrl.searchParams.get('ctz')).toBe('America/Lima');
  expect(calendarUrl.searchParams.get('dates')).toBe('20261029T140000Z/20261029T143000Z');
  await dialog.getByRole('button', { name: 'Volver sin abrir', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar .ics de prueba', exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream!) text += chunk.toString();
  const event = new ICAL.Event(new ICAL.Component(ICAL.parse(text)).getFirstSubcomponent('vevent')!);
  expect(event.uid).toContain(appointment.id);
  expect(event.summary).toBe('DEMO — cita de prueba, no válida para atención');
  expect(event.startDate.toJSDate().toISOString()).toBe(appointment.startsAt);
  expect(event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime()).toBe(30 * 60_000);
  expect(text).not.toMatch(/ATTENDEE|VALARM|Paciente|@example\.invalid|TEL:/i);
});

for (const timezoneId of ['Asia/Tokyo', 'America/Los_Angeles']) {
  test(`las citas siguen a las 09:00 de Lima con navegador ${timezoneId}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId, locale: 'es-PE' });
    const page = await context.newPage();
    await page.clock.setFixedTime(fixedNow);
    const external: string[] = [];
    page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173')) external.push(request.url()); });
    await begin(page);
    const appointment = await submitFromTime(page);
    expect(appointment.startsAt).toBe('2026-10-29T14:00:00.000Z');
    await expect(page.getByText('09:00 (UTC−5)', { exact: true })).toBeVisible();
    expect(external).toEqual([]);
    await context.close();
  });
}

for (const width of [390, 768, 1440]) {
  test(`composición ${width}px, sin desbordamiento y accesibilidad automática`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Encuentra tu sede/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await begin(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`booking-${width}.png`), fullPage: true });
    await submitFromTime(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`confirmation-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: /Recepción/ }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`reception-${width}.png`), fullPage: true });
  });
}

test('320px, texto ampliado y teclado: diálogo recupera foco sin movimiento obligatorio', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.getByRole('banner').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  // Chromium has no text-only zoom API. Double measured text sizes without
  // enlarging layout widths to exercise the corresponding reflow constraint.
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(element => [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
      .map(element => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
    for (const { element, size } of nodes) element.style.fontSize = `${size * 2}px`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.getByRole('main').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.getByRole('banner').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const skip = page.getByRole('link', { name: 'Saltar al contenido', exact: true });
  await skip.focus();
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  // Use the accessible keyboard route to the same reset action on desktop.
  await page.setViewportSize({ width: 1440, height: 1000 });
  const reset = page.getByRole('button', { name: /^Reiniciar demo/ });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(reset).toBeFocused();
});
