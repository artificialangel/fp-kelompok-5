/* ======================
   GLOBAL VARIABLES
====================== */
let transactions = [];
let chart = null;
let selectedIndex = null;
let isLoggedIn = false;

/* ======================
   PAGE CONTROL
====================== */
function showPage(id) {
  // Block navigation if not logged in
  if (!isLoggedIn && id !== 'loginPage') return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');

  if (id === 'history') renderHistory();
  if (id === 'main') updateSummary();
}

/* ======================
   FLATPICKR INIT
====================== */
document.addEventListener('DOMContentLoaded', () => {
  flatpickr("#filterDate", {
    mode: "range",
    dateFormat: "Y-m-d"
  });
});

/* ======================
   LOGIN & SIGNUP
====================== */
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const easyLoginText = document.getElementById('easyLoginText');
  const loginPage = document.getElementById('loginPage');
  const mainHeader = document.getElementById('mainHeader');

  // Normal Login
  loginBtn.addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
      alert('Username (WAJIB) dan Password (WAJIB) harus diisi!');
      return;
    }

    // SUCCESS LOGIN
    isLoggedIn = true;
    loginPage.style.display = 'none';
    mainHeader.style.display = 'flex';
    showPage('main');
  });

  // Easy Login text
  easyLoginText.addEventListener('click', () => {
    alert('Isi Username dan Password lalu tekan Login');
  });

  // Toggle to Signup
  document.getElementById('toSignup').addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#loginPage .card').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
  });

  // Toggle to Login
  document.getElementById('toLogin').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('signupCard').style.display = 'none';
    document.querySelector('#loginPage .card').style.display = 'block';
  });

  // Easy Sign-Up
  document.getElementById('easySignUpBtn').addEventListener('click', () => {
    const user = document.getElementById('signupUsername').value.trim();
    if (!user) { alert("Please enter username"); return; }
    alert("Account created for " + user);
    document.getElementById('signupCard').style.display = 'none';
    document.querySelector('#loginPage .card').style.display = 'block';
  });

/* ======================
   TRANSACTIONS
====================== */
function saveTransaction() {
  const t = {
    amount: Number(amount.value),
    type: type.value,
    date: date.value,
    category: category.value
  };

  if (!t.amount || !t.date) return;

  if (selectedIndex !== null) {
    transactions[selectedIndex] = t;
  } else {
    transactions.push(t);
  }

  clearForm();
  showPage('history');
}

function deleteTransaction() {
  if (selectedIndex !== null) {
    transactions.splice(selectedIndex, 1);
    clearForm();
    showPage('history');
  }
}

function clearForm() {
  amount.value = '';
  date.value = '';
  selectedIndex = null;
}

function renderHistory() {
  const search = searchInput.value.toLowerCase();
  const range = filterDate.value;
  const cat = filterCategory.value;

  let start = null, end = null;
  if (range.includes(" to ")) [start, end] = range.split(" to ");

  historyList.innerHTML = '';

  transactions
    .filter(t => {
      const matchSearch = search === '' || t.category.toLowerCase().includes(search);
      const matchCategory = cat === 'All' || t.category === cat;
      const matchDate = !start || (t.date >= start && t.date <= end);
      return matchSearch && matchCategory && matchDate;
    })
    .forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.textContent = `${t.category} - Rp ${t.amount} (${t.date})`;
      div.onclick = () => loadTransaction(i);
      historyList.appendChild(div);
    });
}

function loadTransaction(index) {
  const t = transactions[index];
  selectedIndex = index;

  amount.value = t.amount;
  type.value = t.type;
  date.value = t.date;
  category.value = t.category;

  showPage('add');
}

function updateSummary() {
  let income = 0, expense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });

  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const balanceEl = document.getElementById('balance');

  if (!incomeEl) return;

  incomeEl.textContent = 'Rp ' + income;
  expenseEl.textContent = 'Rp ' + expense;
  balanceEl.textContent = 'Rp ' + (income - expense);

  updateChart();
}

function updateChart() {
  const ctx = document.getElementById('chart');

  const map = {};
  transactions.forEach(t => {
    if (!map[t.date]) map[t.date] = { income: 0, expense: 0 };
    map[t.date][t.type] += t.amount;
  });

  const labels = Object.keys(map).sort();
  const incomeData = labels.map(d => map[d].income);
  const expenseData = labels.map(d => map[d].expense);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Pemasukan', data: incomeData, borderColor: '#22c55e', tension: 0.3 },
        { label: 'Pengeluaran', data: expenseData, borderColor: '#ef4444', tension: 0.3 }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

/* ======================
   FILTER INPUTS
====================== */
document.addEventListener('input', e => {
  if (['searchInput', 'filterDate', 'filterCategory'].includes(e.target.id)) {
    renderHistory();
  }
});

/* ======================
   GOOGLE SIGN IN
====================== */
window.handleLogin = function (response) {
  console.log("Google Login Success", response);

  // tandai login
  isLoggedIn = true;
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("loginMethod", "google");

  // sembunyikan login page
  const loginPage = document.getElementById('loginPage');
  const mainHeader = document.getElementById('mainHeader');

  if (loginPage) loginPage.style.display = 'none';
  if (mainHeader) mainHeader.style.display = 'flex';

  // masuk ke main page
  showPage('main');
};

/* ======================
   AUTO LOGIN CHECK
====================== */
window.addEventListener('load', () => {
  if (localStorage.getItem("isLoggedIn") === "true") {
    isLoggedIn = true;

    const loginPage = document.getElementById('loginPage');
    const mainHeader = document.getElementById('mainHeader');

    if (loginPage) loginPage.style.display = 'none';
    if (mainHeader) mainHeader.style.display = 'flex';

    showPage('main');
  }
});

