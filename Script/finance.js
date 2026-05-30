import { db, colFinance } from './firebase.js';
import { data, todayStr, thisMonthStr, fmtDate, fmtMoney, emptyState } from './utils.js';
import { addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let finFilter        = 'all';
let selectedFinMonth = thisMonthStr();

// ===== MODAL =====
window.openFinanceModal = function() {
  document.getElementById('fin-edit-id').value   = '';
  document.getElementById('fin-type').value      = 'income';
  document.getElementById('fin-name').value      = '';
  document.getElementById('fin-amount').value    = '';
  document.getElementById('fin-date').value      = todayStr();
  document.getElementById('fin-cat').value       = 'ขายสินค้า';
  document.getElementById('fin-note').value      = '';
  window.openModal('modal-finance');
};

// ===== MONTH SELECT =====
function populateFinMonthSelect() {
  const select = document.getElementById('fin-month-select');
  if (!select) return;

  const months = new Set(data.finance.map(f => (f.date || '').slice(0, 7)).filter(Boolean));
  months.add(thisMonthStr());

  const sorted  = [...months].sort((a, b) => b.localeCompare(a));
  const current = selectedFinMonth;

  select.innerHTML = sorted.map(m => {
    const [y, mo] = m.split('-');
    const label   = new Date(+y, +mo - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const isNow   = m === thisMonthStr() ? ' (เดือนนี้)' : '';
    return `<option value="${m}" ${m === current ? 'selected' : ''}>${label}${isNow}</option>`;
  }).join('');
}

window.onFinMonthChange = function() {
  selectedFinMonth = document.getElementById('fin-month-select').value;
  renderFinance();
};

// ===== FILTER =====
window.setFinFilter = (f, el) => {
  finFilter = f;
  document.querySelectorAll('#page-finance .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFinance();
};

// ===== RENDER =====
export function renderFinance() {
  populateFinMonthSelect();

  const month          = selectedFinMonth;
  const isCurrentMonth = month === thisMonthStr();
  const monthFin       = data.finance.filter(f => (f.date || '').startsWith(month));

  const income  = monthFin.filter(f => f.type === 'income').reduce((s,f) => s + f.amount, 0);
  const expense = monthFin.filter(f => f.type === 'expense').reduce((s,f) => s + f.amount, 0);
  const profit  = income - expense;

  const suffix = isCurrentMonth ? 'เดือนนี้' : 'เดือนนั้น';
  document.getElementById('fin-label-income').textContent  = `รายรับ${suffix}`;
  document.getElementById('fin-label-expense').textContent = `รายจ่าย${suffix}`;
  document.getElementById('fin-label-profit').textContent  = `กำไร/ขาดทุน${suffix}`;
  document.getElementById('fin-month-income').textContent  = fmtMoney(income);
  document.getElementById('fin-month-expense').textContent = fmtMoney(expense);

  const profitEl = document.getElementById('fin-profit');
  profitEl.textContent = (profit >= 0 ? '' : '-') + fmtMoney(Math.abs(profit));
  profitEl.className   = 'total-val ' + (profit >= 0 ? 'profit' : 'loss');

  let list = [...data.finance]
    .filter(f => (f.date || '').startsWith(month))
    .sort((a,b) => (b.date||'').localeCompare(a.date||''));
  if (finFilter === 'income')  list = list.filter(f => f.type === 'income');
  if (finFilter === 'expense') list = list.filter(f => f.type === 'expense');

  const el = document.getElementById('finance-list');
  if (!list.length) { el.innerHTML = emptyState('ไม่มีรายการ'); return; }

  el.innerHTML = list.map(f => `
    <div class="item-card">
      <div class="item-card-left">
        <div class="item-name">${f.name}</div>
        <div class="item-sub">${fmtDate(f.date)} ${f.cat ? '· ' + f.cat : ''}</div>
      </div>
      <div class="item-actions">
        <span class="finance-amount ${f.type === 'income' ? 'income' : 'expense'}">
          ${f.type === 'income' ? '+' : '-'}${fmtMoney(f.amount)}
        </span>
        <button class="btn-icon danger" onclick="deleteItem('finance','${f.id}')">🗑</button>
      </div>
    </div>`).join('');
}

// ===== SAVE =====
window.saveFinance = async () => {
  const name   = document.getElementById('fin-name').value.trim();
  const amount = parseFloat(document.getElementById('fin-amount').value);
  if (!name || !amount) return alert('กรุณากรอกรายการและจำนวนเงิน');

  await addDoc(colFinance, {
    type:   document.getElementById('fin-type').value,
    name,
    amount,
    date:   document.getElementById('fin-date').value || todayStr(),
    cat:    document.getElementById('fin-cat').value,
    note:   document.getElementById('fin-note').value.trim()
  });
  window.closeModal('modal-finance');
};