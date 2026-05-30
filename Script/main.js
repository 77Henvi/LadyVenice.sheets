import { db, colStock, colFinance, colOrders, colTodos } from './firebase.js';
import { data, todayStr, thisMonthStr, fmtDate, fmtMoney, emptyState } from './utils.js';
import { onSnapshot, getDocs, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderStock }   from './stock.js';
import { renderFinance } from './finance.js';
import { renderOrders, ORDER_STATUS_LABEL } from './orders.js';
import { renderTodos }   from './todos.js';
import { renderStats }   from './stats.js';
import './ui.js';

// ===== DASHBOARD =====
function renderDashboard() {
  const today = todayStr();

  const todayFin = data.finance.filter(f => f.date === today);
  const income   = todayFin.filter(f => f.type === 'income').reduce((s,f) => s + f.amount, 0);
  const expense  = todayFin.filter(f => f.type === 'expense').reduce((s,f) => s + f.amount, 0);

  document.getElementById('dash-income').textContent  = fmtMoney(income);
  document.getElementById('dash-expense').textContent = fmtMoney(expense);
  document.getElementById('dash-pending').textContent = data.orders.filter(o => o.status === 'pending').length;

  const lowItems = data.stock.filter(s => s.qty <= (s.min || 0));
  document.getElementById('dash-lowstock').textContent = lowItems.length;

  const lowEl = document.getElementById('dash-lowstock-list');
  if (!lowItems.length) {
    lowEl.innerHTML = emptyState('สต็อคครบทุกรายการ 🎉');
  } else {
    lowEl.innerHTML = lowItems.slice(0, 5).map(s => {
      const badgeClass = s.qty === 0 ? 'badge-out' : 'badge-low';
      const badgeText  = s.qty === 0 ? 'หมด' : 'ใกล้หมด';
      return `
      <div class="item-card">
        <div class="item-card-left">
          <div class="item-name">${s.name}</div>
          <div class="item-sub">เหลือ ${s.qty} ${s.unit || ''}</div>
        </div>
        <span class="item-badge ${badgeClass}">${badgeText}</span>
      </div>`;
    }).join('');
  }

  const recentEl = document.getElementById('dash-recent-orders');
  const recent   = [...data.orders].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 5);

  if (!recent.length) {
    recentEl.innerHTML = emptyState('ยังไม่มีออเดอร์');
  } else {
    recentEl.innerHTML = recent.map(o => `
      <div class="item-card">
        <div class="item-card-left">
          <div class="item-name">${o.customer}</div>
          <div class="item-sub">${o.desc || ''}</div>
          <div class="order-date">${o.date ? fmtDate(o.date) : ''}</div>
        </div>
        <div style="text-align:right;">
          <span class="order-status status-${o.status}">${ORDER_STATUS_LABEL[o.status] || o.status}</span>
          <div class="order-price" style="margin-top:4px;">${fmtMoney(o.price)}</div>
        </div>
      </div>`).join('');
  }
}

// ===== RENDER ALL =====
function renderAll() {
  renderDashboard();
  renderStock();
  renderFinance();
  renderOrders();
  // stats renders on tab open only — no need to re-render on every snapshot
}

// ===== REALTIME =====
function initRealtime() {
  onSnapshot(colStock, snap => {
    data.stock = [];
    snap.forEach(d => data.stock.push({ id: d.id, ...d.data() }));
    renderAll();
  });
  onSnapshot(colFinance, snap => {
    data.finance = [];
    snap.forEach(d => data.finance.push({ id: d.id, ...d.data() }));
    renderAll();
  });
  onSnapshot(colOrders, snap => {
    data.orders = [];
    snap.forEach(d => data.orders.push({ id: d.id, ...d.data() }));
    renderAll();
  });
  onSnapshot(colTodos, snap => {
    data.todos = [];
    snap.forEach(d => data.todos.push({ id: d.id, ...d.data() }));
    renderTodos();
  });
}

// ===== CLEANUP DONE TODOS =====
async function cleanupDoneTodos() {
  const today = todayStr();
  const q     = query(colTodos, where("done", "==", true), where("date", "<", today));
  const snap  = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "todos", d.id))));
}

// ===== INIT =====
export function init() {
  const now = new Date();
  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const finDate = document.getElementById('fin-date');
  if (finDate) finDate.value = todayStr();

  const fab = document.getElementById('todo-fab');
  if (fab) fab.style.display = 'flex';

  cleanupDoneTodos();
  initRealtime();
  lucide.createIcons();
}