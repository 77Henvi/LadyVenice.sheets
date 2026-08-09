export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function thisMonthStr() {
  return new Date().toISOString().slice(0, 7);
}

// รอบ To-do List เริ่มวันที่ 2 ของทุกเดือน ถึงวันที่ 1 ของเดือนถัดไป
// เช่น วันนี้ 2026-08-15 -> รอบเริ่ม 2026-08-02
//      วันนี้ 2026-08-01 -> รอบเริ่ม 2026-07-02 (ยังนับเป็นรอบเดือนก่อนหน้า)
export function currentCycleStart() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDate();

  let cycleYear = y;
  let cycleMonth = m; // 0-indexed month ของจุดเริ่มรอบ

  if (d < 2) {
    // ยังอยู่ในรอบของเดือนก่อนหน้า
    cycleMonth = m - 1;
    if (cycleMonth < 0) {
      cycleMonth = 11;
      cycleYear = y - 1;
    }
  }

  const mm = String(cycleMonth + 1).padStart(2, '0');
  return `${cycleYear}-${mm}-02`;
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
  return `<div class="empty-state">
    <svg class="empty-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
    <div class="empty-text">${msg}</div>
  </div>`;
}