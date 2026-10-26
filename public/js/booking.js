/**
 * booking.js - Manages vehicle selection, date validation, overlap check, price calculation, and simulated payment
 */

let selectedVehicle = null;
let currentAvailability = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const vehicleId = getQueryParam('vehicle_id');
  if (!vehicleId) {
    showAlert('booking-alert', 'No vehicle selected. Please choose a vehicle from the fleet first.', 'warning');
    setTimeout(() => {
      window.location.href = 'vehicles.html';
    }, 2000);
    return;
  }

  // Check login status
  const auth = await getCurrentUser();
  currentUser = auth.customer;

  await loadVehicleDetails(vehicleId);
  setupDatePickers();
  setupBookingForm();
  setupPaymentModal();
});

async function loadVehicleDetails(vehicleId) {
  try {
    const res = await fetch(`/api/vehicles/${vehicleId}`);
    const data = await res.json();

    if (data.success && data.vehicle) {
      selectedVehicle = data.vehicle;
      renderVehicleSummary(selectedVehicle);
    } else {
      showAlert('booking-alert', 'Vehicle not found.', 'danger');
    }
  } catch (err) {
    console.error('Error fetching vehicle details:', err);
    showAlert('booking-alert', 'Unable to retrieve vehicle details.', 'danger');
  }
}

function renderVehicleSummary(vehicle) {
  const container = document.getElementById('selected-vehicle-preview');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem;">
      <img src="${vehicle.image_url}" alt="${vehicle.name}" style="width: 120px; height: 80px; object-fit: cover; border-radius: var(--radius-md);" />
      <div>
        <span class="vehicle-badge" style="position: static; display: inline-block; margin-bottom: 0.3rem;">${vehicle.type}</span>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--secondary);">${vehicle.name}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">${vehicle.model} • 📍 ${vehicle.city || 'Mumbai'} • ${vehicle.transmission} • ${vehicle.seats} Seats</p>
      </div>
    </div>
  `;

  document.getElementById('summary-rate').textContent = formatCurrency(vehicle.price_per_day);
}

function setupDatePickers() {
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');

  // Format today as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  startDateInput.min = today;
  startDateInput.value = today;

  // Default end date as tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  endDateInput.min = today;
  endDateInput.value = tomorrowStr;

  // Prepopulate if passed from vehicles page availability check
  const queryStartDate = getQueryParam('start_date');
  const queryEndDate = getQueryParam('end_date');
  if (queryStartDate && queryStartDate >= today) {
    startDateInput.value = queryStartDate;
    endDateInput.min = queryStartDate;
  }
  if (queryEndDate && queryEndDate >= (queryStartDate || today)) {
    endDateInput.value = queryEndDate;
  }

  startDateInput.addEventListener('change', () => {
    if (endDateInput.value < startDateInput.value) {
      endDateInput.value = startDateInput.value;
    }
    endDateInput.min = startDateInput.value;
    checkAvailabilityAndCost();
  });

  endDateInput.addEventListener('change', () => {
    checkAvailabilityAndCost();
  });

  // Initial calculation
  checkAvailabilityAndCost();
}

async function checkAvailabilityAndCost() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const payBtn = document.getElementById('open-payment-btn');

  if (!selectedVehicle || !startDate || !endDate) return;

  clearAlert('booking-alert');

  try {
    const res = await fetch('/api/bookings/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: selectedVehicle.id,
        start_date: startDate,
        end_date: endDate
      })
    });

    const data = await res.json();
    currentAvailability = data;

    if (data.success && data.available) {
      document.getElementById('summary-days').textContent = `${data.total_days} Day(s)`;
      document.getElementById('summary-total').textContent = formatCurrency(data.total_price);
      payBtn.disabled = false;
      payBtn.textContent = `Proceed to Payment (${formatCurrency(data.total_price)})`;
    } else {
      document.getElementById('summary-days').textContent = `${data.total_days || 0} Day(s)`;
      document.getElementById('summary-total').textContent = formatCurrency(data.total_price || 0);
      showAlert('booking-alert', data.message || 'Vehicle unavailable for these dates.', 'danger');
      payBtn.disabled = true;
      payBtn.textContent = 'Vehicle Unavailable for Selected Dates';
    }
  } catch (err) {
    console.error('Error checking availability:', err);
    showAlert('booking-alert', 'Failed to verify vehicle availability.', 'danger');
  }
}

function setupBookingForm() {
  const payBtn = document.getElementById('open-payment-btn');
  const modal = document.getElementById('payment-modal');

  payBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Check if customer is logged in
    if (!currentUser) {
      // Redirect to login with current vehicle page saved
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    if (!currentAvailability || !currentAvailability.available) {
      showAlert('booking-alert', 'Please select valid available dates first.', 'warning');
      return;
    }

    // Populate modal summary
    document.getElementById('modal-vehicle-title').textContent = `${selectedVehicle.name} (${selectedVehicle.model})`;
    document.getElementById('modal-dates').textContent = `${formatDate(document.getElementById('start-date').value)} to ${formatDate(document.getElementById('end-date').value)}`;
    document.getElementById('modal-amount').textContent = formatCurrency(currentAvailability.total_price);

    // Open modal
    modal.classList.add('active');
  });
}

function setupPaymentModal() {
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-payment-btn');
  const paymentForm = document.getElementById('simulated-payment-form');

  const closeModal = () => {
    modal.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const paymentInfo = document.getElementById('payment-info').value.trim();
    const confirmBtn = document.getElementById('confirm-pay-btn');

    if (!paymentInfo) {
      alert('Please enter dummy payment info to proceed.');
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing Payment...';

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    try {
      const res = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicle.id,
          start_date: startDate,
          end_date: endDate,
          payment_method: paymentMethod,
          payment_info: paymentInfo
        })
      });

      const data = await res.json();

      if (data.success) {
        closeModal();
        showAlert('booking-alert', 'Payment Approved! Booking confirmed. Redirecting to your bookings...', 'success');
        setTimeout(() => {
          window.location.href = 'my-bookings.html';
        }, 1500);
      } else {
        alert(data.message || 'Payment simulation failed.');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Simulate Payment & Confirm';
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      alert('Network error while processing booking confirmation.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Simulate Payment & Confirm';
    }
  });
}
