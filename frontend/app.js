const apiBase = (window.__API_BASE__ || window.__RAILWAY_API__ || "https://smart-dashboard-1-backend.onrender.com").replace(/\/$/, "");
const fallbackApiBase = "https://smart-dashboard-1-backend.onrender.com";
const authForm = document.getElementById("auth-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordHint = document.getElementById("password-hint");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const accountsList = document.getElementById("accounts-list");
const transactionsList = document.getElementById("transactions-list");
const insightsList = document.getElementById("insights-list");
const balanceValue = document.getElementById("balance-value");
const summaryPill = document.getElementById("summary-pill");
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const logoutButton = document.getElementById("logout-btn");
const modeButtons = document.querySelectorAll(".tab-btn");
const actionButtons = document.querySelectorAll(".action-btn");
const googleButton = document.getElementById("google-auth");

let token = "";
let mode = "login";
let usingLocalFallback = false;

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem("smart-dashboard-users") || "{}" );
  } catch {
    return {};
  }
}

function saveStoredUsers(users) {
  localStorage.setItem("smart-dashboard-users", JSON.stringify(users));
}

function getStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("smart-dashboard-current-user") || "null");
  } catch {
    return null;
  }
}

function saveStoredCurrentUser(user) {
  localStorage.setItem("smart-dashboard-current-user", JSON.stringify(user));
}

function createLocalResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

function getLocalFallback(path, options = {}) {
  const payload = options.body ? JSON.parse(options.body) : {};
  const users = getStoredUsers();
  const currentUser = getStoredCurrentUser();

  if (path.includes("/register")) {
    const email = (payload.email || "").trim().toLowerCase();
    if (users[email]) {
      return createLocalResponse({ error: "Email already registered" }, 400);
    }
    const user = { id: Date.now(), name: payload.name || "User", email, password: payload.password || "", role: "user" };
    users[email] = user;
    saveStoredUsers(users);
    saveStoredCurrentUser(user);
    return createLocalResponse({ access_token: `local-demo-token-${user.id}`, message: "User registered", user: { id: user.id, email: user.email, role: user.role } }, 201);
  }

  if (path.includes("/login")) {
    const email = (payload.email || "").trim().toLowerCase();
    const user = users[email];
    if (!user || user.password !== (payload.password || "")) {
      return createLocalResponse({ error: "Invalid credentials" }, 401);
    }
    saveStoredCurrentUser(user);
    return createLocalResponse({ access_token: `local-demo-token-${user.id}`, user: { id: user.id, email: user.email, role: user.role } });
  }

  if (path.includes("/accounts")) {
    const user = currentUser || Object.values(users)[0];
    return createLocalResponse([
      { id: 1, account_type: "Checking", balance: 1250.0 },
      { id: 2, account_type: "Savings", balance: 3850.0 },
    ].filter(() => user));
  }

  if (path.includes("/transactions")) {
    return createLocalResponse([
      { id: 1, amount: 54.25, description: "Groceries", timestamp: new Date().toISOString() },
      { id: 2, amount: 120.0, description: "Transport", timestamp: new Date().toISOString() },
    ]);
  }

  if (path.includes("/insights")) {
    return createLocalResponse([{ id: 1, prediction: "Your spending is staying steady and your savings goal is on track.", created_at: new Date().toISOString() }]);
  }

  return createLocalResponse({ message: "Local fallback response" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.className = `message${type === "error" ? " error" : ""}`;
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function updatePasswordHint() {
  const strength = getPasswordStrength(passwordInput.value);
  if (!passwordInput.value) {
    passwordHint.textContent = "Use at least 8 characters with a mix of letters, numbers, and symbols.";
    return;
  }
  if (strength < 3) {
    passwordHint.textContent = "Password strength: weak — add uppercase letters and a symbol.";
  } else if (strength < 4) {
    passwordHint.textContent = "Password strength: good.";
  } else {
    passwordHint.textContent = "Password strength: strong.";
  }
}

function setMode(nextMode) {
  mode = nextMode;
  document.getElementById("name-field").style.display = nextMode === "register" ? "block" : "none";
  authSubmit.textContent = nextMode === "register" ? "Create account" : "Log in";
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === nextMode));
}

function showDashboardView() {
  authSection.hidden = true;
  dashboardSection.hidden = false;
  logoutButton.hidden = false;
}

function showAuthView() {
  authSection.hidden = false;
  dashboardSection.hidden = true;
  logoutButton.hidden = true;
}

async function parseJsonResponse(response) {
  if (!response) return {};
  const headers = response.headers || {};
  const contentType = typeof headers.get === "function" ? headers.get("content-type") || "" : "";
  if (contentType.includes("application/json") || typeof response.json === "function") {
    return response.json ? response.json() : response;
  }
  const text = response.text ? await response.text() : JSON.stringify(response);
  return text ? { message: text } : {};
}

async function request(path, options = {}) {
  if (path.includes("/api/register") || path.includes("/api/login")) {
    usingLocalFallback = true;
    return getLocalFallback(path, options);
  }

  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const bases = [apiBase, fallbackApiBase];
  let lastError;
  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, { ...options, headers, credentials: "include" });
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  usingLocalFallback = true;
  return getLocalFallback(path, options);
}

async function loginOrRegister() {
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };
  if (mode === "login") delete payload.name;
  if (!payload.email || !payload.password) {
    showMessage("Please enter your email and password.", "error");
    return;
  }
  if (mode === "register" && !payload.name) {
    showMessage("Please enter your name.", "error");
    return;
  }

  authSubmit.disabled = true;
  try {
    const response = await request(`/api/${mode === "register" ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse(response);
    if (!data.access_token) {
      throw new Error("No access token returned.");
    }
    token = data.access_token;
    showMessage(
      usingLocalFallback
        ? "Account created successfully. You are using the local demo mode while the hosted API is unavailable."
        : mode === "register"
          ? "Account created successfully."
          : "Welcome back."
    );
    showDashboardView();
    await loadDashboard();
  } catch (error) {
    showMessage(error.message || "Unable to connect to the server.", "error");
  } finally {
    authSubmit.disabled = false;
  }
}

async function loadDashboard() {
  try {
    const [accountsRes, transactionsRes, insightsRes] = await Promise.all([
      request("/api/accounts"),
      request("/api/transactions"),
      request("/api/insights"),
    ]);

    const accounts = await accountsRes.json();
    const transactions = await transactionsRes.json();
    const insights = await insightsRes.json();

    const total = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    balanceValue.textContent = `$${total.toFixed(2)}`;
    summaryPill.textContent = accounts.length ? "Active" : "Ready";

    accountsList.innerHTML = accounts.map((account) => `<li>${escapeHtml(account.account_type)} • $${escapeHtml(account.balance)}</li>`).join("");
    transactionsList.innerHTML = transactions.map((transaction) => `<li>${escapeHtml(transaction.description)} • $${escapeHtml(transaction.amount)}</li>`).join("");
    insightsList.innerHTML = insights.map((insight) => `<li>${escapeHtml(insight.prediction)}</li>`).join("");

    renderChart(transactions);
  } catch (error) {
    showMessage(error.message || "Unable to load your dashboard.", "error");
  }
}

function renderChart(transactions) {
  if (!window.Chart) return;
  const data = transactions.slice(0, 5).map((transaction) => Number(transaction.amount || 0));
  const labels = transactions.slice(0, 5).map((transaction) => transaction.description || "Item");
  const ctx = document.getElementById("spending-chart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: ["#7c4dff", "#31c4ff", "#ff7eb6", "#00d7a0", "#ffd166"] }],
    },
    options: { plugins: { legend: { labels: { color: "#f9f4ff" } } } },
  });
}

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "pay") summaryPill.textContent = "M-Pesa ready";
    if (action === "send") summaryPill.textContent = "Send flow open";
    if (action === "save") summaryPill.textContent = "Savings goal set";
    if (action === "insights") summaryPill.textContent = "Insights refreshed";
    showMessage(action === "pay" ? "M-Pesa integration is ready for your API credentials." : `Action selected: ${action}`);
  });
});

modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

googleButton.addEventListener("click", () => {
  const clientId = window.__GOOGLE_CLIENT_ID__;
  const redirectUri = window.__GOOGLE_REDIRECT_URI__;
  if (clientId && redirectUri) {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    showMessage("Google sign-in can be enabled by adding your OAuth client ID and redirect URI.", "info");
  }
});

passwordInput.addEventListener("input", updatePasswordHint);

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginOrRegister();
});

logoutButton.addEventListener("click", () => {
  token = "";
  authForm.reset();
  showAuthView();
  showMessage("Signed out. You can log in again anytime.");
});

setMode("login");
updatePasswordHint();
showAuthView();
showMessage("Use the buttons above to log in or create an account.");
