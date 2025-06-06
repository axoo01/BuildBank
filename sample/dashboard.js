// Mock data and state
let houseValue = null;
let totalExpenses = 30000;
const mockUserId = 1;
const mockOwnerId = 1;
const expenses = [/* mock expense data */];

// DOM elements
const initialValueCard = document.getElementById('initialValueCard');
const budgetCard = document.getElementById('budgetCard');
const houseValueInput = document.getElementById('houseValueInput');
const setValueBtn = document.getElementById('setValueBtn');
const remainingValue = document.getElementById('remainingValue');
const progressBar = document.getElementById('progressBar');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const totalExpensesDisplay = document.getElementById('totalExpenses');
const totalRecordsDisplay = document.getElementById('totalRecords');
const latestEntryDisplay = document.getElementById('latestEntry');
const settingsTab = document.getElementById('settingsTab');
const topUpInput = document.getElementById('topUpInput');
const topUpBtn = document.getElementById('topUpBtn');
const deleteProjectBtn = document.getElementById('deleteProjectBtn');
const logoutBtn = document.querySelector('.logout-btn');
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');

// Mock Supabase RPC
const mockFetchExpenses = () => Promise.resolve({ data: { total: totalExpenses }, error: null });
const mockRpc = (fn) => {
    if (fn === 'calculate_remaining') return Promise.resolve({ data: { remaining: houseValue - totalExpenses }, error: null });
    return Promise.resolve({ data: null, error: null });
};

// Initial setup
function initDashboard() {
    if (!initialValueCard || !budgetCard || !settingsTab || !logoutBtn || !hamburger || !sidebar) {
        console.error('One or more DOM elements are missing:', {
            initialValueCard, budgetCard, settingsTab, logoutBtn, hamburger, sidebar
        });
        return;
    }

    // Debug: Confirm hamburger properties and event listener
    console.log('Hamburger element:', hamburger);
    if (hamburger) {
        const style = window.getComputedStyle(hamburger);
        console.log('Hamburger computed styles:', {
            display: style.display,
            width: style.width,
            height: style.height,
            offsetLeft: hamburger.offsetLeft,
            offsetTop: hamburger.offsetTop,
            offsetWidth: hamburger.offsetWidth,
            offsetHeight: hamburger.offsetHeight
        });
        hamburger.addEventListener('click', () => {
            console.log('Hamburger click event fired');
            sidebar.classList.toggle('active');
        }, { capture: true });
    }

    if (!houseValue) {
        initialValueCard.style.display = 'block';
    } else {
        updateBudgetCard();
        budgetCard.style.display = 'block';
    }
    updateOverviewCards();
    setupChart();
    setupSettings();

    // Logout button
    logoutBtn.addEventListener('click', () => {
        console.log('Logged out');
    });
}

function updateBudgetCard() {
    const remaining = houseValue ? houseValue - totalExpenses : 0;
    animateNumber(remainingValue, remaining);
    updateProgressBar(remaining / houseValue * 100);
}

function animateNumber(element, target) {
    let start = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000;
    const range = target - start;
    let startTimestamp = null;

    function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(start + range * progress);
        element.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        updateColor(current / houseValue * 100);
    }
    requestAnimationFrame(step);
}

function updateProgressBar(percentage) {
    progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
}

function updateColor(percentage) {
    if (percentage > 50) remainingValue.style.color = '#2A9D8F';
    else if (percentage > 20) remainingValue.style.color = '#FF6B6B';
    else remainingValue.style.color = '#E63946';
}

function updateOverviewCards() {
    animateNumber(totalExpensesDisplay, totalExpenses);
    animateNumber(totalRecordsDisplay, expenses.length);
    latestEntryDisplay.textContent = 'May 29, 2025';
}

function setupChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Spending',
                data: [5000, 8000, 6000, 7000, 30000],
                backgroundColor: '#00C4CC',
                borderColor: '#05dde4',
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function setupSettings() {
    settingsTab.style.display = mockUserId === mockOwnerId ? 'block' : 'none';
    topUpBtn.addEventListener('click', () => {
        const topUp = parseInt(topUpInput.value) || 0;
        if (houseValue && topUp > 0) {
            houseValue += topUp;
            updateBudgetCard();
            console.log(`Topped up by ${topUp}`);
        }
    });
    deleteProjectBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this project?')) {
            console.log('Project deleted');
        }
    });
}

setValueBtn.addEventListener('click', () => {
    const value = parseInt(houseValueInput.value) || 0;
    if (value > 0) {
        houseValue = value;
        initialValueCard.style.display = 'none';
        budgetCard.style.display = 'block';
        updateBudgetCard();
    }
});

addExpenseBtn.addEventListener('click', async () => {
    totalExpenses += 5000;
    updateBudgetCard();
    updateOverviewCards();
    await mockFetchExpenses(); // Mock update
});

// Sidebar menu click handler
const sidebarMenu = document.querySelector('.sidebar-menu');
if (sidebarMenu) {
    sidebarMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            console.log('Menu item clicked:', menuItem.textContent);
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            menuItem.classList.add('active');
            if (menuItem.textContent.includes('Settings')) {
                settingsTab.style.display = mockUserId === mockOwnerId ? 'block' : 'none';
            } else {
                settingsTab.style.display = 'none';
            }
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            if (isMobile) {
                console.log('Closing sidebar on mobile');
                sidebar.classList.remove('active');
            }
        }
    });
} else {
    console.error('Sidebar menu not found');
}

initDashboard();