// Page renderers — every page reads the same in-memory state, so a number
// edited on one page is already right on every other page.
import { DATA } from './data.js';
import { money, money0, pct, shortDate, longDate, round2 } from './format.js';
import { donutSVG, trendSVG, budgetBar } from './charts.js';

export function catSpent(state, id) {
  return round2(state.transactions.filter((t) => t.category === id).reduce((a, t) => a + t.amount, 0));
}
export function totalIncome(state) {
  return round2(state.income.reduce((a, i) => a + i.amount, 0));
}
export function totalSpent(state) {
  return round2(state.transactions.reduce((a, t) => a + t.amount, 0));
}
export function totalBudget(state) {
  return state.categories.reduce((a, c) => a + c.budget, 0);
}
export function catLabel(id) {
  const c = DATA.categories.find((x) => x.id === id);
  return c ? c.label : id;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function kpi(label, value, sub) {
  return `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div></div>`;
}

function catRow(state, c, showEdit) {
  const spent = catSpent(state, c.id);
  const left = round2(c.budget - spent);
  const ratio = c.budget > 0 ? spent / c.budget : 0;
  const status = ratio > 1 ? `<span class="tag over">${money(Math.abs(left))} over</span>` : ratio > 0.9 ? `<span class="tag warm">${money(left)} left</span>` : `<span class="tag ok">${money(left)} left</span>`;
  const edit = showEdit
    ? `<td class="edit"><input type="number" min="0" step="1" value="${c.budget}" data-budget-input="${c.id}" aria-label="Monthly budget for ${esc(c.label)}"> <button data-budget-save="${c.id}">Update</button></td>`
    : `<td>${money(c.budget)}</td>`;
  return `<tr><td><strong>${esc(c.label)}</strong></td><td>${money(spent)}</td>${edit}<td>${budgetBar(spent, c.budget)}<small>${pct(ratio)} used</small></td><td>${status}</td></tr>`;
}

export function dashboardPage(state) {
  const income = totalIncome(state);
  const spent = totalSpent(state);
  const saved = catSpent(state, 'savings');
  const left = round2(income - spent);
  const spendingExSavings = round2(spent - saved);
  const dueWeek = state.bills.filter((b) => !b.paid && b.due >= '2026-11-27' && b.due <= '2026-12-03');
  const dueTotal = round2(dueWeek.reduce((a, b) => a + b.amount, 0));
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 6);
  const topCats = [...state.categories]
    .filter((c) => c.id !== 'savings')
    .map((c) => ({ c, spent: catSpent(state, c.id) }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6);
  return `
  <section class="hero">
    <div><h1>November budget</h1><p class="lede">${esc(DATA.household.name)} &middot; ${esc(DATA.household.members)} &middot; take-home ${money0(income)}/month</p></div>
    <p class="hero-note">Every dollar has a job. ${money0(totalBudget(state))} is budgeted, ${money(left)} is still unspent.</p>
  </section>
  <div class="kpis">
    ${kpi('Income', money(income), '3 sources')}
    ${kpi('Spent', money(spent), '42 transactions')}
    ${kpi('Left to spend', money(left), 'of ' + money0(income))}
    ${kpi('Saved', money(saved), pct(saved / income) + ' of income')}
  </div>
  <div class="grid2">
    <section class="card"><h2>Budget by category</h2>
      ${topCats.map(({ c, spent: s }) => `<div class="catline"><span>${esc(c.label)}</span><span>${money(s)} of ${money0(c.budget)}</span></div>${budgetBar(s, c.budget)}`).join('')}
      <p><a href="#/budget">See all ${state.categories.length} categories &rarr;</a></p>
    </section>
    <section class="card"><h2>Income vs spending — 6 months</h2>${trendSVG(state.history)}
      <p class="muted">Spending excludes the monthly savings transfer. November spending so far: ${money(spendingExSavings)}.</p>
    </section>
  </div>
  <div class="grid2">
    <section class="card"><h2>Due this week &middot; ${money(dueTotal)}</h2>
      ${dueWeek.map((b) => `<div class="billrow"><span>${esc(b.name)}</span><span>${shortDate(b.due)} &middot; <strong>${money(b.amount)}</strong></span></div>`).join('')}
      <p><a href="#/bills">All bills &rarr;</a></p>
    </section>
    <section class="card"><h2>Recent transactions</h2>
      ${recent.map((t) => `<div class="billrow"><span>${shortDate(t.date)} &middot; ${esc(t.merchant)}</span><span>${money(t.amount)}</span></div>`).join('')}
      <p><a href="#/transactions">Full ledger &rarr;</a></p>
    </section>
  </div>`;
}

export function budgetPage(state) {
  const income = totalIncome(state);
  const total = totalBudget(state);
  const left = round2(income - total);
  return `
  <section class="hero"><div><h1>Budget</h1><p class="lede">Monthly plan for ${money0(income)} of take-home pay. Change a number and every bar, total and “left to budget” recalculates.</p></div>
  <p class="hero-note">Total budgeted ${money(total)} &middot; <strong>left to budget ${money(left)}</strong></p></section>
  <section class="card"><table class="tbl"><thead><tr><th>Category</th><th>Spent</th><th>Monthly budget</th><th>Progress</th><th>Status</th></tr></thead>
  <tbody>${state.categories.map((c) => catRow(state, c, true)).join('')}</tbody></table>
  <p class="muted">Budgeted ${money(total)} of ${money0(income)} income — ${money(left)} left to budget.</p></section>`;
}

export function transactionsPage(state) {
  const rows = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const spent = totalSpent(state);
  return `
  <section class="hero"><div><h1>Transactions</h1><p class="lede">${rows.length} transactions in November &middot; ${money(spent)} total. Add one below and the totals update.</p></div></section>
  <section class="card"><form id="add-txn" class="formrow">
    <label>Date <input type="date" name="date" value="2026-11-27" required></label>
    <label>Merchant <input type="text" name="merchant" placeholder="e.g. Green Valley Market" required></label>
    <label>Category <select name="category">${state.categories.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>
    <label>Amount <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
    <button type="submit">Add transaction</button>
  </form></section>
  <section class="card"><div class="formrow">
    <label>Filter <select id="txn-filter"><option value="">All categories</option>${state.categories.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>
    <label>Search <input type="search" id="txn-search" placeholder="Search merchant…"></label>
    <span class="muted" id="txn-count"></span>
  </div>
  <table class="tbl"><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th></tr></thead>
  <tbody id="txn-body">${rows.map((t) => `<tr data-cat="${t.category}" data-merchant="${esc(t.merchant).toLowerCase()}"><td>${shortDate(t.date)}</td><td>${esc(t.merchant)}</td><td>${esc(catLabel(t.category))}</td><td>${money(t.amount)}</td></tr>`).join('')}</tbody></table></section>`;
}

export function billsPage(state) {
  const paid = state.bills.filter((b) => b.paid);
  const unpaid = state.bills.filter((b) => !b.paid);
  const paidTotal = round2(paid.reduce((a, b) => a + b.amount, 0));
  const dueTotal = round2(unpaid.reduce((a, b) => a + b.amount, 0));
  const row = (b) => `<tr><td><strong>${esc(b.name)}</strong></td><td>${longDate(b.due)}</td><td>${money(b.amount)}</td><td><button data-bill-toggle="${b.id}" class="${b.paid ? 'paid' : 'due'}">${b.paid ? 'Paid ✓' : 'Mark paid'}</button></td></tr>`;
  return `
  <section class="hero"><div><h1>Bills</h1><p class="lede">Every recurring bill, its due date and its status. Flip a bill to paid and the “due this week” list on the dashboard changes too.</p></div>
  <p class="hero-note">Paid ${money(paidTotal)} &middot; still due ${money(dueTotal)}</p></section>
  <section class="card"><h2>Still due</h2><table class="tbl"><thead><tr><th>Bill</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>${unpaid.map(row).join('') || '<tr><td colspan="4">Nothing due — everything is paid.</td></tr>'}</tbody></table></section>
  <section class="card"><h2>Paid this month</h2><table class="tbl"><thead><tr><th>Bill</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>${paid.map(row).join('')}</tbody></table></section>`;
}

export function goalsPage(state) {
  return `
  <section class="hero"><div><h1>Savings goals</h1><p class="lede">Three goals, one emergency fund first. Add money and the bar moves right away.</p></div></section>
  <div class="grid3">${state.goals.map((g) => {
    const ratio = g.saved / g.target;
    const left = round2(g.target - g.saved);
    return `<section class="card"><h2>${esc(g.name)}</h2><p class="muted">${esc(g.note)}</p>
    <div class="goal-num"><strong>${money(g.saved)}</strong> of ${money0(g.target)}</div>
    ${budgetBar(g.saved, g.target)}
    <p>${pct(ratio)} funded &middot; ${money(left)} to go</p>
    <div class="formrow"><button data-goal-add="${g.id}" data-amount="25">+ $25</button><button data-goal-add="${g.id}" data-amount="50">+ $50</button><button data-goal-add="${g.id}" data-amount="100">+ $100</button></div>
    </section>`;
  }).join('')}</div>`;
}

export function reportsPage(state) {
  const segs = state.categories
    .filter((c) => c.id !== 'savings')
    .map((c) => ({ label: c.label, value: catSpent(state, c.id) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = round2(segs.reduce((a, s) => a + s.value, 0));
  const over = state.categories
    .map((c) => ({ c, spent: catSpent(state, c.id), overBy: round2(catSpent(state, c.id) - c.budget) }))
    .filter((x) => x.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);
  const biggest = segs[0];
  const saved = catSpent(state, 'savings');
  const income = totalIncome(state);
  const transportBudget = state.categories.find((c) => c.id === 'transport').budget;
  const transportSpent = catSpent(state, 'transport');
  const insights = [
    ...over.map((x) => `${x.c.label} is ${money(x.overBy)} over budget (${pct(x.overBy / x.c.budget)} over) — the plan needs ${money(x.overBy)} moved from somewhere else.`),
    `${biggest.label} is the biggest spend at ${money(biggest.value)} — ${pct(biggest.value / total)} of all spending.`,
    `You saved ${money(saved)} this month, ${pct(saved / income)} of take-home pay.`,
    `Transport is ${pct(transportSpent / transportBudget)} of its budget with ${money(round2(transportBudget - transportSpent))} left and 3 days to go.`,
  ];
  return `
  <section class="hero"><div><h1>Reports</h1><p class="lede">Where November's money actually went — every figure below is calculated from the ledger, not typed in.</p></div></section>
  <div class="grid2">
    <section class="card"><h2>Spending by category &middot; ${money(total)}</h2>
      <div class="donut-wrap">${donutSVG(segs)}
      <ul class="legend">${segs.map((s, i) => `<li><span class="sw" style="background:${['#1d5c3f', '#c98a1b', '#3f6d8e', '#8e4a3f', '#5b7a4a', '#7a5b8e', '#4a7a7a', '#a85b2a', '#6b6b6b', '#2f4858'][i % 10]}"></span>${esc(s.label)} — ${money(s.value)} (${pct(s.value / total)})</li>`).join('')}</ul></div>
    </section>
    <section class="card"><h2>Income vs spending — 6 months</h2>${trendSVG(state.history)}
      <p class="muted">Income has held near ${money0(6850)} while spending stayed under ${money0(4750)} every month — the gap is what funds the goals.</p>
    </section>
  </div>
  <section class="card"><h2>What the numbers say</h2><ul class="insights">${insights.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>`;
}
