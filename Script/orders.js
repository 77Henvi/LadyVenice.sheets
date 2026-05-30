import { db, colOrders } from './firebase.js';
import { data, todayStr, thisMonthStr, fmtDate, fmtMoney, emptyState } from './utils.js';
import { addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let orderFilter        = 'all';
let selectedOrderMonth = 'all';

export const ORDER_STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  ready:   'พร้อมส่ง',
  done:    'เสร็จแล้ว',
  cancel:  'ยกเลิก'
};

// ===== MODAL =====
window.openOrderModal = function() {
  document.getElementById('order-edit-id').value           = '';
  document.getElementById('order-modal-title').textContent = 'เพิ่มออเดอร์';
  document.getElementById('order-customer').value          = '';
  document.getElementById('order-desc').value              = '';
  document.getElementById('order-price').value             = '';
  document.getElementById('order-date').value              = '';
  document.getElementById('order-contact').value           = '';
  document.getElementById('order-status').value            = 'pending';
  document.getElementById('order-note').value              = '';
  window.openModal('modal-order');
};

// ===== MONTH SELECT =====
function populateOrderMonthSelect() {
  const select = document.getElementById('order-month-select');
  if (!select) return;

  const months = new Set(data.orders.map(o => (o.date || '').slice(0, 7)).filter(Boolean));
  months.add(thisMonthStr());

  const sorted  = [...months].sort((a, b) => b.localeCompare(a));
  const current = selectedOrderMonth;

  const allOption    = `<option value="all" ${current === 'all' ? 'selected' : ''}>📋 ออเดอร์ทั้งหมด</option>`;
  const monthOptions = sorted.map(m => {
    const [y, mo] = m.split('-');
    const label   = new Date(+y, +mo - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const isNow   = m === thisMonthStr() ? ' (เดือนนี้)' : '';
    return `<option value="${m}" ${m === current ? 'selected' : ''}>${label}${isNow}</option>`;
  }).join('');

  select.innerHTML = allOption + monthOptions;
}

window.onOrderMonthChange = function() {
  selectedOrderMonth = document.getElementById('order-month-select').value;
  renderOrders();
};

// ===== FILTER =====
window.setOrderFilter = (f, el) => {
  orderFilter = f;
  document.querySelectorAll('#page-order .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderOrders();
};

// ===== RENDER =====
export function renderOrders() {
  populateOrderMonthSelect();

  let list = [...data.orders].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  if (selectedOrderMonth !== 'all') list = list.filter(o => (o.date || '').startsWith(selectedOrderMonth));
  if (orderFilter !== 'all')        list = list.filter(o => o.status === orderFilter);

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

// ===== EDIT =====
window.editOrder = id => {
  const o = data.orders.find(x => x.id === id);
  if (!o) return;

  document.getElementById('order-edit-id').value           = id;
  document.getElementById('order-modal-title').textContent = 'แก้ไขออเดอร์';
  document.getElementById('order-customer').value          = o.customer || '';
  document.getElementById('order-desc').value              = o.desc     || '';
  document.getElementById('order-price').value             = o.price    ?? '';
  document.getElementById('order-date').value              = o.date     || '';
  document.getElementById('order-contact').value           = o.contact  || '';
  document.getElementById('order-status').value            = o.status   || 'pending';
  document.getElementById('order-note').value              = o.note     || '';
  window.openModal('modal-order');
};

// ===== SAVE =====
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
  if (id) await updateDoc(doc(db, "orders", id), obj);
  else    await addDoc(colOrders, obj);
  window.closeModal('modal-order');
};