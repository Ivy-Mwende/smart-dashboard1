const apiBase = (window.__API_BASE__ || "https://smart-dashboard1.up.railway.app").replace(/\/$/, "");
const authForm = document.getElementById("auth-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const accountsList = document.getElementById("accounts-list");
const transactionsList = document.getElementById("transactions-list");
const insightsList = document.getElementById("insights-list");

let token = localStorage.getItem("token") || "";

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  return response;
}

async function loginOrRegister(isRegister) {
  const payload = {
    name: nameInput.value,
    email: emailInput.value,
    password: passwordInput.value,
  };
  if (!isRegister) delete payload.name;

  const response = await request(`/api/${isRegister ? "register" : "login"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.access_token) {
    token = data.access_token;
    localStorage.setItem("token", token);
    loadDashboard();
  }
}

async function loadDashboard() {
  const [accountsRes, transactionsRes, insightsRes] = await Promise.all([
    request("/api/accounts"),
    request("/api/transactions"),
    request("/api/insights"),
  ]);

  const accounts = await accountsRes.json();
  const transactions = await transactionsRes.json();
  const insights = await insightsRes.json();

  accountsList.innerHTML = accounts.map((a) => `<li>${a.account_type}: $${a.balance}</li>`).join("");
  transactionsList.innerHTML = transactions.map((t) => `<li>${t.description}: $${t.amount}</li>`).join("");
  insightsList.innerHTML = insights.map((i) => `<li>${i.prediction}</li>`).join("");

  renderChart(transactions);
}

function renderChart(transactions) {
  const data = transactions.slice(0, 5).map((t) => t.amount);
  const labels = transactions.slice(0, 5).map((t) => t.description);
  const ctx = document.getElementById("spending-chart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: ["#c8a2c8", "#7f5af0", "#4cc9f0", "#f72585", "#2ec4b6"] }],
    },
  });
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginOrRegister(true);
});

if (token) loadDashboard();
