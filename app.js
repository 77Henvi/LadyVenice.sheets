// ===== FIREBASE IMPORT =====
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyC0Txa5vnZbRtYU2wMTb2Qe3heGgF-SV4w",
  authDomain: "ladyvenice.firebaseapp.com",
  projectId: "ladyvenice",
  storageBucket: "ladyvenice.firebasestorage.app",
  messagingSenderId: "143412816674",
  appId: "1:143412816674:web:ce46a0bbee26437722537b"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== COLLECTIONS =====
const colStock   = collection(db, "stock");
const colFinance = collection(db, "finance");
const colOrders  = collection(db, "orders");
const colTodos   = collection(db, "todos");

// ===== DATA =====
let data = { stock: [], finance: [], orders: [], todos: [] };

// ===== REALTIME LOAD =====
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

// ===== UTILS =====
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthStr() {
  return new Date().toISOString().slice(0, 7);
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function fmtMoney(n) {
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

function emptyState(msg) {
  return `<div class="empty-state"><div class="empty-icon">🌸</div><div class="empty-text">${msg}</div></div>`;
}

// ===== TAB =====
window.switchTab = function(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.getElementById('nav-' + tab).classList.add('active');

  // FAB เฉพาะหน้า home
  const fab = document.getElementById('todo-fab');
  if (fab) fab.style.display = tab === 'home' ? 'flex' : 'none';
};

// ===== MODAL =====
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (!el) { console.error("Modal not found:", id); return; }
  el.style.display = 'flex';
  el.offsetHeight;
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

// ===== STOCK PROFIT CALC =====
window.calcStockProfit = function() {
  const cost  = parseFloat(document.getElementById('stock-cost').value)  || 0;
  const price = parseFloat(document.getElementById('stock-price').value) || 0;
  const box   = document.getElementById('stock-profit-preview');
  const val   = document.getElementById('stock-profit-pct');

  if (!cost || !price) {
    val.textContent = '—';
    box.className = 'profit-preview';
    return;
  }

  const pct = ((price - cost) / cost) * 100;
  const diff = price - cost;
  const sign = diff >= 0 ? '+' : '';
  val.innerHTML = `${sign}${pct.toFixed(1)}% <span style="font-size:13px;font-weight:400;opacity:0.75;">(${sign}฿${Math.abs(diff).toLocaleString('th-TH')})</span>`;

  box.className = 'profit-preview ' + (pct >= 30 ? 'good' : pct >= 0 ? 'warn' : 'bad');
};

// ===== STOCK MODAL =====
window.openStockModal = function() {
  document.getElementById('stock-edit-id').value = '';
  document.getElementById('stock-modal-title').textContent = 'เพิ่มสต็อค';
  document.getElementById('stock-name').value  = '';
  document.getElementById('stock-type').value  = 'flower';
  document.getElementById('stock-unit').value  = '';
  document.getElementById('stock-qty').value   = '';
  document.getElementById('stock-min').value   = '';
  document.getElementById('stock-cost').value  = '';
  document.getElementById('stock-price').value = '';
  document.getElementById('stock-note').value  = '';
  document.getElementById('stock-profit-pct').textContent = '—';
  document.getElementById('stock-profit-preview').className = 'profit-preview';
  openModal('modal-stock');
};

// ===== STOCK =====
let stockFilter = 'all';

window.setStockFilter = (f, el) => {
  stockFilter = f;
  document.querySelectorAll('#page-stock .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderStock();
};

function renderStock() {
  const q = document.getElementById('stock-search')?.value.toLowerCase() || '';

  let list = data.stock.filter(s => {
    const name  = (s.name || '').toLowerCase();
    const match = name.includes(q);
    if (stockFilter === 'flower') return match && s.type === 'flower';
    if (stockFilter === 'supply') return match && s.type === 'supply';
    if (stockFilter === 'low')    return match && s.qty <= (s.min || 0);
    return match;
  });

  const el = document.getElementById('stock-list');
  if (!list.length) { el.innerHTML = emptyState('ไม่มีรายการ'); return; }

  el.innerHTML = list.map(s => {
    let badgeClass, badgeText;
    if (s.qty === 0)              { badgeClass = 'badge-out'; badgeText = 'หมด'; }
    else if (s.qty <= (s.min||0)) { badgeClass = 'badge-low'; badgeText = 'ใกล้หมด'; }
    else                          { badgeClass = 'badge-ok';  badgeText = 'มี'; }

    const typeClass = s.type === 'supply' ? 'supply' : '';

    return `
    <div class="item-card">
      <div class="item-card-left">
        <div class="item-name">
          <span class="tag-type ${typeClass}">${s.type === 'supply' ? 'อุปกรณ์' : 'ดอกไม้'}</span>
          ${s.name}
        </div>
        <div class="item-sub">${s.qty} ${s.unit || ''} ${s.cost ? '· ทุน ' + fmtMoney(s.cost) : ''}${s.price ? ' · ขาย ' + fmtMoney(s.price) : ''}${s.cost && s.price ? ' · กำไร ' + fmtMoney(s.price - s.cost) : ''}</div>
      </div>
      <div class="item-actions">
        <span class="item-badge ${badgeClass}">${badgeText}</span>
        <button class="btn-icon" onclick="editStock('${s.id}')">✏️</button>
        <button class="btn-icon danger" onclick="deleteItem('stock','${s.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

window.editStock = id => {
  const s = data.stock.find(x => x.id === id);
  if (!s) return;

  document.getElementById('stock-edit-id').value   = id;
  document.getElementById('stock-modal-title').textContent = 'แก้ไขสต็อค';
  document.getElementById('stock-name').value       = s.name  || '';
  document.getElementById('stock-type').value       = s.type  || 'flower';
  document.getElementById('stock-unit').value       = s.unit  || '';
  document.getElementById('stock-qty').value        = s.qty   ?? '';
  document.getElementById('stock-min').value        = s.min   ?? '';
  document.getElementById('stock-cost').value       = s.cost  ?? '';
  document.getElementById('stock-price').value      = s.price ?? '';
  document.getElementById('stock-note').value       = s.note  || '';

  openModal('modal-stock');
  calcStockProfit();
};

window.saveStock = async () => {
  const name = document.getElementById('stock-name').value.trim();
  if (!name) return alert('กรุณากรอกชื่อสินค้า');

  const obj = {
    name,
    type:  document.getElementById('stock-type').value,
    unit:  document.getElementById('stock-unit').value.trim(),
    qty:   parseFloat(document.getElementById('stock-qty').value)   || 0,
    min:   parseFloat(document.getElementById('stock-min').value)   || 0,
    cost:  parseFloat(document.getElementById('stock-cost').value)  || 0,
    price: parseFloat(document.getElementById('stock-price').value) || 0,
    note:  document.getElementById('stock-note').value.trim()
  };

  const id = document.getElementById('stock-edit-id').value;
  if (id) {
    await updateDoc(doc(db, "stock", id), obj);
  } else {
    await addDoc(colStock, obj);
  }
  closeModal('modal-stock');
};

// ===== FINANCE MODAL =====
window.openFinanceModal = function() {
  document.getElementById('fin-edit-id').value   = '';
  document.getElementById('fin-type').value      = 'income';
  document.getElementById('fin-name').value      = '';
  document.getElementById('fin-amount').value    = '';
  document.getElementById('fin-date').value      = todayStr();
  document.getElementById('fin-cat').value       = 'ขายสินค้า';
  document.getElementById('fin-note').value      = '';
  openModal('modal-finance');
};

// ===== FINANCE =====
let finFilter = 'all';
let selectedFinMonth = thisMonthStr();

function populateFinMonthSelect() {
  const select = document.getElementById('fin-month-select');
  if (!select) return;

  const months = new Set(data.finance.map(f => (f.date || '').slice(0, 7)).filter(Boolean));
  months.add(thisMonthStr());

  const sorted = [...months].sort((a, b) => b.localeCompare(a));
  const current = selectedFinMonth;

  select.innerHTML = sorted.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const isNow = m === thisMonthStr() ? ' (เดือนนี้)' : '';
    return `<option value="${m}" ${m === current ? 'selected' : ''}>${label}${isNow}</option>`;
  }).join('');
}

window.onFinMonthChange = function() {
  selectedFinMonth = document.getElementById('fin-month-select').value;
  renderFinance();
};

window.setFinFilter = (f, el) => {
  finFilter = f;
  document.querySelectorAll('#page-finance .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFinance();
};

function renderFinance() {
  populateFinMonthSelect();

  const month = selectedFinMonth;
  const isCurrentMonth = month === thisMonthStr();
  const monthFin = data.finance.filter(f => (f.date || '').startsWith(month));

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
  closeModal('modal-finance');
};

// ===== ORDER MODAL =====
window.openOrderModal = function() {
  document.getElementById('order-edit-id').value    = '';
  document.getElementById('order-modal-title').textContent = 'เพิ่มออเดอร์';
  document.getElementById('order-customer').value   = '';
  document.getElementById('order-desc').value       = '';
  document.getElementById('order-price').value      = '';
  document.getElementById('order-date').value       = '';
  document.getElementById('order-contact').value    = '';
  document.getElementById('order-status').value     = 'pending';
  document.getElementById('order-note').value       = '';
  openModal('modal-order');
};

// ===== ORDERS =====
let orderFilter = 'all';
let selectedOrderMonth = 'all';

function populateOrderMonthSelect() {
  const select = document.getElementById('order-month-select');
  if (!select) return;

  const months = new Set(data.orders.map(o => (o.date || '').slice(0, 7)).filter(Boolean));
  months.add(thisMonthStr());

  const sorted = [...months].sort((a, b) => b.localeCompare(a));
  const current = selectedOrderMonth;

  const allOption = `<option value="all" ${current === 'all' ? 'selected' : ''}>📋 ออเดอร์ทั้งหมด</option>`;
  const monthOptions = sorted.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const isNow = m === thisMonthStr() ? ' (เดือนนี้)' : '';
    return `<option value="${m}" ${m === current ? 'selected' : ''}>${label}${isNow}</option>`;
  }).join('');

  select.innerHTML = allOption + monthOptions;
}

window.onOrderMonthChange = function() {
  selectedOrderMonth = document.getElementById('order-month-select').value;
  renderOrders();
};

window.setOrderFilter = (f, el) => {
  orderFilter = f;
  document.querySelectorAll('#page-order .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderOrders();
};

const ORDER_STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  ready:   'พร้อมส่ง',
  done:    'เสร็จแล้ว',
  cancel:  'ยกเลิก'
};

function renderOrders() {
  populateOrderMonthSelect();

  let list = [...data.orders].sort((a,b) => (b.date||'').localeCompare(a.date||''));

  if (selectedOrderMonth !== 'all') {
    list = list.filter(o => (o.date || '').startsWith(selectedOrderMonth));
  }
  if (orderFilter !== 'all') list = list.filter(o => o.status === orderFilter);

  const el = document.getElementById('order-list');
  if (!list.length) { el.innerHTML = emptyState('ไม่มีออเดอร์'); return; }

  el.innerHTML = list.map(o => `
    <div class="item-card">
      <div class="item-card-left">
        <div class="item-name">${o.customer} ${o.contact ? '<span class="item-sub">· ' + o.contact + '</span>' : ''}</div>
        <div class="item-sub">${o.desc || ''}</div>
        <div class="order-date">${o.date ? '📅 ' + fmtDate(o.date) : ''}</div>
      </div>
      <div class="item-actions" style="flex-direction:column;align-items:flex-end;gap:6px;">
        <span class="order-status status-${o.status}">${ORDER_STATUS_LABEL[o.status] || o.status}</span>
        <span class="order-price">${fmtMoney(o.price)}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon" onclick="editOrder('${o.id}')">✏️</button>
          <button class="btn-icon danger" onclick="deleteItem('orders','${o.id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

window.editOrder = id => {
  const o = data.orders.find(x => x.id === id);
  if (!o) return;

  document.getElementById('order-edit-id').value    = id;
  document.getElementById('order-modal-title').textContent = 'แก้ไขออเดอร์';
  document.getElementById('order-customer').value   = o.customer || '';
  document.getElementById('order-desc').value       = o.desc     || '';
  document.getElementById('order-price').value      = o.price    ?? '';
  document.getElementById('order-date').value       = o.date     || '';
  document.getElementById('order-contact').value    = o.contact  || '';
  document.getElementById('order-status').value     = o.status   || 'pending';
  document.getElementById('order-note').value       = o.note     || '';

  openModal('modal-order');
};

window.saveOrder = async () => {
  const customer = document.getElementById('order-customer').value.trim();
  if (!customer) return alert('กรุณากรอกชื่อลูกค้า');

  const obj = {
    customer,
    desc:    document.getElementById('order-desc').value.trim(),
    price:   parseFloat(document.getElementById('order-price').value) || 0,
    date:    document.getElementById('order-date').value    || todayStr(),
    contact: document.getElementById('order-contact').value.trim(),
    status:  document.getElementById('order-status').value,
    note:    document.getElementById('order-note').value.trim()
  };

  const id = document.getElementById('order-edit-id').value;
  if (id) {
    await updateDoc(doc(db, "orders", id), obj);
  } else {
    await addDoc(colOrders, obj);
  }
  closeModal('modal-order');
};

// ===== DELETE =====
window.deleteItem = async (collectionName, id) => {
  if (!confirm('ลบรายการนี้?')) return;
  await deleteDoc(doc(db, collectionName, id));
};

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
  const recent   = [...data.orders]
    .sort((a,b) => (b.date||'').localeCompare(a.date||''))
    .slice(0, 5);

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

// ===== TODO =====
window.addTodo = async () => {
  const text = document.getElementById('todo-text').value.trim();
  if (!text) return;
  const time = document.getElementById('todo-time').value || '';

  await addDoc(colTodos, {
    text,
    time,
    done: false,
    date: todayStr(),
    createdAt: Date.now()
  });

  document.getElementById('todo-text').value = '';
  document.getElementById('todo-time').value = '';
};

window.toggleTodo = async (id, current) => {
  await updateDoc(doc(db, "todos", id), { done: current !== true });
};

window.deleteTodo = async (id) => {
  await deleteDoc(doc(db, "todos", id));
};

function renderTodos() {
  const today = todayStr();
  const list = data.todos
    .filter(t => t.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt);

  const el = document.getElementById('todo-list');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = emptyState('ยังไม่มีงานวันนี้ 🌸');
    return;
  }

  el.innerHTML = list.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}">
      <div class="todo-checkbox ${t.done ? 'checked' : ''}" onclick="toggleTodo('${t.id}', ${t.done === true})"></div>
      <div class="todo-content">
        <div class="todo-text">${t.text}</div>
        ${t.time ? `<div class="todo-time">⏰ ${t.time}</div>` : ''}
      </div>
      <button class="btn-icon danger" onclick="deleteTodo('${t.id}')">🗑</button>
    </div>
  `).join('');
}

// ===== ARCHIVE =====
window.openArchiveModal = function() {
  renderArchive();
  openModal('modal-archive');
};

function renderArchive() {
  const past = data.todos
    .filter(t => t.date !== todayStr())
    .sort((a, b) => b.date.localeCompare(a.date) || (a.time || '').localeCompare(b.time || ''));

  const el = document.getElementById('archive-list');
  if (!el) return;

  if (!past.length) {
    el.innerHTML = emptyState('ยังไม่มีประวัติ');
    return;
  }

  const groups = {};
  past.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  el.innerHTML = Object.entries(groups).map(([date, items]) => `
    <div class="archive-day-group">
      <div class="archive-day-label">${fmtDate(date)}</div>
      ${items.map(t => `
        <div class="todo-item ${t.done ? 'done' : ''}" style="margin-bottom:6px;">
          <div class="todo-checkbox ${t.done ? 'checked' : ''}"></div>
          <div class="todo-content">
            <div class="todo-text">${t.text}</div>
            ${t.time ? `<div class="todo-time">⏰ ${t.time}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ===== RENDER ALL =====
function renderAll() {
  renderDashboard();
  renderStock();
  renderFinance();
  renderOrders();
}

// ===== INIT =====
function init() {
  const now = new Date();
  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('th-TH', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric'
    });

  const finDate = document.getElementById('fin-date');
  if (finDate) finDate.value = todayStr();

  // show FAB on home by default
  const fab = document.getElementById('todo-fab');
  if (fab) fab.style.display = 'flex';

  initRealtime();
  lucide.createIcons();
}

init();