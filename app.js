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
const colStock = collection(db, "stock");
const colFinance = collection(db, "finance");
const colOrders = collection(db, "orders");

// ===== DATA =====
let data = { stock: [], finance: [], orders: [] };

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
}

// ===== UTILS =====
function todayStr() {
  return new Date().toISOString().slice(0,10);
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' });
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
};

// ===== MODAL =====
window.openModal = function(id) {
  const el = document.getElementById(id);

  if (!el) {
    console.error("Modal not found:", id);
    return;
  }

  el.classList.add('open');
};

window.closeModal = function(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.classList.remove('open');
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
    const name = (s.name || '').toLowerCase();
    const match = name.includes(q);

    if (stockFilter === 'flower') return match && s.type === 'flower';
    if (stockFilter === 'supply') return match && s.type === 'supply';
    if (stockFilter === 'low') return match && s.qty <= (s.min || 0);

    return match;
  });

  const el = document.getElementById('stock-list');
  if (!list.length) return el.innerHTML = emptyState('ไม่มีรายการ');

  el.innerHTML = list.map(s => {
    const badge =
      s.qty === 0 ? 'หมด' :
      s.qty <= (s.min || 0) ? 'ใกล้หมด' : 'มี';

    return `
    <div class="item-card">
      <div class="item-card-left">
        <div class="item-name">${s.name}</div>
        <div class="item-sub">${s.qty} ${s.unit || ''}</div>
      </div>
      <div class="item-actions">
        <span>${badge}</span>
        <button onclick="editStock('${s.id}')">✏️</button>
        <button onclick="deleteItem('stock','${s.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

window.editStock = id => {
  const s = data.stock.find(x => x.id === id);
  if (!s) return;

  document.getElementById('stock-edit-id').value = id;
  document.getElementById('stock-name').value = s.name;
  document.getElementById('stock-qty').value = s.qty;

  openModal('modal-stock');
};

window.saveStock = async () => {
  const name = document.getElementById('stock-name').value.trim();
  if (!name) return alert('กรอกชื่อ');

  const obj = {
    name,
    type: document.getElementById('stock-type').value,
    unit: document.getElementById('stock-unit').value,
    qty: parseFloat(document.getElementById('stock-qty').value) || 0,
    min: parseFloat(document.getElementById('stock-min').value) || 0,
    cost: parseFloat(document.getElementById('stock-cost').value) || 0,
    price: parseFloat(document.getElementById('stock-price').value) || 0,
    note: document.getElementById('stock-note').value
  };

  const id = document.getElementById('stock-edit-id').value;

  if (id) {
    await updateDoc(doc(db, "stock", id), obj);
  } else {
    await addDoc(colStock, obj);
  }

  closeModal('modal-stock');
};

// ===== FINANCE =====
window.saveFinance = async () => {
  const name = document.getElementById('fin-name').value.trim();
  const amount = parseFloat(document.getElementById('fin-amount').value);

  if (!name || !amount) return alert('กรอกข้อมูล');

  await addDoc(colFinance, {
    type: document.getElementById('fin-type').value,
    name,
    amount,
    date: document.getElementById('fin-date').value || todayStr(),
    cat: document.getElementById('fin-cat').value,
    note: document.getElementById('fin-note').value
  });

  closeModal('modal-finance');
};

// ===== ORDER =====
window.saveOrder = async () => {
  const customer = document.getElementById('order-customer').value.trim();
  if (!customer) return alert('กรอกชื่อ');

  await addDoc(colOrders, {
    customer,
    desc: document.getElementById('order-desc').value,
    price: parseFloat(document.getElementById('order-price').value) || 0,
    date: document.getElementById('order-date').value || todayStr(),
    contact: document.getElementById('order-contact').value,
    status: document.getElementById('order-status').value,
    note: document.getElementById('order-note').value
  });

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

  const income = todayFin.filter(f => f.type === 'income')
    .reduce((s,f)=>s+f.amount,0);

  const expense = todayFin.filter(f => f.type === 'expense')
    .reduce((s,f)=>s+f.amount,0);

  document.getElementById('dash-income').textContent = fmtMoney(income);
  document.getElementById('dash-expense').textContent = fmtMoney(expense);

  document.getElementById('dash-pending').textContent =
    data.orders.filter(o => o.status === 'pending').length;

  document.getElementById('dash-lowstock').textContent =
    data.stock.filter(s => s.qty <= (s.min || 0)).length;
}

// ===== RENDER ALL =====
function renderAll() {
  renderDashboard();
  renderStock();
}

// ===== INIT =====
function init() {
  const now = new Date();

  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('th-TH', {
      weekday:'long',
      day:'numeric',
      month:'long',
      year:'numeric'
    });

  initRealtime();
}

init();