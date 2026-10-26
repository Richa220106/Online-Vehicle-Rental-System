/**
 * api.js - Shared helper utilities for API calls and UI feedback
 */

// Format price into Indian Rupee currency format (e.g., ₹2,500)
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// Format date into readable format (e.g., 24 Oct 2024)
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Display alert banner in the target container element
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'}</span>
      <div>${message}</div>
    </div>
  `;

  // Auto-scroll into view if needed
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clear alert banner
function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

// Check logged in user status
async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/current-user');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return { authenticated: false, customer: null };
  }
}

// Logout action
async function logout() {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = '/login.html';
    }
  } catch (err) {
    console.error('Logout failed:', err);
  }
}

// Get query param from current URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
