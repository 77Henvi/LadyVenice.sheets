import { data, fmtDate, fmtMoney, emptyState } from './utils.js';

const MONTH_LABELS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTH_FULL   = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

let statsChartInstance = null;

function populateStatsYearSelect() {
  const select = document.getElementById('stats-year-select');
  if (!select) return;

  const years   = new Set(data.orders.map(o => (o.date || '').slice(0, 4)).filter(Boolean));
  years.add(String(new Date().getFullYear()));

  const sorted  = [...years].sort((a, b) => b.localeCompare(a));
  const current = select.value || String(new Date().getFullYear());

  select.innerHTML = sorted.map(y =>
    `<option value="${y}" ${y === current ? 'selected' : ''}>${y}</option>`
  ).join('');
}

export function renderStats() {
  populateStatsYearSelect();
  const select = document.getElementById('stats-year-select');
  if (!select) return;
  const year = select.value || String(new Date().getFullYear());

  const yearOrders  = data.orders.filter(o => (o.date || '').startsWith(year));
  const yearFinance = data.finance.filter(f => (f.date || '').startsWith(year));

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const mo       = String(i + 1).padStart(2, '0');
    const prefix   = `${year}-${mo}`;
    const orders   = yearOrders.filter(o => (o.date || '').startsWith(prefix));
    const expenses = yearFinance.filter(f => f.type === 'expense' && (f.date || '').startsWith(prefix));
    const income   = yearFinance.filter(f => f.type === 'income'  && (f.date || '').startsWith(prefix));
    const revenue  = orders.reduce((s, o) => s + (o.price || 0), 0);
    const expense  = expenses.reduce((s, f) => s + (f.amount || 0), 0);
    return { label: MONTH_LABELS[i], full: MONTH_FULL[i], count: orders.length, revenue, expense, profit: revenue - expense, orders, expenses, income };
  });

  // KPI
  const totalOrders  = yearOrders.length;
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const activeMonths = monthly.filter(m => m.count > 0);
  const avgMonth     = activeMonths.length ? totalRevenue / activeMonths.length : 0;
  const bestMonth    = [...monthly].sort((a, b) => b.revenue - a.revenue)[0];

  document.getElementById('stats-total-orders').textContent  = totalOrders;
  document.getElementById('stats-total-revenue').textContent = fmtMoney(totalRevenue);
  document.getElementById('stats-avg-month').textContent     = fmtMoney(Math.round(avgMonth));
  document.getElementById('stats-best-month').textContent    = bestMonth.count > 0 ? bestMonth.full : '—';

  const netEl = document.getElementById('stats-net-profit');
  if (netEl) {
    const net      = totalRevenue - totalExpense;
    netEl.textContent = fmtMoney(net);
    netEl.style.color = net >= 0 ? 'var(--sage)' : 'var(--dusty-rose-dark)';
  }
  const expEl = document.getElementById('stats-total-expense');
  if (expEl) expEl.textContent = fmtMoney(totalExpense);

  // Chart
  const canvas = document.getElementById('stats-chart');
  if (!canvas) return;
  if (statsChartInstance) statsChartInstance.destroy();

  const rose     = '#c9897a';
  const roseFill = 'rgba(201,137,122,0.12)';
  const sage     = '#8a9e8c';
  const sageFill = 'rgba(138,158,140,0.10)';

  statsChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: 'รายรับ (ออเดอร์)',
          data: monthly.map(m => m.revenue),
          borderColor: rose, backgroundColor: roseFill, borderWidth: 2.5,
          pointBackgroundColor: monthly.map(m => m.count > 0 ? rose : 'rgba(201,137,122,0.3)'),
          pointBorderColor: rose,
          pointRadius: monthly.map(m => m.count > 0 ? 6 : 3),
          pointHoverRadius: 9, tension: 0.38, fill: true, order: 1,
        },
        {
          label: 'รายจ่าย',
          data: monthly.map(m => m.expense),
          borderColor: sage, backgroundColor: sageFill, borderWidth: 2, borderDash: [5, 4],
          pointBackgroundColor: monthly.map(m => m.expense > 0 ? sage : 'rgba(138,158,140,0.3)'),
          pointBorderColor: sage,
          pointRadius: monthly.map(m => m.expense > 0 ? 5 : 2),
          pointHoverRadius: 8, tension: 0.38, fill: true, order: 2,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true, position: 'top', align: 'end',
          labels: { boxWidth: 10, boxHeight: 10, borderRadius: 3, useBorderRadius: true,
            font: { family: 'DM Sans', size: 11 }, color: '#7a7a78', padding: 12 }
        },
        tooltip: { enabled: false }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#7a7a78' } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(44,44,42,0.05)', drawBorder: false },
          ticks: { font: { family: 'DM Sans', size: 11 }, color: '#7a7a78', maxTicksLimit: 6,
            callback: v => v === 0 ? '0' : (v >= 1000 ? '฿'+(v/1000).toFixed(0)+'k' : '฿'+v) }
        }
      },
      onClick: (e, elements) => {
        if (!elements.length) return;
        showStatsModal(monthly[elements[0].index]);
      },
      onHover: (e, elements) => { canvas.style.cursor = elements.length ? 'pointer' : 'default'; }
    }
  });

  // Monthly list
  const listEl     = document.getElementById('stats-month-list');
  const activeList = monthly.filter(m => m.count > 0 || m.expense > 0).reverse();
  if (!activeList.length) { listEl.innerHTML = emptyState('ยังไม่มีข้อมูลในปีนี้'); return; }

  listEl.innerHTML = activeList.map(m => {
    const profitColor = m.profit >= 0 ? 'var(--sage)' : 'var(--dusty-rose-dark)';
    const profitSign  = m.profit >= 0 ? '+' : '';
    return `
    <div class="item-card stats-month-row" onclick="showStatsModal(${JSON.stringify(m).replace(/"/g,'&quot;')})" style="cursor:pointer;">
      <div class="item-card-left">
        <div class="item-name">${m.full}</div>
        <div class="item-sub">${m.count} ออเดอร์ · จ่าย ${fmtMoney(m.expense)}</div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:2px;align-items:flex-end;">
        <span class="finance-amount income" style="font-size:13px;">${fmtMoney(m.revenue)}</span>
        <span style="font-size:11px;font-weight:500;color:${profitColor};">${profitSign}${fmtMoney(m.profit)}</span>
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}
window.renderStats = renderStats;

window.showStatsModal = function(month) {
  if (typeof month === 'string') month = JSON.parse(month);

  document.getElementById('sm-month-title').textContent = month.full;
  document.getElementById('sm-revenue').textContent     = fmtMoney(month.revenue);
  document.getElementById('sm-expense').textContent     = fmtMoney(month.expense);

  const profit   = month.profit;
  const profitEl = document.getElementById('sm-profit');
  profitEl.textContent = (profit >= 0 ? '+' : '') + fmtMoney(profit);
  profitEl.style.color = profit >= 0 ? 'var(--sage)' : 'var(--dusty-rose-dark)';

  const ordersEl = document.getElementById('sm-orders-list');
  ordersEl.innerHTML = !month.orders?.length
    ? '<div class="sm-empty">ไม่มีออเดอร์</div>'
    : month.orders.map(o => `
      <div class="sm-row">
        <div class="sm-row-left">
          <div class="sm-row-name">${o.customer}</div>
          ${o.desc ? `<div class="sm-row-sub">${o.desc}</div>` : ''}
          ${o.date ? `<div class="sm-row-date">${fmtDate(o.date)}</div>` : ''}
        </div>
        <div class="sm-row-amount income">${fmtMoney(o.price)}</div>
      </div>`).join('');

  const expEl = document.getElementById('sm-expense-list');
  expEl.innerHTML = !month.expenses?.length
    ? '<div class="sm-empty">ไม่มีรายจ่าย</div>'
    : month.expenses.map(f => `
      <div class="sm-row">
        <div class="sm-row-left">
          <div class="sm-row-name">${f.name}</div>
          ${f.cat ? `<div class="sm-row-sub">${f.cat}</div>` : ''}
        </div>
        <div class="sm-row-amount expense">-${fmtMoney(f.amount)}</div>
      </div>`).join('');

  window.openModal('modal-stats-detail');
};

window.closeStatsTooltip = function() {
  document.getElementById('stats-tooltip').style.display = 'none';
};