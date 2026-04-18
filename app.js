/* ===== DATA & STATE ===== */
const CATEGORIES = {
  'Rent': { icon: '🏠', color: '#6366f1', subs: ['Monthly Rent', 'Utilities', 'Internet', 'Other'] },
  'Investments': { icon: '📈', color: '#10b981', subs: ['Stocks', 'ETF', 'Crypto', 'Savings', 'Real Estate', 'Other'] },
  'Apartment': { icon: '🛋️', color: '#f59e0b', subs: ['Furniture', 'Repairs', 'Cleaning', 'Appliances', 'Decoration', 'Other'] },
  'Food': { icon: '🍔', color: '#ef4444', subs: ['Groceries', 'Restaurants', 'Takeaway', 'Coffee', 'Snacks', 'Other'] },
  'Going Out': { icon: '🎉', color: '#8b5cf6', subs: ['Bars & Clubs', 'Cinema', 'Events', 'Travel', 'Sports', 'Hobbies', 'Other'] },
  'Loans': { icon: '💳', color: '#06b6d4', subs: ['Car Loan', 'Personal Loan', 'Credit Card', 'Mortgage', 'Other'] }
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let state = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDay: null,
  expenses: [],
  income: []
};

/* ===== STORAGE ===== */
function saveData() {
  localStorage.setItem('et_expenses', JSON.stringify(state.expenses));
  localStorage.setItem('et_income', JSON.stringify(state.income));
}

function loadData() {
  try {
    state.expenses = JSON.parse(localStorage.getItem('et_expenses') || '[]');
    state.income = JSON.parse(localStorage.getItem('et_income') || '[]');
  } catch(e) {
    state.expenses = [];
    state.income = [];
  }
}

/* ===== HELPERS ===== */
function fmt(n) {
  return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getMonthExpenses(year, month) {
  return state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getMonthIncome(year, month) {
  return state.income.filter(i => {
    const d = new Date(i.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function sumAmount(arr) {
  return arr.reduce((s, i) => s + Number(i.amount), 0);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ===== SUBCATEGORY UPDATE ===== */
function updateSubcategories() {
  const cat = document.getElementById('expCategory').value;
  const sub = document.getElementById('expSubcategory');
  sub.innerHTML = '<option value="">Select subcategory...</option>';
  if (cat && CATEGORIES[cat]) {
    CATEGORIES[cat].subs.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      sub.appendChild(o);
    });
  }
}

/* ===== MODAL ===== */
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

/* ===== MONTH NAVIGATION ===== */
function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
  if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
  state.selectedDay = null;
  updateYearSelect();
  renderAll();
}

/* ===== YEAR SELECT ===== */
function updateYearSelect() {
  const sel = document.getElementById('yearSelect');
  const cur = sel.value ? parseInt(sel.value) : state.currentYear;
  sel.innerHTML = '';
  const years = [];
  const now = new Date().getFullYear();
  for (let y = now - 3; y <= now + 2; y++) years.push(y);
  years.forEach(y => {
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    if (y === state.currentYear) o.selected = true;
    sel.appendChild(o);
  });
}

/* ===== RENDER ALL ===== */
function renderAll() {
  const label = MONTHS[state.currentMonth] + ' ' + state.currentYear;
  document.getElementById('currentMonthLabel').textContent = label;
  document.getElementById('expMonthLabel').textContent = label;
  document.getElementById('incMonthLabel').textContent = label;
  document.getElementById('yearly-year').textContent = state.currentYear;

  renderDashboard();
  renderExpensesList();
  renderIncomeList();
  renderYearly();
  // Day filter after a tick so DOM is fully painted
  setTimeout(renderDayFilter, 0);
}

/* ===== DAY FILTER ===== */
function renderDayFilter() {
  const strip = document.getElementById('dayFilterStrip');
  if (!strip) return;

  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth;
  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // Find which days have data
  const daysWithData = new Set();
  state.expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === state.currentYear && d.getMonth() === state.currentMonth)
      daysWithData.add(d.getDate());
  });
  state.income.forEach(i => {
    const d = new Date(i.date);
    if (d.getFullYear() === state.currentYear && d.getMonth() === state.currentMonth)
      daysWithData.add(d.getDate());
  });

  strip.innerHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentYear, state.currentMonth, day);
    const dayName = DAY_NAMES[date.getDay()];
    const isToday = isCurrentMonth && today.getDate() === day;
    const isActive = state.selectedDay === day;
    const hasData = daysWithData.has(day);

    const btn = document.createElement('button');
    btn.className = 'day-pill' +
      (isToday ? ' today' : '') +
      (isActive ? ' active' : '') +
      (hasData ? ' has-data' : '');
    btn.innerHTML = `<span class="day-pill-num">${day}</span><span class="day-pill-name">${dayName}</span>`;
    btn.addEventListener('click', () => toggleDayFilter(day));
    strip.appendChild(btn);
  }

  // Scroll to today or selected day
  const scrollTo = state.selectedDay || (isCurrentMonth ? today.getDate() : 1);
  const targetBtn = strip.children[scrollTo - 1];
  if (targetBtn) {
    setTimeout(() => targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
  }
}

function toggleDayFilter(day) {
  state.selectedDay = state.selectedDay === day ? null : day;
  renderDayFilter();
  renderDashboard();
}

function clearDayFilter() {
  state.selectedDay = null;
  renderDayFilter();
  renderDashboard();
}

/* ===== DAILY BUDGET CALC ===== */
function getDailyBudget(balance) {
  const today = new Date();
  const isCurrentMonth = (
    state.currentYear === today.getFullYear() &&
    state.currentMonth === today.getMonth()
  );

  if (!isCurrentMonth) return null;

  const todayDay = today.getDate();
  const SALARY_DAY = 28;

  let daysLeft;
  let nextSalaryLabel;

  if (todayDay < SALARY_DAY) {
    // Before salary day this month
    daysLeft = SALARY_DAY - todayDay;
    nextSalaryLabel = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until salary (28th)`;
  } else {
    // On or after salary day — count to 28th of next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, SALARY_DAY);
    const msPerDay = 1000 * 60 * 60 * 24;
    daysLeft = Math.ceil((nextMonth - today) / msPerDay);
    nextSalaryLabel = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until next salary`;
  }

  if (daysLeft <= 0) daysLeft = 1;
  const daily = balance / daysLeft;
  return { daily, daysLeft, nextSalaryLabel };
}

/* ===== DASHBOARD ===== */
function renderDashboard() {
  const allExpenses = getMonthExpenses(state.currentYear, state.currentMonth);
  const allIncomes  = getMonthIncome(state.currentYear, state.currentMonth);

  // Apply day filter if active
  const filtered = state.selectedDay !== null;
  const expenses = filtered
    ? allExpenses.filter(e => new Date(e.date).getDate() === state.selectedDay)
    : allExpenses;
  const incomes = filtered
    ? allIncomes.filter(i => new Date(i.date).getDate() === state.selectedDay)
    : allIncomes;

  // Day filter label
  const labelEl  = document.getElementById('day-filter-label');
  const textEl   = document.getElementById('day-filter-text');
  const barWrap  = document.getElementById('bar-chart-container');
  const dayTxWrap = document.getElementById('day-transactions-container');

  if (filtered) {
    const d = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    textEl.textContent = dateStr;
    labelEl.classList.remove('hidden');
    barWrap.classList.add('hidden');
    dayTxWrap.classList.remove('hidden');
    document.getElementById('breakdown-title').textContent = 'Spending Breakdown — ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    renderDayTransactions(expenses, incomes);
  } else {
    labelEl.classList.add('hidden');
    barWrap.classList.remove('hidden');
    dayTxWrap.classList.add('hidden');
    document.getElementById('breakdown-title').textContent = 'Spending Breakdown';
  }

  const totalIncome   = sumAmount(incomes);
  const totalExpenses = sumAmount(expenses);
  const balance       = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  document.getElementById('dash-income').textContent   = fmt(totalIncome);
  document.getElementById('dash-expenses').textContent = fmt(totalExpenses);
  document.getElementById('dash-balance').textContent  = fmt(balance);
  document.getElementById('dash-savings').textContent  = savingsRate.toFixed(1) + '%';

  const balEl = document.getElementById('dash-balance');
  balEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';

  // --- Card 5: Daily Budget (always based on full month, not filtered day) ---
  const fullBalance = sumAmount(allIncomes) - sumAmount(allExpenses);
  const dailyCard   = document.getElementById('dash-daily-card');
  const budgetInfo  = getDailyBudget(fullBalance);
  if (budgetInfo && !filtered) {
    const { daily, nextSalaryLabel } = budgetInfo;
    const dailyEl = document.getElementById('dash-daily');
    dailyEl.textContent  = fmt(Math.abs(daily)) + '/day';
    dailyEl.style.color  = daily >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('dash-daily-sub').textContent =
      daily < 0 ? `⚠️ Over budget · ${nextSalaryLabel}` : `✅ ${nextSalaryLabel}`;
    dailyCard.style.display = '';
  } else {
    dailyCard.style.display = 'none';
  }

  // --- Card 6: Left Today (daily budget - today's spending, non-cumulative) ---
  const todayCard = document.getElementById('dash-today-card');
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === state.currentYear && today.getMonth() === state.currentMonth;

  if (isCurrentMonth && budgetInfo && !filtered) {
    const { daily } = budgetInfo;
    const todayStr = today.toISOString().split('T')[0];
    const spentToday = allExpenses
      .filter(e => e.date === todayStr)
      .reduce((s, e) => s + Number(e.amount), 0);
    const leftToday = daily - spentToday;

    const todayEl = document.getElementById('dash-today');
    todayEl.textContent = fmt(Math.abs(leftToday));
    todayEl.style.color = leftToday >= 0 ? '#f97316' : 'var(--danger)';
    document.getElementById('dash-today-sub').textContent =
      leftToday < 0
        ? `⚠️ €${spentToday.toFixed(2)} spent · €${Math.abs(leftToday).toFixed(2)} over`
        : `€${spentToday.toFixed(2)} spent today`;
    todayCard.style.display = '';
  } else {
    todayCard.style.display = 'none';
  }

  renderDonutChart(expenses);
  if (!filtered) renderBarChart();
  renderCategoryBreakdown(expenses);
}

/* ===== DAY TRANSACTIONS LIST ===== */
function renderDayTransactions(expenses, incomes) {
  const container = document.getElementById('day-transactions-list');
  const title = document.getElementById('day-transactions-title');

  const allItems = [
    ...expenses.map(e => ({ ...e, _type: 'expense' })),
    ...incomes.map(i => ({ ...i, _type: 'income' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  title.textContent = `Transactions (${allItems.length})`;

  if (!allItems.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🗓️</div><p>No transactions on this day.</p></div>';
    return;
  }

  container.innerHTML = allItems.map(item => {
    if (item._type === 'expense') {
      const cat = CATEGORIES[item.category] || { icon: '❓', color: '#94a3b8' };
      return `
        <div class="transaction-item">
          <div class="transaction-icon" style="background:${cat.color}22"><span>${cat.icon}</span></div>
          <div class="transaction-info">
            <div class="transaction-category">${item.category}</div>
            <div class="transaction-sub">${item.subcategory}${item.notes ? ' · ' + item.notes : ''}</div>
          </div>
          <div class="transaction-right">
            <div class="transaction-amount">-${fmt(item.amount)}</div>
          </div>
        </div>`;
    } else {
      const icon = item.type === 'Salary' ? '💼' : '⭐';
      return `
        <div class="transaction-item">
          <div class="transaction-icon" style="background:#d1fae5"><span>${icon}</span></div>
          <div class="transaction-info">
            <div class="transaction-category">${item.type}</div>
            <div class="transaction-sub">${item.source}${item.notes ? ' · ' + item.notes : ''}</div>
          </div>
          <div class="transaction-right">
            <div class="transaction-amount income">+${fmt(item.amount)}</div>
          </div>
        </div>`;
    }
  }).join('');
}

/* ===== DONUT CHART ===== */
function renderDonutChart(expenses) {
  const canvas = document.getElementById('donutChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const catTotals = {};
  Object.keys(CATEGORIES).forEach(c => catTotals[c] = 0);
  expenses.forEach(e => { if (catTotals[e.category] !== undefined) catTotals[e.category] += Number(e.amount); });

  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
  document.getElementById('donut-total').textContent = fmt(total);

  const legend = document.getElementById('donut-legend');
  legend.innerHTML = '';

  if (total === 0) {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(W/2, H/2, W/2 - 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W/2, H/2, W/2 - 60, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    return;
  }

  let startAngle = -Math.PI / 2;
  const cx = W/2, cy = H/2, outerR = W/2 - 16, innerR = W/2 - 56;

  Object.entries(catTotals).forEach(([cat, amt]) => {
    if (amt === 0) return;
    const slice = (amt / total) * Math.PI * 2;
    const color = CATEGORIES[cat].color;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += slice;
  });

  // Inner circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Legend
  Object.entries(catTotals).forEach(([cat, amt]) => {
    if (amt === 0) return;
    const pct = ((amt / total) * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-left">
        <div class="legend-dot" style="background:${CATEGORIES[cat].color}"></div>
        <span class="legend-name">${CATEGORIES[cat].icon} ${cat}</span>
      </div>
      <div class="legend-right">
        <span class="legend-amount">${fmt(amt)}</span>
        <span class="legend-pct">${pct}%</span>
      </div>`;
    legend.appendChild(item);
  });
}

/* ===== BAR CHART (monthly overview) ===== */
function renderBarChart() {
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 340;
  const H = 200;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const months = [];
  for (let m = 0; m < 12; m++) {
    const exp = sumAmount(getMonthExpenses(state.currentYear, m));
    const inc = sumAmount(getMonthIncome(state.currentYear, m));
    months.push({ m, exp, inc });
  }

  const maxVal = Math.max(...months.map(m => Math.max(m.exp, m.inc)), 1);
  const padL = 8, padR = 8, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barGroupW = chartW / 12;
  const barW = barGroupW * 0.3;

  months.forEach(({ m, exp, inc }) => {
    const x = padL + m * barGroupW + barGroupW / 2;
    const isActive = m === state.currentMonth;

    // Income bar
    const incH = (inc / maxVal) * chartH;
    ctx.fillStyle = isActive ? '#10b981' : '#a7f3d0';
    ctx.beginPath();
    ctx.roundRect(x - barW - 1, padT + chartH - incH, barW, incH, [3, 3, 0, 0]);
    ctx.fill();

    // Expense bar
    const expH = (exp / maxVal) * chartH;
    ctx.fillStyle = isActive ? '#ef4444' : '#fecaca';
    ctx.beginPath();
    ctx.roundRect(x + 1, padT + chartH - expH, barW, expH, [3, 3, 0, 0]);
    ctx.fill();

    // Month label
    ctx.fillStyle = isActive ? '#6366f1' : '#94a3b8';
    ctx.font = isActive ? 'bold 10px sans-serif' : '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MONTHS[m].slice(0, 3), x, H - 8);
  });
}

/* ===== CATEGORY BREAKDOWN ===== */
function renderCategoryBreakdown(expenses) {
  const container = document.getElementById('category-breakdown');
  container.innerHTML = '';

  const catTotals = {};
  Object.keys(CATEGORIES).forEach(c => catTotals[c] = 0);
  expenses.forEach(e => { if (catTotals[e.category] !== undefined) catTotals[e.category] += Number(e.amount); });

  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);

  if (total === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No expenses this month</p></div>';
    return;
  }

  Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      if (amt === 0) return;
      const pct = ((amt / total) * 100).toFixed(1);
      const div = document.createElement('div');
      div.className = 'category-item';
      div.innerHTML = `
        <div class="category-header">
          <span class="category-name">${CATEGORIES[cat].icon} ${cat}</span>
          <span class="category-amount">${fmt(amt)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;background:${CATEGORIES[cat].color}"></div>
        </div>
        <div class="category-pct">${pct}% of total expenses</div>`;
      container.appendChild(div);
    });
}

/* ===== EXPENSES LIST ===== */
function renderExpensesList() {
  const list = document.getElementById('expenses-list');
  const expenses = getMonthExpenses(state.currentYear, state.currentMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (expenses.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💸</div><p>No expenses this month.<br>Tap + Add Expense to get started.</p></div>';
    return;
  }

  list.innerHTML = expenses.map(e => {
    const cat = CATEGORIES[e.category] || { icon: '❓', color: '#94a3b8' };
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `
      <div class="transaction-item">
        <div class="transaction-icon" style="background:${cat.color}22">
          <span>${cat.icon}</span>
        </div>
        <div class="transaction-info">
          <div class="transaction-category">${e.category}</div>
          <div class="transaction-sub">${e.subcategory}${e.notes ? ' · ' + e.notes : ''}</div>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount">-${fmt(e.amount)}</div>
          <div class="transaction-date">${dateStr}</div>
        </div>
        <div class="transaction-actions">
          <button class="btn-edit" onclick="editExpense('${e.id}')">✏️</button>
          <button class="btn-delete" onclick="deleteExpense('${e.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

/* ===== INCOME LIST ===== */
function renderIncomeList() {
  const list = document.getElementById('income-list');
  const incomes = getMonthIncome(state.currentYear, state.currentMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const salary = incomes.filter(i => i.type === 'Salary');
  const extra = incomes.filter(i => i.type === 'Extra Income');

  document.getElementById('inc-salary').textContent = fmt(sumAmount(salary));
  document.getElementById('inc-extra').textContent = fmt(sumAmount(extra));
  document.getElementById('inc-total').textContent = fmt(sumAmount(incomes));

  if (incomes.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">💵</div><p>No income this month.<br>Tap + Add Income to get started.</p></div>';
    return;
  }

  list.innerHTML = incomes.map(i => {
    const d = new Date(i.date);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const icon = i.type === 'Salary' ? '💼' : '⭐';
    return `
      <div class="transaction-item">
        <div class="transaction-icon" style="background:#d1fae5">
          <span>${icon}</span>
        </div>
        <div class="transaction-info">
          <div class="transaction-category">${i.type}</div>
          <div class="transaction-sub">${i.source}${i.notes ? ' · ' + i.notes : ''}</div>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount income">+${fmt(i.amount)}</div>
          <div class="transaction-date">${dateStr}</div>
        </div>
        <div class="transaction-actions">
          <button class="btn-edit" onclick="editIncome('${i.id}')">✏️</button>
          <button class="btn-delete" onclick="deleteIncome('${i.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

/* ===== YEARLY VIEW ===== */
function renderYearly() {
  let yearIncome = 0, yearExpenses = 0;
  const monthData = [];

  for (let m = 0; m < 12; m++) {
    const inc = sumAmount(getMonthIncome(state.currentYear, m));
    const exp = sumAmount(getMonthExpenses(state.currentYear, m));
    yearIncome += inc;
    yearExpenses += exp;
    monthData.push({ m, inc, exp, bal: inc - exp });
  }

  const yearBalance = yearIncome - yearExpenses;
  const yearSavings = yearIncome > 0 ? ((yearBalance / yearIncome) * 100) : 0;

  document.getElementById('year-income').textContent = fmt(yearIncome);
  document.getElementById('year-expenses').textContent = fmt(yearExpenses);
  document.getElementById('year-balance').textContent = fmt(yearBalance);
  document.getElementById('year-savings').textContent = yearSavings.toFixed(1) + '%';

  const yearBalEl = document.getElementById('year-balance');
  yearBalEl.style.color = yearBalance >= 0 ? 'var(--success)' : 'var(--danger)';

  renderYearlyBarChart(monthData);
  renderMonthlyTable(monthData);
}

/* ===== YEARLY BAR CHART ===== */
function renderYearlyBarChart(monthData) {
  const canvas = document.getElementById('yearlyBarChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 340;
  const H = 220;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(...monthData.map(m => Math.max(m.exp, m.inc)), 1);
  const padL = 8, padR = 8, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barGroupW = chartW / 12;
  const barW = barGroupW * 0.32;

  monthData.forEach(({ m, exp, inc }) => {
    const x = padL + m * barGroupW + barGroupW / 2;
    const isActive = m === state.currentMonth;

    const incH = (inc / maxVal) * chartH;
    ctx.fillStyle = isActive ? '#10b981' : '#a7f3d0';
    ctx.beginPath();
    ctx.roundRect(x - barW - 1, padT + chartH - incH, barW, incH, [3, 3, 0, 0]);
    ctx.fill();

    const expH = (exp / maxVal) * chartH;
    ctx.fillStyle = isActive ? '#ef4444' : '#fecaca';
    ctx.beginPath();
    ctx.roundRect(x + 1, padT + chartH - expH, barW, expH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = isActive ? '#6366f1' : '#94a3b8';
    ctx.font = isActive ? 'bold 10px sans-serif' : '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MONTHS[m].slice(0, 3), x, H - 8);
  });

  // Legend
  ctx.fillStyle = '#10b981';
  ctx.fillRect(padL, padT, 10, 10);
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Income', padL + 14, padT + 9);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(padL + 70, padT, 10, 10);
  ctx.fillStyle = '#64748b';
  ctx.fillText('Expenses', padL + 84, padT + 9);
}

/* ===== MONTHLY TABLE ===== */
function renderMonthlyTable(monthData) {
  const container = document.getElementById('monthly-table');
  const header = `<div class="month-row header">
    <span>Month</span><span>Income</span><span>Expenses</span><span>Balance</span>
  </div>`;

  const rows = monthData.map(({ m, inc, exp, bal }) => {
    const balClass = bal >= 0 ? 'positive' : 'negative';
    const isActive = m === state.currentMonth ? 'style="background:#f0f4ff;border-radius:8px"' : '';
    return `<div class="month-row" ${isActive}>
      <span class="month-name">${MONTHS[m].slice(0,3)}</span>
      <span class="col-income">${inc > 0 ? fmt(inc) : '-'}</span>
      <span class="col-expense">${exp > 0 ? fmt(exp) : '-'}</span>
      <span class="col-balance ${balClass}">${inc > 0 || exp > 0 ? fmt(bal) : '-'}</span>
    </div>`;
  }).join('');

  container.innerHTML = header + rows;
}

/* ===== ADD / EDIT EXPENSE ===== */
function openAddExpense() {
  document.getElementById('expenseEditId').value = '';
  document.getElementById('expenseModalTitle').textContent = 'Add Expense';
  document.getElementById('expenseForm').reset();
  document.getElementById('expSubcategory').innerHTML = '<option value="">Select subcategory...</option>';
  const today = new Date();
  const y = state.currentYear, mo = state.currentMonth;
  const d = new Date(y, mo, today.getDate() <= new Date(y, mo+1, 0).getDate() ? today.getDate() : 1);
  document.getElementById('expDate').value = d.toISOString().split('T')[0];
  openModal('expenseModal');
}

function editExpense(id) {
  const e = state.expenses.find(x => x.id === id);
  if (!e) return;
  document.getElementById('expenseEditId').value = id;
  document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
  document.getElementById('expCategory').value = e.category;
  updateSubcategories();
  setTimeout(() => {
    document.getElementById('expSubcategory').value = e.subcategory;
  }, 10);
  document.getElementById('expAmount').value = e.amount;
  document.getElementById('expDate').value = e.date;
  document.getElementById('expNotes').value = e.notes || '';
  openModal('expenseModal');
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveData();
  renderAll();
}

document.getElementById('expenseForm').addEventListener('submit', function(ev) {
  ev.preventDefault();
  const id = document.getElementById('expenseEditId').value;
  const entry = {
    id: id || uid(),
    category: document.getElementById('expCategory').value,
    subcategory: document.getElementById('expSubcategory').value,
    amount: parseFloat(document.getElementById('expAmount').value),
    date: document.getElementById('expDate').value,
    notes: document.getElementById('expNotes').value.trim()
  };
  if (id) {
    const idx = state.expenses.findIndex(e => e.id === id);
    if (idx !== -1) state.expenses[idx] = entry;
  } else {
    state.expenses.push(entry);
  }
  saveData();
  closeModal('expenseModal');
  renderAll();
});

/* ===== ADD / EDIT INCOME ===== */
function openAddIncome() {
  document.getElementById('incomeEditId').value = '';
  document.getElementById('incomeModalTitle').textContent = 'Add Income';
  document.getElementById('incomeForm').reset();
  const today = new Date();
  const y = state.currentYear, mo = state.currentMonth;
  const d = new Date(y, mo, today.getDate() <= new Date(y, mo+1, 0).getDate() ? today.getDate() : 1);
  document.getElementById('incDate').value = d.toISOString().split('T')[0];
  openModal('incomeModal');
}

function editIncome(id) {
  const i = state.income.find(x => x.id === id);
  if (!i) return;
  document.getElementById('incomeEditId').value = id;
  document.getElementById('incomeModalTitle').textContent = 'Edit Income';
  document.getElementById('incType').value = i.type;
  document.getElementById('incSource').value = i.source;
  document.getElementById('incAmount').value = i.amount;
  document.getElementById('incDate').value = i.date;
  document.getElementById('incNotes').value = i.notes || '';
  openModal('incomeModal');
}

function deleteIncome(id) {
  if (!confirm('Delete this income entry?')) return;
  state.income = state.income.filter(i => i.id !== id);
  saveData();
  renderAll();
}

document.getElementById('incomeForm').addEventListener('submit', function(ev) {
  ev.preventDefault();
  const id = document.getElementById('incomeEditId').value;
  const entry = {
    id: id || uid(),
    type: document.getElementById('incType').value,
    source: document.getElementById('incSource').value.trim(),
    amount: parseFloat(document.getElementById('incAmount').value),
    date: document.getElementById('incDate').value,
    notes: document.getElementById('incNotes').value.trim()
  };
  if (id) {
    const idx = state.income.findIndex(i => i.id === id);
    if (idx !== -1) state.income[idx] = entry;
  } else {
    state.income.push(entry);
  }
  saveData();
  closeModal('incomeModal');
  renderAll();
});

/* ===== TAB NAVIGATION ===== */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'yearly') renderYearly();
    if (btn.dataset.tab === 'dashboard') renderDashboard();
    if (btn.dataset.tab === 'stocks') {
      renderStocks();
      // Auto-refresh if no prices or last fetch was >10 min ago
      const now = Date.now();
      const stale = !stocksState.lastFetch || (now - stocksState.lastFetch) > 10 * 60 * 1000;
      if (stale && stocksState.holdings.length) {
        stocksState.lastFetch = now;
        refreshAllPrices(true);
      }
    }
  });
});

/* ===== MONTH NAVIGATION (header buttons) ===== */
document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

/* ===== YEAR SELECT ===== */
document.getElementById('yearSelect').addEventListener('change', function() {
  state.currentYear = parseInt(this.value);
  renderAll();
});

/* ===== FAB BUTTONS ===== */
document.getElementById('addExpenseBtn').addEventListener('click', openAddExpense);
document.getElementById('addIncomeBtn').addEventListener('click', openAddIncome);

/* ===== PWA INSTALL ===== */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').classList.remove('hidden');
});

document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner').classList.add('hidden');
});

/* ===== INIT ===== */
loadData();
loadStocks();
updateYearSelect();
renderAll();
renderStocks();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ===== STOCKS ===== */
let stocksState = {
  holdings: [],
  prices: {},      // { ticker: { price, change, changePct, currency, updatedAt } }
  lastFetch: null
};

function saveStocks() {
  localStorage.setItem('et_stocks', JSON.stringify(stocksState.holdings));
  localStorage.setItem('et_stock_prices', JSON.stringify(stocksState.prices));
}

function loadStocks() {
  try {
    stocksState.holdings = JSON.parse(localStorage.getItem('et_stocks') || '[]');
    stocksState.prices   = JSON.parse(localStorage.getItem('et_stock_prices') || '{}');
  } catch(e) {
    stocksState.holdings = [];
    stocksState.prices = {};
  }
}

/* Fetch price via Yahoo Finance through a CORS proxy */
async function fetchPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    return {
      price,
      change,
      changePct,
      currency: meta.currency || 'USD',
      updatedAt: new Date().toISOString()
    };
  } catch(e) {
    return null;
  }
}

async function refreshAllPrices(showSpinner = true) {
  if (!stocksState.holdings.length) return;

  const btn = document.getElementById('refreshPricesBtn');
  const note = document.getElementById('stocks-price-note');

  if (showSpinner && btn) btn.classList.add('spinning');
  if (note) note.textContent = 'Fetching live prices...';

  const tickers = [...new Set(stocksState.holdings.map(h => h.ticker.toUpperCase()))];

  await Promise.all(tickers.map(async ticker => {
    const result = await fetchPrice(ticker);
    if (result) stocksState.prices[ticker] = result;
  }));

  saveStocks();
  if (showSpinner && btn) btn.classList.remove('spinning');

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (note) note.textContent = `Prices updated at ${timeStr} · Delayed ~15 min`;

  renderStocks();
}

/* EUR/USD conversion — rough static rate, good enough for display */
const FX = { USD: 0.92, GBP: 1.17, EUR: 1 };

function toEur(amount, currency) {
  return amount * (FX[currency] || 1);
}

function fmtStock(n, currency) {
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return sym + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderStocks() {
  const list = document.getElementById('stocks-list');
  if (!list) return;

  if (!stocksState.holdings.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📈</div>
      <p>No holdings yet.<br>Tap + Add Holding to get started.</p>
    </div>`;
    document.getElementById('portfolio-total').textContent = '€0.00';
    document.getElementById('portfolio-gain').textContent = '+€0.00 (0.00%)';
    return;
  }

  let totalValue = 0, totalCost = 0;

  const cards = stocksState.holdings.map(h => {
    const ticker = h.ticker.toUpperCase();
    const priceData = stocksState.prices[ticker];
    const shares = Number(h.shares);
    const buyPrice = Number(h.buyPrice);
    const currency = h.currency || 'EUR';

    const costBasis = toEur(shares * buyPrice, currency);
    totalCost += costBasis;

    if (!priceData) {
      // No price yet — show loading
      return `
        <div class="stock-card">
          <div class="stock-top">
            <div class="stock-left">
              <div class="stock-ticker">${ticker}</div>
              <div class="stock-name">${h.name || ''}</div>
            </div>
            <div class="stock-loading">
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
              <div class="loading-dot"></div>
              <span>Loading price...</span>
            </div>
          </div>
          <div class="stock-bottom">
            <div class="stock-stat"><span class="stock-stat-label">Shares</span><span class="stock-stat-value">${shares}</span></div>
            <div class="stock-stat"><span class="stock-stat-label">Avg Buy</span><span class="stock-stat-value">${fmtStock(buyPrice, currency)}</span></div>
            <div class="stock-stat"><span class="stock-stat-label">Cost</span><span class="stock-stat-value">€${costBasis.toFixed(2)}</span></div>
          </div>
          <div class="stock-actions">
            <button class="btn-edit" onclick="editStock('${h.id}')">✏️ Edit</button>
            <button class="btn-delete" onclick="deleteStock('${h.id}')">🗑️ Delete</button>
          </div>
        </div>`;
    }

    const currentPrice = priceData.price;
    const currentValue = toEur(shares * currentPrice, priceData.currency);
    const gain = currentValue - costBasis;
    const gainPct = costBasis ? (gain / costBasis) * 100 : 0;
    const isPositive = gain >= 0;
    const dayChange = priceData.change;
    const dayChangePct = priceData.changePct;

    totalValue += currentValue;

    return `
      <div class="stock-card ${isPositive ? '' : 'negative'}">
        <div class="stock-top">
          <div class="stock-left">
            <div class="stock-ticker">${ticker}</div>
            <div class="stock-name">${h.name || priceData.currency}</div>
          </div>
          <div class="stock-right">
            <div class="stock-current-price">${fmtStock(currentPrice, priceData.currency)}</div>
            <div class="stock-price-change ${dayChange < 0 ? 'negative' : ''}">
              ${dayChange >= 0 ? '+' : ''}${fmtStock(dayChange, priceData.currency)} (${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%) today
            </div>
          </div>
        </div>
        <div class="stock-bottom">
          <div class="stock-stat">
            <span class="stock-stat-label">Shares</span>
            <span class="stock-stat-value">${shares}</span>
          </div>
          <div class="stock-stat">
            <span class="stock-stat-label">Value</span>
            <span class="stock-stat-value">€${currentValue.toFixed(2)}</span>
          </div>
          <div class="stock-stat">
            <span class="stock-stat-label">Gain/Loss</span>
            <span class="stock-stat-value stock-gain-value ${isPositive ? '' : 'negative'}">
              ${isPositive ? '+' : '-'}€${Math.abs(gain).toFixed(2)}<br>
              <span style="font-size:11px">${isPositive ? '+' : ''}${gainPct.toFixed(2)}%</span>
            </span>
          </div>
        </div>
        <div class="stock-actions">
          <button class="btn-edit" onclick="editStock('${h.id}')">✏️ Edit</button>
          <button class="btn-delete" onclick="deleteStock('${h.id}')">🗑️ Delete</button>
        </div>
      </div>`;
  });

  list.innerHTML = cards.join('');

  // Portfolio totals
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost ? (totalGain / totalCost) * 100 : 0;
  const isPos = totalGain >= 0;

  document.getElementById('portfolio-total').textContent = '€' + totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const gainEl = document.getElementById('portfolio-gain');
  gainEl.textContent = `${isPos ? '+' : '-'}€${Math.abs(totalGain).toFixed(2)} (${isPos ? '+' : ''}${totalGainPct.toFixed(2)}%) total return`;
  gainEl.className = 'portfolio-gain' + (isPos ? '' : ' negative');
}

/* Add / Edit stock */
function openAddStock() {
  document.getElementById('stockEditId').value = '';
  document.getElementById('stockModalTitle').textContent = 'Add Holding';
  document.getElementById('stockForm').reset();
  openModal('stockModal');
}

function editStock(id) {
  const h = stocksState.holdings.find(x => x.id === id);
  if (!h) return;
  document.getElementById('stockEditId').value = id;
  document.getElementById('stockModalTitle').textContent = 'Edit Holding';
  document.getElementById('stockTicker').value = h.ticker;
  document.getElementById('stockName').value = h.name || '';
  document.getElementById('stockShares').value = h.shares;
  document.getElementById('stockBuyPrice').value = h.buyPrice;
  document.getElementById('stockCurrency').value = h.currency || 'EUR';
  openModal('stockModal');
}

function deleteStock(id) {
  if (!confirm('Delete this holding?')) return;
  stocksState.holdings = stocksState.holdings.filter(h => h.id !== id);
  saveStocks();
  renderStocks();
}

document.getElementById('stockForm').addEventListener('submit', async function(ev) {
  ev.preventDefault();
  const id = document.getElementById('stockEditId').value;
  const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
  const entry = {
    id: id || uid(),
    ticker,
    name: document.getElementById('stockName').value.trim(),
    shares: parseFloat(document.getElementById('stockShares').value),
    buyPrice: parseFloat(document.getElementById('stockBuyPrice').value),
    currency: document.getElementById('stockCurrency').value
  };
  if (id) {
    const idx = stocksState.holdings.findIndex(h => h.id === id);
    if (idx !== -1) stocksState.holdings[idx] = entry;
  } else {
    stocksState.holdings.push(entry);
  }
  saveStocks();
  closeModal('stockModal');
  renderStocks();
  // Fetch price for the new/updated ticker
  const note = document.getElementById('stocks-price-note');
  if (note) note.textContent = `Fetching price for ${ticker}...`;
  const result = await fetchPrice(ticker);
  if (result) {
    stocksState.prices[ticker] = result;
    saveStocks();
    const now = new Date();
    note.textContent = `Prices updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Delayed ~15 min`;
  } else {
    if (note) note.textContent = `Could not fetch price for ${ticker}. Check the ticker symbol.`;
  }
  renderStocks();
});

document.getElementById('addStockBtn').addEventListener('click', openAddStock);
document.getElementById('refreshPricesBtn').addEventListener('click', () => refreshAllPrices(true));
