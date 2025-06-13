import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/+esm';

// Initialize Supabase client with anon key, but we'll set the session later
const supabase = createClient('https://smcyqxylufjgkmumhonk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY3lxeHlsdWZqZ2ttdW1ob25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzUyNTgsImV4cCI6MjA2NDIxMTI1OH0.aRLFJCwe8WpMx1mXRmHWfnLH3XLi3af5Z1KeiJzAJNc');

let currentProject = null;

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

const appState = {
    project: null,
    expenses: [],
    initialExpenses: [],
    lastFetch: null,
    lastSearchDate: null
};

async function renderExpenses() {
    const expenseTableBody = document.getElementById('expenseTableBody');
    const expenseTable = document.getElementById('expenseTable');
    const editModalOverlay = document.getElementById('editModalOverlay');
    const editRequisitionId = document.getElementById('editRequisitionId');
    const editTransactionDate = document.getElementById('editTransactionDate');
    const editExpenseAmount = document.getElementById('editExpenseAmount');
    const editExpenseDescription = document.getElementById('editExpenseDescription');
    const editError = document.getElementById('edit-error');

    if (!expenseTableBody || !expenseTable || !editModalOverlay || !editRequisitionId || !editTransactionDate || !editExpenseAmount || !editExpenseDescription || !editError) {
        console.error('Required DOM elements not found:', {
            expenseTableBody, expenseTable, editModalOverlay, editRequisitionId, editTransactionDate, editExpenseAmount, editExpenseDescription, editError
        });
        return;
    }

    const userIds = [...new Set(appState.expenses.map(exp => exp.user_id))];
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);
    if (userError) {
        editError.textContent = 'Failed to fetch user details: ' + userError.message;
        editError.classList.add('active');
        return;
    }
    const userMap = users.reduce((map, user) => {
        map[user.id] = user.name;
        return map;
    }, {});

    expenseTableBody.innerHTML = '';
    if (appState.expenses.length === 0 && appState.lastSearchDate) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; color: #D1D5DB;">No records for the search date</td>
        `;
        expenseTableBody.appendChild(row);
    } else {
        appState.expenses.forEach(exp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exp.transaction_date}</td>
                <td>${exp.requisition_id}</td>
                <td>${exp.amount.toLocaleString()}</td>
                <td>${exp.description}</td>
                <td>${userMap[exp.user_id] || 'Unknown'}</td>
                <td>
                    <button class="edit-btn" data-id="${exp.requisition_id}">Edit</button>
                    <button class="delete-btn" data-id="${exp.requisition_id}">Delete</button>
                </td>
            `;
            expenseTableBody.appendChild(row);

            // Add Edit button listener
            const editBtn = row.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                editRequisitionId.value = exp.requisition_id;
                editTransactionDate.value = exp.transaction_date;
                editExpenseAmount.value = exp.amount;
                editExpenseDescription.value = exp.description;
                editModalOverlay.style.display = 'flex';
                expenseTable.style.display = 'none';
            });

            // Add Delete button listener
            const deleteBtn = row.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async () => {
                const editError = document.getElementById('edit-error');
                editError.classList.remove('active');
                if (confirm('Are you sure you want to delete this expense?')) {
                    const { data, error } = await supabase
                        .from('expenses')
                        .delete()
                        .eq('requisition_id', exp.requisition_id)
                        .eq('project_id', currentProject.id);
                    if (error || !data || data.length === 0) {
                        if (error && (error.code === '42501' || error.message.toLowerCase().includes('permission denied'))) {
                            editError.textContent = 'Only the creator can delete this record!';
                        } else {
                            editError.textContent = 'Failed to delete expense: ' + (error ? error.message : 'Only the creator can delete this record!');
                        }
                        editError.classList.add('active');
                    } else {
                        // Success handled by reload
                        window.location.reload();
                    }
                }
            });
        });
    }
}

async function loadExpenses(dateFilter = null) {
    const searchError = document.getElementById('search-error');
    let query = supabase
        .from('expenses')
        .select('transaction_date, requisition_id, amount, description, user_id')
        .eq('project_id', currentProject.id)
        .order('transaction_date', { ascending: false });

    if (dateFilter) {
        const { data: expenses, error } = await query.eq('transaction_date', dateFilter);
        if (error) {
            searchError.textContent = 'Failed to load expenses: ' + error.message;
            searchError.classList.add('active');
            return;
        }
        appState.expenses = expenses;
    } else {
        const now = Date.now();
        if (!appState.lastFetch || now - appState.lastFetch > 5 * 60 * 1000) {
            const { data: expenses, error } = await query;
            if (error) {
                searchError.textContent = 'Failed to load expenses: ' + error.message;
                searchError.classList.add('active');
                return;
            }
            appState.expenses = expenses;
            appState.lastFetch = now;
        }
    }

    appState.lastSearchDate = dateFilter;
    await renderExpenses();
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
    if (userError) {
        const searchError = document.getElementById('search-error');
        searchError.textContent = 'Failed to fetch user details: ' + userError.message;
        searchError.classList.add('active');
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
    if (membershipError || membershipData.length === 0) {
        const searchError = document.getElementById('search-error');
        searchError.textContent = 'You must be part of a project to view expenses.';
        searchError.classList.add('active');
        window.location.href = '../Dashboard/dashboard.html';
        return;
    }

    const projectId = membershipData[0].project_id;
    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, house_value')
        .eq('id', projectId)
        .single();
    if (projectError) {
        const searchError = document.getElementById('search-error');
        searchError.textContent = 'Failed to fetch project details: ' + projectError.message;
        searchError.classList.add('active');
        return;
    }
    currentProject = projectData;

    const searchDate = document.getElementById('searchDate');
    const searchBtn = document.getElementById('searchBtn');
    const printBtn = document.getElementById('printBtn');
    const clearBtn = document.getElementById('clearBtn');
    const expenseTable = document.getElementById('expenseTable');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const editModalOverlay = document.getElementById('editModalOverlay');
    const editRequisitionId = document.getElementById('editRequisitionId');
    const editTransactionDate = document.getElementById('editTransactionDate');
    const editExpenseAmount = document.getElementById('editExpenseAmount');
    const editExpenseDescription = document.getElementById('editExpenseDescription');
    const updateExpenseBtn = document.getElementById('updateExpenseBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const searchError = document.getElementById('search-error');
    const editError = document.getElementById('edit-error');
    const logoutError = document.getElementById('logout-error');

    if (!searchDate || !searchBtn || !printBtn || !clearBtn || !expenseTable || !expenseTableBody || 
        !editModalOverlay || !editRequisitionId || !editTransactionDate || !editExpenseAmount || !editExpenseDescription || 
        !updateExpenseBtn || !cancelEditBtn || !searchError || !editError || !logoutError) {
        console.error('Required DOM elements not found:', {
            searchDate, searchBtn, printBtn, clearBtn, expenseTable, expenseTableBody,
            editModalOverlay, editRequisitionId, editTransactionDate, editExpenseAmount, editExpenseDescription, updateExpenseBtn, cancelEditBtn,
            searchError, editError, logoutError
        });
        return;
    }

    const { data: initialExpenses, error: initialError } = await supabase
        .from('expenses')
        .select('transaction_date, requisition_id, amount, description, user_id')
        .eq('project_id', currentProject.id)
        .order('transaction_date', { ascending: false });
    if (initialError) {
        searchError.textContent = 'Failed to load initial expenses: ' + initialError.message;
        searchError.classList.add('active');
        return;
    }
    appState.initialExpenses = initialExpenses;
    appState.expenses = [...initialExpenses];
    await renderExpenses();

    searchBtn.addEventListener('click', async () => {
        const date = searchDate.value;
        const searchError = document.getElementById('search-error');
        searchError.classList.remove('active');
        if (!date) {
            searchError.textContent = 'Please select a date to search.';
            searchError.classList.add('active');
            return;
        }
        appState.lastSearchDate = date;
        await loadExpenses(date);
    });

    clearBtn.addEventListener('click', async () => {
        searchDate.value = '';
        const searchError = document.getElementById('search-error');
        searchError.classList.remove('active');
        appState.lastSearchDate = null;
        if (appState.expenses.length === 0 && appState.lastSearchDate) {
            searchError.textContent = 'No records for the search date';
            searchError.classList.add('active');
        } else {
            appState.expenses = [...appState.initialExpenses];
            await renderExpenses();
        }
    });

    printBtn.addEventListener('click', () => {
        const printDate = document.getElementById('printDate');
        const now = new Date();
        printDate.textContent = now.toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short', 
            timeZone: 'Africa/Johannesburg'
        });
        window.print();
    });

    updateExpenseBtn.addEventListener('click', async () => {
        const requisitionId = editRequisitionId.value;
        const amount = parseInt(editExpenseAmount.value) || 0;
        const description = editExpenseDescription.value || `Expense on ${new Date().toISOString()}`;
        const transactionDate = editTransactionDate.value;
        const defaultDate = '2025-06-04';
        const editError = document.getElementById('edit-error');
        editError.classList.remove('active');
        if (amount <= 0) {
            editError.textContent = 'Please enter a valid amount.';
            editError.classList.add('active');
            return;
        }
        if (!transactionDate || transactionDate === defaultDate) {
            editError.textContent = 'Please select a transaction date (different from the default).';
            editError.classList.add('active');
            return;
        }

        const { data: currentExpense, error: fetchError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('requisition_id', requisitionId)
            .eq('project_id', currentProject.id)
            .single();
        if (fetchError) {
            editError.textContent = 'Failed to fetch expense details: ' + fetchError.message;
            editError.classList.add('active');
            return;
        }

        const oldAmount = currentExpense.amount;
        const amountDifference = amount - oldAmount;
        const newHouseValue = (currentProject.house_value || 0) + amountDifference;

        const { error: updateError } = await supabase
            .from('expenses')
            .update({
                amount: amount,
                description: description,
                transaction_date: transactionDate,
                updated_at: new Date().toISOString()
            })
            .eq('requisition_id', requisitionId)
            .eq('project_id', currentProject.id);
        if (updateError) {
            editError.textContent = 'Failed to update expense: ' + updateError.message;
            editError.classList.add('active');
            return;
        }

        const { error: projectUpdateError } = await supabase
            .from('projects')
            .update({ house_value: newHouseValue })
            .eq('id', currentProject.id);
        if (projectUpdateError) {
            editError.textContent = 'Failed to update project value: ' + projectUpdateError.message;
            editError.classList.add('active');
            return;
        }

        currentProject.house_value = newHouseValue;
        // Success handled by reload
        window.location.reload();
    });

    cancelEditBtn.addEventListener('click', () => {
        const editModalOverlay = document.getElementById('editModalOverlay');
        const expenseTable = document.getElementById('expenseTable');
        editModalOverlay.style.display = 'none';
        expenseTable.style.display = 'table';
    });

    const sidebarMenu = document.querySelector('.sidebar-menu');
    sidebarMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            menuItem.classList.add('active');
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            if (isMobile) {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.remove('active');
            }
        }
    });

    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', async () => {
        const logoutError = document.getElementById('logout-error');
        logoutError.classList.remove('active');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                logoutError.textContent = 'Logout error: ' + error.message;
                logoutError.classList.add('active');
            } else {
                window.location.replace('../LandingPage/index.html');
            }
        } catch (err) {
            logoutError.textContent = 'Unexpected error during sign out: ' + err.message;
            logoutError.classList.add('active');
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Clear errors on focus
    searchDate?.addEventListener('focus', () => {
        const searchError = document.getElementById('search-error');
        searchError.classList.remove('active');
    });
    editTransactionDate?.addEventListener('focus', () => {
        const editError = document.getElementById('edit-error');
        editError.classList.remove('active');
    });
    editExpenseAmount?.addEventListener('focus', () => {
        const editError = document.getElementById('edit-error');
        editError.classList.remove('active');
    });
    editExpenseDescription?.addEventListener('focus', () => {
        const editError = document.getElementById('edit-error');
        editError.classList.remove('active');
    });
});