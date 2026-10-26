/**
 * navbar.js - Dynamically injects and manages the main navigation header
 */

document.addEventListener('DOMContentLoaded', async () => {
  const navPlaceholder = document.getElementById('navbar-container');
  if (!navPlaceholder) return;

  const authData = await getCurrentUser();
  const currentPath = window.location.pathname;

  const isHome = currentPath === '/' || currentPath.endsWith('index.html');
  const isVehicles = currentPath.includes('vehicles.html');
  const isBookings = currentPath.includes('my-bookings.html');
  const isLogin = currentPath.includes('login.html');
  const isRegister = currentPath.includes('register.html');

  let navRightHtml = '';

  if (authData.authenticated && authData.customer) {
    navRightHtml = `
      <ul class="nav-links">
        <li><a href="index.html" class="${isHome ? 'active' : ''}">Home</a></li>
        <li><a href="vehicles.html" class="${isVehicles ? 'active' : ''}">Browse Fleet</a></li>
        <li><a href="my-bookings.html" class="${isBookings ? 'active' : ''}">My Bookings</a></li>
      </ul>
      <div class="nav-auth">
        <span class="user-badge">
          👤 ${authData.customer.name.split(' ')[0]}
        </span>
        <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
      </div>
    `;
  } else {
    navRightHtml = `
      <ul class="nav-links">
        <li><a href="index.html" class="${isHome ? 'active' : ''}">Home</a></li>
        <li><a href="vehicles.html" class="${isVehicles ? 'active' : ''}">Browse Fleet</a></li>
      </ul>
      <div class="nav-auth">
        <a href="login.html" class="btn btn-outline btn-sm ${isLogin ? 'active' : ''}">Login</a>
        <a href="register.html" class="btn btn-primary btn-sm ${isRegister ? 'active' : ''}">Register</a>
      </div>
    `;
  }

  navPlaceholder.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="index.html" class="brand-logo">
          <span class="logo-icon">🚗</span>
          <span>RentDrive</span>
        </a>
        ${navRightHtml}
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
});
