// Routing and state — one in-memory copy of the data; every control edits
// the state and re-renders, so the numbers on every page always agree.
import { DATA } from './data.js';
import { dashboardPage, budgetPage, transactionsPage, billsPage, goalsPage, reportsPage } from './views.js';
import { money } from './format.js';

const state = {
  income: DATA.income.map((i) => ({ ...i })),
  categories: DATA.categories.map((c) => ({ ...c })),
  transactions: DATA.transactions.map((t) => ({ ...t })),
  bills: DATA.bills.map((b) => ({ ...b })),
  goals: DATA.goals.map((g) => ({ ...g })),
  history: DATA.history.map((h) => ({ ...h })),
};

const ROUTES = {
  '': dashboardPage,
  '#/': dashboardPage,
  '#/budget': budgetPage,
  '#/transactions': transactionsPage,
  '#/bills': billsPage,
  '#/goals': goalsPage,
  '#/reports': reportsPage,
};

const NAV = [
  ['#/', 'Dashboard'],
  ['#/budget', 'Budget'],
  ['#/transactions', 'Transactions'],
  ['#/bills', 'Bills'],
  ['#/goals', 'Goals'],
  ['#/reports', 'Reports'],
];

function render() {
  const route = location.hash || '#/';
  const page = ROUTES[route] || dashboardPage;
  const app = document.getElementById('app');
  app.innerHTML = page(state);
  document.querySelectorAll('nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === route || (route === '' && a.getAttribute('href') === '#/'));
  });
  wire(app);
  document.title = 'Alvarez Family Budget — ' + (NAV.find(([h]) => h === route)?.[1] || 'Dashboard');
  window.__shotReady = true;
}

function wire(app) {
  // Budget: update a category's monthly budget.
  app.querySelectorAll('[data-budget-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-budget-save');
      const input = app.querySelector(`[data-budget-input="${id}"]`);
      const value = Number(input.value);
      if (Number.isFinite(value) && value >= 0) {
        state.categories.find((c) => c.id === id).budget = Math.round(value);
        render();
      }
    });
  });
  // Bills: flip paid / unpaid.
  app.querySelectorAll('[data-bill-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bill = state.bills.find((b) => b.id === Number(btn.getAttribute('data-bill-toggle')));
      bill.paid = !bill.paid;
      render();
    });
  });
  // Goals: add funds.
  app.querySelectorAll('[data-goal-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goal = state.goals.find((g) => g.id === Number(btn.getAttribute('data-goal-add')));
      goal.saved = Math.min(goal.target, Math.round((goal.saved + Number(btn.getAttribute('data-amount'))) * 100) / 100);
      render();
    });
  });
  // Transactions: add a row, filter by category, search by merchant.
  const form = app.querySelector('#add-txn');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const amount = Number(fd.get('amount'));
      if (!fd.get('merchant') || !Number.isFinite(amount) || amount <= 0) return;
      state.transactions.push({
        id: Math.max(...state.transactions.map((t) => t.id)) + 1,
        date: fd.get('date') || '2026-11-27',
        merchant: String(fd.get('merchant')),
        category: String(fd.get('category')),
        amount: Math.round(amount * 100) / 100,
      });
      render();
      const note = document.getElementById('app').querySelector('.lede');
      if (note) note.textContent += ' — just added: ' + fd.get('merchant') + ' ' + money(amount) + '.';
    });
    const filter = app.querySelector('#txn-filter');
    const search = app.querySelector('#txn-search');
    const count = app.querySelector('#txn-count');
    const apply = () => {
      const cat = filter.value;
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      app.querySelectorAll('#txn-body tr').forEach((tr) => {
        const ok = (!cat || tr.getAttribute('data-cat') === cat) && (!q || tr.getAttribute('data-merchant').includes(q));
        tr.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      count.textContent = shown + ' shown';
    };
    filter.addEventListener('change', apply);
    search.addEventListener('input', apply);
    apply();
  }
}

window.addEventListener('hashchange', () => {
  window.__shotReady = false;
  render();
});

window.__shotReady = false;
document.getElementById('nav').innerHTML = NAV.map(([h, label]) => `<a href="${h}">${label}</a>`).join('');
render();
