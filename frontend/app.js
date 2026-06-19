// Configuration
const API_BASE_URL = localStorage.getItem('apiUrl') || 'http://localhost:5000';
let authToken = localStorage.getItem('authToken') || null;
let expenseChart = null;
let summaryChart = null;

// Utility functions
function showMessage(elementId, message, isError = false) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${isError ? 'error' : 'success'}`;
    }
}

function clearMessage(elementId) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (authToken) {
        options.headers['Authorization'] = authToken;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Login and Registration
function setupAuthForms() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remove active class from all buttons and forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.form-container').forEach(form => {
                form.classList.remove('active');
            });

            // Add active class to clicked button and corresponding form
            button.classList.add('active');
            document.getElementById(`${tabName}Form`).classList.add('active');
        });
    });

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('loginMessage');

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await apiCall('/api/login', 'POST', { username, password });
            
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            
            showMessage('loginMessage', 'Login successful! Redirecting...', false);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showMessage('loginMessage', error.message, true);
        }
    });

    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('registerMessage');

        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        if (password !== passwordConfirm) {
            showMessage('registerMessage', 'Passwords do not match', true);
            return;
        }

        try {
            const response = await apiCall('/api/register', 'POST', { username, password });
            
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            
            showMessage('registerMessage', 'Registration successful! Redirecting...', false);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showMessage('registerMessage', error.message, true);
        }
    });
}

// Dashboard functions
function setupDashboard() {
    if (!authToken) {
        window.location.href = 'index.html';
        return;
    }

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('apiUrl');
        window.location.href = 'index.html';
    });

    // Income form
    document.getElementById('incomeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('incomeMessage');

        const source = document.getElementById('incomeSource').value.trim();
        const amount = parseFloat(document.getElementById('incomeAmount').value);

        try {
            await apiCall('/api/income', 'POST', { source, amount });
            showMessage('incomeMessage', 'Income added successfully!', false);
            document.getElementById('incomeForm').reset();
            await loadDashboard();
        } catch (error) {
            showMessage('incomeMessage', error.message, true);
        }
    });

    // Expense form
    document.getElementById('expenseForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage('expenseMessage');

        const name = document.getElementById('expenseName').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);

        try {
            await apiCall('/api/expenses', 'POST', { name, amount });
            showMessage('expenseMessage', 'Expense added successfully!', false);
            document.getElementById('expenseForm').reset();
            await loadDashboard();
        } catch (error) {
            showMessage('expenseMessage', error.message, true);
        }
    });

    loadDashboard();
}

async function loadDashboard() {
    try {
        const summary = await apiCall('/api/summary', 'GET');

        // Update summary cards
        document.getElementById('totalIncome').textContent = formatCurrency(summary.total_income);
        document.getElementById('totalExpenses').textContent = formatCurrency(summary.total_expenses);
        
        const balanceEl = document.getElementById('balance');
        balanceEl.textContent = formatCurrency(summary.balance);
        balanceEl.parentElement.className = summary.balance >= 0 ? 'summary-card balance-card' : 'summary-card balance-card danger';

        // Update charts
        updateCharts(summary);

        // Update transaction lists
        updateTransactionLists(summary);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateCharts(summary) {
    const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');
    const summaryCtx = document.getElementById('summaryChart')?.getContext('2d');

    if (!expenseCtx || !summaryCtx) return;

    // Expense pie chart
    if (expenseChart) {
        expenseChart.destroy();
    }

    const expenseLabels = summary.expenses.map(e => e.label);
    const expenseAmounts = summary.expenses.map(e => e.amount);
    const expenseColors = generateColors(expenseAmounts.length);

    expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: expenseLabels.length > 0 ? expenseLabels : ['No Data'],
            datasets: [{
                data: expenseAmounts.length > 0 ? expenseAmounts : [1],
                backgroundColor: expenseColors,
                borderColor: '#fff',
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });

    // Income vs Expenses bar chart
    if (summaryChart) {
        summaryChart.destroy();
    }

    summaryChart = new Chart(summaryCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses', 'Balance'],
            datasets: [{
                label: 'Amount ($)',
                data: [summary.total_income, summary.total_expenses, Math.max(0, summary.balance)],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(79, 70, 229, 0.7)',
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(79, 70, 229, 1)',
                ],
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

function generateColors(count) {
    const colors = [
        'rgba(79, 70, 229, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(139, 92, 246, 0.7)',
        'rgba(236, 72, 153, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(34, 197, 94, 0.7)',
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function updateTransactionLists(summary) {
    // Income list
    const incomeList = document.getElementById('incomeList');
    if (incomeList) {
        if (summary.income.length === 0) {
            incomeList.innerHTML = '<p class="empty-message">No income entries yet</p>';
        } else {
            incomeList.innerHTML = summary.income.map(item => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-label">${escapeHtml(item.label)}</div>
                        <div class="transaction-date">${formatDate(item.created_at)}</div>
                    </div>
                    <div class="transaction-amount">${formatCurrency(item.amount)}</div>
                    <button class="btn btn-danger" onclick="deleteIncome(${item.id})">Delete</button>
                </div>
            `).join('');
        }
    }

    // Expense list
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        if (summary.expenses.length === 0) {
            expenseList.innerHTML = '<p class="empty-message">No expenses yet</p>';
        } else {
            expenseList.innerHTML = summary.expenses.map(item => `
                <div class="transaction-item expense">
                    <div class="transaction-info">
                        <div class="transaction-label">${escapeHtml(item.label)}</div>
                        <div class="transaction-date">${formatDate(item.created_at)}</div>
                    </div>
                    <div class="transaction-amount expense">${formatCurrency(item.amount)}</div>
                    <button class="btn btn-danger" onclick="deleteExpense(${item.id})">Delete</button>
                </div>
            `).join('');
        }
    }
}

async function deleteIncome(id) {
    if (!confirm('Are you sure you want to delete this income entry?')) {
        return;
    }

    try {
        await apiCall(`/api/income/${id}`, 'DELETE');
        await loadDashboard();
    } catch (error) {
        alert('Error deleting income: ' + error.message);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        await apiCall(`/api/expenses/${id}`, 'DELETE');
        await loadDashboard();
    } catch (error) {
        alert('Error deleting expense: ' + error.message);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        setupDashboard();
    } else if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setupAuthForms();
    }
});
