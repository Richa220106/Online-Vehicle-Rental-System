/**
 * vehicles.js - Handles loading, city and date availability checking, searching, and filtering
 */

let allVehicles = [];
let currentFilter = 'All';
let selectedCity = 'All';
let selectedStartDate = '';
let selectedEndDate = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCities();
  setupFilterControls();
  setupFilterButtons();
  setupSearchInput();
  await loadVehicles();
});

// Load distinct cities from the backend and populate city dropdown
async function loadCities() {
  const citySelect = document.getElementById('city-select');
  if (!citySelect) return;

  try {
    const res = await fetch('/api/vehicles/cities/list');
    const data = await res.json();

    if (data.success && data.cities && data.cities.length > 0) {
      // Clear and re-populate
      citySelect.innerHTML = '<option value="All">All Cities</option>';
      data.cities.forEach((city) => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = `📍 ${city}`;
        citySelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error loading cities:', err);
  }
}

function setupFilterControls() {
  const citySelect = document.getElementById('city-select');
  const pickupInput = document.getElementById('pickup-date');
  const returnInput = document.getElementById('return-date');
  const checkBtn = document.getElementById('check-availability-btn');
  const resetBtn = document.getElementById('reset-dates-btn');
  const statusDiv = document.getElementById('availability-status');

  if (pickupInput && returnInput) {
    const todayStr = new Date().toISOString().slice(0, 10);
    pickupInput.min = todayStr;
    returnInput.min = todayStr;

    pickupInput.addEventListener('change', () => {
      if (pickupInput.value) {
        returnInput.min = pickupInput.value;
        if (returnInput.value && returnInput.value < pickupInput.value) {
          returnInput.value = pickupInput.value;
        }
      }
    });
  }

  // When city dropdown changes, update availability
  if (citySelect) {
    citySelect.addEventListener('change', async () => {
      selectedCity = citySelect.value;
      updateStatusDisplay();
      await loadVehicles(selectedStartDate, selectedEndDate, selectedCity);
    });
  }

  // Check availability button
  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      const pickupVal = pickupInput ? pickupInput.value : '';
      const returnVal = returnInput ? returnInput.value : '';
      const cityVal = citySelect ? citySelect.value : 'All';

      // If either date is chosen, validate both are chosen
      if ((pickupVal && !returnVal) || (!pickupVal && returnVal)) {
        alert('Please select both Pickup Date and Return Date to check date availability.');
        return;
      }

      if (pickupVal && returnVal && returnVal < pickupVal) {
        alert('Return Date cannot be earlier than Pickup Date.');
        return;
      }

      selectedStartDate = pickupVal;
      selectedEndDate = returnVal;
      selectedCity = cityVal;

      updateStatusDisplay();
      await loadVehicles(selectedStartDate, selectedEndDate, selectedCity);
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (pickupInput) pickupInput.value = '';
      if (returnInput) returnInput.value = '';
      if (citySelect) citySelect.value = 'All';

      selectedStartDate = '';
      selectedEndDate = '';
      selectedCity = 'All';

      if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
      }
      resetBtn.style.display = 'none';
      await loadVehicles('', '', 'All');
    });
  }
}

function updateStatusDisplay() {
  const statusDiv = document.getElementById('availability-status');
  const resetBtn = document.getElementById('reset-dates-btn');
  if (!statusDiv) return;

  const hasCity = selectedCity && selectedCity !== 'All';
  const hasDates = selectedStartDate && selectedEndDate;

  if (hasCity || hasDates) {
    statusDiv.style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'inline-flex';

    let msg = '🔍 Showing ';
    if (hasCity && hasDates) {
      msg += `vehicles in <strong>${selectedCity}</strong> available between <strong>${formatDate(selectedStartDate)}</strong> and <strong>${formatDate(selectedEndDate)}</strong>.`;
    } else if (hasCity) {
      msg += `vehicles in <strong>${selectedCity}</strong>.`;
    } else if (hasDates) {
      msg += `vehicles available between <strong>${formatDate(selectedStartDate)}</strong> and <strong>${formatDate(selectedEndDate)}</strong> across all cities.`;
    }
    statusDiv.innerHTML = `<span style="color: var(--primary); font-weight: 600;">${msg}</span>`;
  } else {
    statusDiv.style.display = 'none';
    statusDiv.innerHTML = '';
    if (resetBtn) resetBtn.style.display = 'none';
  }
}

async function loadVehicles(startDate = selectedStartDate, endDate = selectedEndDate, city = selectedCity) {
  const container = document.getElementById('vehicles-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
      Checking vehicle availability...
    </div>
  `;

  try {
    let url = '/api/vehicles';
    const params = new URLSearchParams();

    if (city && city !== 'All') {
      params.append('city', city);
    }
    if (startDate && endDate) {
      params.append('start_date', startDate);
      params.append('end_date', endDate);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.vehicles) {
      allVehicles = data.vehicles;
      applyFilters();
    } else {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--danger);">
          Failed to load vehicles.
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--danger);">
        Error connecting to vehicle service.
      </div>
    `;
  }
}

function renderVehicles(vehicles) {
  const container = document.getElementById('vehicles-container');
  if (!container) return;

  if (vehicles.length === 0) {
    const hasCity = selectedCity && selectedCity !== 'All';
    const hasDates = selectedStartDate && selectedEndDate;

    let subtext = 'Try adjusting your search criteria, city, or category filter.';
    if (hasCity && hasDates) {
      subtext = `No vehicles found in ${selectedCity} available between ${formatDate(selectedStartDate)} and ${formatDate(selectedEndDate)}.`;
    } else if (hasCity) {
      subtext = `No vehicles currently listed in ${selectedCity}. Try selecting a different city.`;
    } else if (hasDates) {
      subtext = `All vehicles matching criteria are booked between ${formatDate(selectedStartDate)} and ${formatDate(selectedEndDate)}.`;
    }

    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🚗</div>
        <h3 style="font-size: 1.25rem; color: var(--secondary); margin-bottom: 0.5rem;">
          No Vehicles Available
        </h3>
        <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 1.5rem;">
          ${subtext}
        </p>
        <button onclick="document.getElementById('reset-dates-btn').click()" class="btn btn-primary btn-sm">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = vehicles
    .map((v) => {
      const dateParams = selectedStartDate && selectedEndDate
        ? `&start_date=${selectedStartDate}&end_date=${selectedEndDate}`
        : '';
      const bookingLink = `booking.html?vehicle_id=${v.id}${dateParams}`;

      return `
      <div class="vehicle-card">
        <a href="vehicle-details.html?id=${v.id}" class="card-img-wrapper" style="display: block;">
          <img src="${v.image_url}" alt="${v.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'" />
          <span class="vehicle-badge">${v.type}</span>
        </a>
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.2rem;">
            <a href="vehicle-details.html?id=${v.id}" style="text-decoration: none;">
              <h3 class="vehicle-name" style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--secondary)'">${v.name}</h3>
            </a>
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 0.2rem 0.55rem; border-radius: 9999px; border: 1px solid rgba(37,99,235,0.2);">
              📍 ${v.city || 'Mumbai'}
            </span>
          </div>
          <p class="vehicle-model">${v.model}</p>
          <div class="vehicle-specs">
            <span class="spec-item">⚙️ ${v.transmission || 'Automatic'}</span>
            <span class="spec-item">⛽ ${v.fuel_type || 'Petrol'}</span>
            <span class="spec-item">👥 ${v.seats || 5} Seats</span>
          </div>
          <div class="card-footer">
            <div class="price-box">
              <span class="price-amount">${formatCurrency(v.price_per_day)}</span>
              <span class="price-unit">per day</span>
            </div>
            <div style="display: flex; gap: 0.45rem;">
              <a href="vehicle-details.html?id=${v.id}" class="btn btn-outline btn-sm">
                View Details
              </a>
              <a href="${bookingLink}" class="btn btn-primary btn-sm">
                Book Now ➔
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

function setupFilterButtons() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.type;
      applyFilters();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }
}

function applyFilters() {
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = allVehicles;

  if (currentFilter && currentFilter !== 'All') {
    filtered = filtered.filter((v) => v.type.toLowerCase() === currentFilter.toLowerCase());
  }

  if (searchTerm) {
    filtered = filtered.filter(
      (v) =>
        v.name.toLowerCase().includes(searchTerm) ||
        v.model.toLowerCase().includes(searchTerm) ||
        v.type.toLowerCase().includes(searchTerm) ||
        (v.city && v.city.toLowerCase().includes(searchTerm))
    );
  }

  renderVehicles(filtered);
}
