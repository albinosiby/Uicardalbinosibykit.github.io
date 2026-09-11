/** Attach pointer, touch and keyboard input with a single teardown. */
export function bindInteraction(element, { move, leave, step, toggle, select }) {
  const controller = new AbortController();
  const on = (type, handler) => element.addEventListener(type, handler, { signal: controller.signal });
  let start = null;
  on('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const r = element.getBoundingClientRect();
    move((event.clientX - r.left) / r.width * 2 - 1, (event.clientY - r.top) / r.height * 2 - 1);
  });
  on('pointerleave', leave);
  on('pointerdown', event => { start = { x: event.clientX, y: event.clientY }; });
  on('pointercancel', () => { start = null; });
  on('pointerup', event => {
    if (!start || event.target.closest('button')) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dy) > Math.max(Math.abs(dx), 25)) return;
    if (Math.abs(dx) > 30) step(dx < 0 ? 1 : -1);
    else {
      const card = event.target.closest('[data-index]');
      if (card && select) select(Number(card.dataset.index));
      else toggle();
    }
  });
  on('keydown', event => {
    if (event.target.closest('button')) return;
    if (['ArrowRight', 'ArrowLeft', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
      else toggle();
    }
  });
  return () => controller.abort();
}

let noticeTimer;
export function notify(message) {
  const notice = document.querySelector('#notification');
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 4000);
}

export async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    notify('Implementation prompt copied.');
    return true;
  } catch {
    return false;
  }
}
