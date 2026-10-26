/**
 * my-bookings.js - Handles listing customer bookings and handling cancellation
 */

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await getCurrentUser();
  if (!auth.authenticated) {
    window.location.href = 'login.html?redirect=my-bookings.html';
    return;
  }

  await loadCustomerBookings();
});

async function loadCustomerBookings() {
  const container = document.getElementById('my-bookings-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
      Loading your bookings...
    </div>
  `;

  try {
    const res = await fetch('/api/bookings/my-bookings');
    const data = await res.json();

    if (data.success && data.bookings) {
      renderBookings(data.bookings);
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--danger);">
          Failed to load your reservations.
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching bookings:', err);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--danger);">
        Error connecting to booking service.
      </div>
    `;
  }
}

function renderBookings(bookings) {
  const container = document.getElementById('my-bookings-container');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1.5rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🚙</div>
        <h3 style="font-size: 1.35rem; color: var(--secondary); margin-bottom: 0.5rem;">No Bookings Yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">You haven't reserved any vehicles yet. Explore our fleet today!</p>
        <a href="vehicles.html" class="btn btn-primary">Browse Vehicles ➔</a>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings
    .map((b) => {
      const bookingStatus = (b.booking_status || 'CONFIRMED').toUpperCase();
      const paymentStatus = (b.payment_status || 'PAID').toUpperCase();
      const isCancelled = bookingStatus === 'CANCELLED';
      return `
      <div class="booking-item-card">
        <div class="booking-vehicle-info">
          <img src="${b.image_url}" alt="${b.vehicle_name}" class="booking-thumb" onerror="this.src='https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'" />
          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.2rem; flex-wrap: wrap;">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--secondary);">${b.vehicle_name}</h3>
              <span class="status-badge ${isCancelled ? 'cancelled' : 'confirmed'}">
                ● ${bookingStatus}
              </span>
              <span class="status-badge ${paymentStatus === 'PAID' ? 'paid' : 'failed'}">
                💳 ${paymentStatus}
              </span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.88rem;">${b.vehicle_model} • ${b.vehicle_type}</p>
            <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.25rem;">Booking Reference: #${b.id}</p>
          </div>
        </div>

        <div style="display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;">
          <div>
            <span style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Rental Dates</span>
            <span style="font-size: 0.95rem; font-weight: 600; color: var(--secondary);">
              ${formatDate(b.start_date)} - ${formatDate(b.end_date)}
            </span>
            <span style="display: block; font-size: 0.8rem; color: var(--text-muted);">${b.total_days} Day(s)</span>
          </div>

          <div>
            <span style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Amount Paid</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">
              ${formatCurrency(b.total_price)}
            </span>
          </div>

          <div>
            ${
              isCancelled
                ? `<span style="font-size: 0.85rem; color: var(--danger); font-weight: 600;">Cancelled & Refunded</span>`
                : (new Date().toISOString().slice(0, 10) > b.end_date)
                ? `<div style="text-align: right;">
                    <button class="btn btn-outline btn-sm" style="opacity: 0.6; cursor: not-allowed; border-color: #cbd5e1; color: var(--text-muted);" onclick="alert('Cancellation is not allowed because the rental end date (${formatDate(b.end_date)}) has already passed.')">
                      Cancel Booking
                    </button>
                    <span style="display: block; font-size: 0.74rem; color: var(--danger); margin-top: 0.25rem;">
                      Past rental end date
                    </span>
                   </div>`
                : `<button onclick="cancelBooking(${b.id})" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: #fca5a5;">
                    Cancel Booking
                   </button>`
            }
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// Global cancellation handler
window.cancelBooking = async function (bookingId) {
  const confirmed = confirm('Are you sure you want to cancel this booking? A simulated refund will be processed.');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message || 'Booking cancelled successfully.');
      await loadCustomerBookings();
    } else {
      alert(data.message || 'Failed to cancel booking.');
    }
  } catch (err) {
    console.error('Cancellation error:', err);
    alert('Network error while cancelling booking.');
  }
};
