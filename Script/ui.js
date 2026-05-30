// ===== TAB =====
window.switchTab = function(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.getElementById('nav-' + tab).classList.add('active');

  // FAB เฉพาะหน้า home
  const fab = document.getElementById('todo-fab');
  if (fab) fab.style.display = tab === 'home' ? 'flex' : 'none';

  // render stats เมื่อเปิด tab
  if (tab === 'stats') window.renderStats && window.renderStats();

  // ซ่อน tooltip เมื่อเปลี่ยน tab
  const tt = document.getElementById('stats-tooltip');
  if (tt) tt.style.display = 'none';
};