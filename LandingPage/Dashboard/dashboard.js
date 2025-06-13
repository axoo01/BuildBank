import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/+esm';

const supabase = createClient('https://smcyqxylufjgkmumhonk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY3lxeHlsdWZqZ2ttdW1ob25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzUyNTgsImV4cCI6MjA2NDIxMTI1OH0.aRLFJCwe8WpMx1mXRmHWfnLH3XLi3af5Z1KeiJzAJNc');

let expenses = [];
let currentProject = null;
let monthlyChart;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    // DOM Elements
    const projectSetup = document.getElementById('projectSetup');
    const projectNameInput = document.getElementById('projectNameInput');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const joinCodeInput = document.getElementById('joinCodeInput');
    const joinProjectBtn = document.getElementById('joinProjectBtn');
    const budgetCard = document.getElementById('budgetCard');
    const budgetCardTitle = document.getElementById('budgetCardTitle');
    const remainingValue = document.getElementById('remainingValue');
    const expenseForm = document.getElementById('expenseForm');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseAmount = document.getElementById('expenseAmount');
    const expenseDescription = document.getElementById('expenseDescription');
    const transactionDate = document.getElementById('transactionDate');
    const budgetLatestSection = document.querySelector('.budget-latest-section');
    const expenseTotalSection = document.querySelector('.expense-total-section');
    const chartSection = document.querySelector('.chart-section');
    const totalRecordsCard = document.querySelector('#totalRecords').parentElement;
    const latestEntryCard = document.querySelector('#latestEntry').parentElement;
    const monthlyChartCard = document.querySelector('#monthlyChart').parentElement;
    const monthlyChartCanvas = document.getElementById('monthlyChart');
    const settingsTab = document.getElementById('settingsTab');
    const invitationCodeDisplay = document.getElementById('invitationCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const codeStatus = document.getElementById('codeStatus');
    const generateNewCodeBtn = document.getElementById('generateNewCodeBtn');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    const logoutBtn = document.querySelector('.logout-btn');
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const sidebarMenu = document.querySelector('.sidebar-menu');

    // Ensure user is authenticated and set session
    async function checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = '../index.html';
            return null;
        }
        await supabase.auth.setSession(session.access_token);
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    async function initDashboard() {
        const user = await checkAuth();

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

        if (userError) {
            const createError = document.getElementById('create-error');
            createError.textContent = 'Failed to fetch user details: ' + userError.message;
            createError.classList.add('active');
            return;
        }

        const welcomeMessage = document.querySelector('.welcome');
        if (welcomeMessage) {
            const name = userData.name || 'User';
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            welcomeMessage.textContent = `Welcome, ${capitalizedName}!`;
        }

        const { data: membershipData, error: membershipError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id);

        if (membershipError) {
            const createError = document.getElementById('create-error');
            createError.textContent = 'Failed to fetch membership details: ' + membershipError.message;
            createError.classList.add('active');
            return;
        }

        if (membershipData.length === 0) {
            projectSetup.style.display = 'block';
        } else {
            const projectId = membershipData[0].project_id;
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('id, name, house_value, invitation_code, invitation_code_expires_at')
                .eq('id', projectId)
                .single();
            if (projectError) {
                const createError = document.getElementById('create-error');
                createError.textContent = 'Failed to fetch project details: ' + projectError.message;
                createError.classList.add('active');
                return;
            }
            currentProject = projectData;
            projectSetup.style.display = 'none';
            budgetCard.style.display = 'block';
            expenseForm.style.display = 'block';
            budgetLatestSection.style.display = 'flex';
            expenseTotalSection.style.display = 'flex';
            chartSection.style.display = 'flex';
            latestEntryCard.style.display = 'block';
            totalRecordsCard.style.display = 'block';
            monthlyChartCard.style.display = 'block';
            budgetCardTitle.textContent = `${currentProject.name} Value`;
            await fetchExpenses(projectId);
            updateBudgetCard(currentProject.house_value || 0);
            updateOverviewCards();
            initializeChart();
            updateSettingsCode();

            if (window.location.hash === '#settings') {
                setupSettings();
                document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                const settingsItem = Array.from(document.querySelectorAll('.menu-item')).find(item => item.textContent.includes('Settings'));
                if (settingsItem) settingsItem.classList.add('active');
            }
        }
    }

    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', async () => {
            const projectName = projectNameInput.value.trim();
            const createError = document.getElementById('create-error');
            createError.classList.remove('active');
            if (!projectName) {
                createError.textContent = 'Please enter a project name.';
                createError.classList.add('active');
                return;
            }
            const newCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
            const newExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    name: projectName,
                    house_value: 0,
                    invitation_code: newCode,
                    invitation_code_expires_at: newExpiresAt
                })
                .select('id, name, house_value, invitation_code, invitation_code_expires_at')
                .single();
            if (error) {
                createError.textContent = 'Failed to create project: ' + error.message;
                createError.classList.add('active');
            } else {
                currentProject = data;
                const user = await checkAuth();
                const { error: membershipError } = await supabase.from('project_members').insert({
                    project_id: currentProject.id,
                    user_id: user.id,
                    role: 'admin'
                });
                if (membershipError) {
                    createError.textContent = 'Project created, but failed to add you as a member: ' + membershipError.message;
                    createError.classList.add('active');
                } else {
                    projectSetup.style.display = 'none';
                    budgetCard.style.display = 'block';
                    expenseForm.style.display = 'block';
                    budgetLatestSection.style.display = 'flex';
                    expenseTotalSection.style.display = 'flex';
                    chartSection.style.display = 'flex';
                    latestEntryCard.style.display = 'block';
                    totalRecordsCard.style.display = 'block';
                    monthlyChartCard.style.display = 'block';
                    budgetCardTitle.textContent = `${currentProject.name} Value`;
                    await fetchExpenses(currentProject.id);
                    updateBudgetCard(currentProject.house_value || 0);
                    updateOverviewCards();
                    initializeChart();
                    updateSettingsCode();
                }
            }
        });
    }

    if (joinProjectBtn) {
        joinProjectBtn.addEventListener('click', async () => {
            const joinCode = joinCodeInput.value.trim();
            const joinError = document.getElementById('join-error');
            joinError.classList.remove('active');
            if (!joinCode) {
                joinError.textContent = 'Please enter an invitation code.';
                joinError.classList.add('active');
                return;
            }
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('id, name, house_value, invitation_code, invitation_code_expires_at')
                .eq('invitation_code', joinCode)
                .maybeSingle();
            if (projectError) {
                joinError.textContent = 'Failed to fetch project: ' + projectError.message;
                joinError.classList.add('active');
                return;
            }
            if (!projectData) {
                joinError.textContent = 'Invalid invitation code.';
                joinError.classList.add('active');
                return;
            }
            if (new Date(projectData.invitation_code_expires_at) < new Date()) {
                joinError.textContent = 'Invitation code has expired.';
                joinError.classList.add('active');
                return;
            }
            const user = await checkAuth();
            const { error } = await supabase.from('project_members').insert({
                project_id: projectData.id,
                user_id: user.id,
                role: 'member'
            });
            if (error) {
                joinError.textContent = 'Failed to join project: ' + error.message;
                joinError.classList.add('active');
            } else {
                currentProject = projectData;
                projectSetup.style.display = 'none';
                budgetCard.style.display = 'block';
                expenseForm.style.display = 'block';
                budgetLatestSection.style.display = 'flex';
                expenseTotalSection.style.display = 'flex';
                chartSection.style.display = 'flex';
                latestEntryCard.style.display = 'block';
                totalRecordsCard.style.display = 'block';
                monthlyChartCard.style.display = 'block';
                budgetCardTitle.textContent = `${currentProject.name} Value`;
                await fetchExpenses(currentProject.id);
                updateBudgetCard(currentProject.house_value || 0);
                updateOverviewCards();
                initializeChart();
                updateSettingsCode();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const logoutError = document.getElementById('logout-error');
            logoutError.classList.remove('active');
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    logoutError.textContent = 'Logout error: ' + error.message;
                    logoutError.classList.add('active');
                } else {
                    window.location.replace('../index.html');
                }
            } catch (err) {
                logoutError.textContent = 'Unexpected error during sign out: ' + err.message;
                logoutError.classList.add('active');
            }
        });
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        }, { capture: true });
    }

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', async () => {
            const amount = parseInt(expenseAmount.value) || 0;
            const description = expenseDescription.value || `Expense on ${new Date().toISOString()}`;
            const transactionDate = document.getElementById('transactionDate').value;
            const defaultDate = '2025-06-04';
            const expenseError = document.getElementById('expense-error');
            expenseError.classList.remove('active');
            if (amount <= 0) {
                expenseError.textContent = 'Please enter a valid amount.';
                expenseError.classList.add('active');
                return;
            }
            if (!transactionDate || transactionDate === defaultDate) {
                expenseError.textContent = 'Please select a transaction date (different from the default).';
                expenseError.classList.add('active');
                return;
            }
            if (!currentProject) {
                expenseError.textContent = 'Please create or join a project first.';
                expenseError.classList.add('active');
                return;
            }
            const user = await checkAuth();

            const date = new Date(transactionDate);
            const year = date.getFullYear().toString().slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;

            const { data: sameDayExpenses, error: countError } = await supabase
                .from('expenses')
                .select('requisition_id')
                .eq('project_id', currentProject.id)
                .eq('transaction_date', transactionDate);
            if (countError) {
                expenseError.textContent = 'Failed to generate requisition ID: ' + countError.message;
                expenseError.classList.add('active');
                return;
            }
            const count = sameDayExpenses.length + 1;
            const sequence = String(count).padStart(3, '0');
            const requisitionId = `REQ-${dateStr}-${sequence}`;

            const newHouseValue = (currentProject.house_value || 0) + amount;
            const { error } = await supabase.from('expenses').insert({
                requisition_id: requisitionId,
                project_id: currentProject.id,
                user_id: user.id,
                amount: amount,
                description: description,
                transaction_date: transactionDate
            });
            if (error) {
                expenseError.textContent = 'Failed to add expense: ' + error.message;
                expenseError.classList.add('active');
            } else {
                const { error: updateError } = await supabase
                    .from('projects')
                    .update({ house_value: newHouseValue })
                    .eq('id', currentProject.id);
                if (updateError) {
                    expenseError.textContent = 'Failed to update project value: ' + updateError.message;
                    expenseError.classList.add('active');
                } else {
                    currentProject.house_value = newHouseValue;
                    await fetchExpenses(currentProject.id);
                    updateBudgetCard(currentProject.house_value);
                    updateOverviewCards();
                    initializeChart();
                    expenseAmount.value = '';
                    expenseDescription.value = '';
                    transactionDate.value = '2025-06-04';
                }
            }
        });
    }

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
                menuItem.classList.add('active');
                if (menuItem.textContent.includes('Settings')) {
                    setupSettings();
                } else {
                    settingsTab.style.display = 'none';
                    if (menuItem.textContent.includes('Dashboard')) {
                        budgetLatestSection.style.display = 'flex';
                        expenseTotalSection.style.display = 'flex';
                        chartSection.style.display = 'flex';
                        budgetCard.style.display = 'block';
                        expenseForm.style.display = 'block';
                        latestEntryCard.style.display = 'block';
                        totalRecordsCard.style.display = 'block';
                        monthlyChartCard.style.display = 'block';
                    }
                }
                const isMobile = window.matchMedia("(max-width: 768px)").matches;
                if (isMobile) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    async function fetchExpenses(projectId) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('project_id', projectId);
        if (error) {
            const expenseError = document.getElementById('expense-error');
            expenseError.textContent = 'Error fetching expenses: ' + error.message;
            expenseError.classList.add('active');
            return;
        }
        expenses = data.map(exp => ({
            ...exp,
            created_at: new Date(exp.created_at)
        }));
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        currentProject.house_value = totalExpenses;
    }

    function updateBudgetCard(houseValue) {
        animateNumber(remainingValue, houseValue);
    }

    function animateNumber(element, target) {
        let start = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        const duration = 1000;
        const range = target - start;
        let startTimestamp = null;

        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(start + range * progress);
            element.textContent = `${current.toLocaleString()} RWF`;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function updateOverviewCards() {
        totalRecordsCard.querySelector('#totalRecords').textContent = expenses.length;
        const latest = expenses.length ? expenses.reduce((latest, exp) => 
            new Date(exp.created_at) > new Date(latest.created_at) ? exp : latest, expenses[0]) : null;
        latestEntryCard.querySelector('#latestEntry').textContent = latest ? `${latest.description} - ${latest.created_at.toLocaleDateString()}` : 'No entries';
    }

    function initializeChart() {
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        const ctx = monthlyChartCanvas.getContext('2d');
        const today = new Date();
        const days = [];
        const dailyTotals = Array(7).fill(0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push(date.toLocaleString('en-US', { weekday: 'short' }));
        }

        expenses.forEach(exp => {
            const expenseDate = new Date(exp.created_at);
            const dayDiff = Math.floor((today - expenseDate) / (1000 * 60 * 60 * 24));
            const index = 6 - dayDiff;
            if (index >= 0 && index < 7) {
                dailyTotals[index] += exp.amount;
            }
        });

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Daily Spending (RWF)',
                    data: dailyTotals,
                    borderColor: '#00C4CC',
                    backgroundColor: 'rgba(0, 196, 204, 0.2)',
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Amount (RWF)', color: '#D1D5DB' },
                        ticks: { color: '#D1D5DB', callback: value => value.toLocaleString() },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'Day', color: '#D1D5DB' },
                        ticks: { color: '#D1D5DB' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#D1D5DB' } }
                }
            }
        });
    }

    function setupSettings() {
        settingsTab.style.display = 'block';
        budgetLatestSection.style.display = 'none';
        expenseTotalSection.style.display = 'none';
        chartSection.style.display = 'none';
        updateSettingsCode();

        deleteProjectBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this project?')) {
                if (!currentProject) {
                    alert('No project to delete.');
                    return;
                }
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', currentProject.id);
                if (error) {
                    alert('Failed to delete project: ' + error.message);
                } else {
                    currentProject = null;
                    projectSetup.style.display = 'block';
                    budgetCard.style.display = 'none';
                    expenseForm.style.display = 'none';
                    budgetLatestSection.style.display = 'none';
                    expenseTotalSection.style.display = 'none';
                    chartSection.style.display = 'none';
                    settingsTab.style.display = 'none';
                }
            }
        });
    }

    function updateSettingsCode() {
        if (currentProject && invitationCodeDisplay && copyCodeBtn && codeStatus && generateNewCodeBtn) {
            invitationCodeDisplay.textContent = currentProject.invitation_code || 'Loading...';
            const isExpired = currentProject.invitation_code_expires_at && new Date(currentProject.invitation_code_expires_at) < new Date();
            let buttonGroup = document.querySelector('.button-group');
            
            if (!buttonGroup) {
                buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group';
                if (codeStatus.nextSibling) {
                    codeStatus.parentNode.insertBefore(buttonGroup, codeStatus.nextSibling);
                } else {
                    codeStatus.parentNode.appendChild(buttonGroup);
                }
            }

            if (isExpired) {
                codeStatus.textContent = 'This code has expired.';
                codeStatus.style.display = 'block';
                buttonGroup.innerHTML = '';
                buttonGroup.appendChild(generateNewCodeBtn);
                generateNewCodeBtn.style.display = 'block';
                copyCodeBtn.style.display = 'none';
            } else {
                codeStatus.style.display = 'none';
                buttonGroup.innerHTML = '';
                buttonGroup.appendChild(copyCodeBtn);
                copyCodeBtn.style.display = 'block';
                generateNewCodeBtn.style.display = 'none';
            }

            copyCodeBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(currentProject.invitation_code).then(() => {
                    // Success handled by UI
                }).catch(err => {
                    alert('Failed to copy code: ' + err.message);
                });
            });

            generateNewCodeBtn.addEventListener('click', async () => {
                const newCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
                const newExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
                const { error } = await supabase
                    .from('projects')
                    .update({
                        invitation_code: newCode,
                        invitation_code_expires_at: newExpiresAt
                    })
                    .eq('id', currentProject.id);
                if (error) {
                    alert('Failed to generate new code: ' + error.message);
                } else {
                    currentProject.invitation_code = newCode;
                    currentProject.invitation_code_expires_at = newExpiresAt;
                    updateSettingsCode();
                    // Success handled by UI
                }
            });
        }
    }

    // Clear errors on focus
    projectNameInput?.addEventListener('focus', () => {
        document.getElementById('create-error').classList.remove('active');
    });
    joinCodeInput?.addEventListener('focus', () => {
        document.getElementById('join-error').classList.remove('active');
    });
    expenseAmount?.addEventListener('focus', () => {
        document.getElementById('expense-error').classList.remove('active');
    });
    expenseDescription?.addEventListener('focus', () => {
        document.getElementById('expense-error').classList.remove('active');
    });
    transactionDate?.addEventListener('focus', () => {
        document.getElementById('expense-error').classList.remove('active');
    });

    // Initialize the dashboard
    initDashboard();
});