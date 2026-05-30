// ===== SHARED DATA STORE =====
export const data = { stock: [], finance: [], orders: [], todos: [] };

// ===== DATE / FORMAT HELPERS =====
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function thisMonthStr() {
  return new Date().toISOString().slice(0, 7);
}

export function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function fmtMoney(n) {
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

export function emptyState(msg) {
  return `<div class="empty-state"><div class="empty-icon">🌸</div><div class="empty-text">${msg}</div></div>`;
}

// ===== MODAL =====
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (!el) { console.error("Modal not found:", id); return; }
  el.style.display = 'flex';
  el.offsetHeight; // force reflow
  el.classList.add('open');
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.addEventListener('transitionend', () => {
    if (!el.classList.contains('open')) el.style.display = '';
  }, { once: true });
};