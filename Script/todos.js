import { db, colTodos } from './firebase.js';
import { data, todayStr, fmtDate, emptyState } from './utils.js';
import { addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== ADD =====
window.addTodo = async () => {
  const text = document.getElementById('todo-text').value.trim();
  if (!text) return;
  const time = document.getElementById('todo-time').value || '';

  await addDoc(colTodos, {
    text, time, done: false,
    date: todayStr(), createdAt: Date.now()
  });

  document.getElementById('todo-text').value = '';
  document.getElementById('todo-time').value = '';
};

// ===== TOGGLE =====
window.toggleTodo = async (id, current) => {
  await updateDoc(doc(db, "todos", id), { done: current !== true });
};

// ===== DELETE =====
window.deleteTodo = async (id) => {
  await deleteDoc(doc(db, "todos", id));
};

// ===== RENDER TODAY =====
export function renderTodos() {
  const today = todayStr();
  const list  = data.todos
    .filter(t => t.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt);

  const el = document.getElementById('todo-list');
  if (!el) return;

  if (!list.length) { el.innerHTML = emptyState('ยังไม่มีงานวันนี้ 🌸'); return; }

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
  window.openModal('modal-archive');
};

function renderArchive() {
  const past = data.todos
    .filter(t => t.date !== todayStr())
    .sort((a, b) => b.date.localeCompare(a.date) || (a.time || '').localeCompare(b.time || ''));

  const el = document.getElementById('archive-list');
  if (!el) return;

  if (!past.length) { el.innerHTML = emptyState('ยังไม่มีประวัติ'); return; }

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