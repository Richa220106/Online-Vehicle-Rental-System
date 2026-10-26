/**
 * vehicle-details.js - Loads and renders comprehensive information for a single vehicle
 */

document.addEventListener('DOMContentLoaded', async () => {
  const vehicleId = getQueryParam('id');
  if (!vehicleId) {
    showAlert('details-alert', 'No vehicle specified. Redirecting to fleet...', 'warning');
    setTimeout(() => {
      window.location.href = 'vehicles.html';
    }, 2000);
    return;
  }

  await loadVehicleDetails(vehicleId);
});

async function loadVehicleDetails(vehicleId) {
  const container = document.getElementById('vehicle-details-container');
  if (!container) return;

  try {
    const res = await fetch(`/api/vehicles/${vehicleId}`);
    const data = await res.json();

    if (data.success && data.vehicle) {
      renderDetails(data.vehicle);
    } else {
      showAlert('details-alert', data.message || 'Vehicle not found.', 'danger');
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <h3>Vehicle Not Found</h3>
          <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">The vehicle you are looking for does not exist or has been removed.</p>
          <a href="vehicles.html" class="btn btn-primary">Browse Available Fleet ➔</a>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching vehicle details:', err);
    showAlert('details-alert', 'Unable to retrieve vehicle details from the server.', 'danger');
  }
}

function renderDetails(v) {
  const container = document.getElementById('vehicle-details-container');
  if (!container) return;

  document.title = `${v.name} - RentDrive`;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2.5rem; align-items: start;">
      
      <!-- Left Column: Big Image & Description & Specs -->
      <div>
        <div style="position: relative; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md); margin-bottom: 2rem; background: #0f172a; max-height: 440px;">
          <img 
            src="${v.image_url}" 
            alt="${v.name}" 
            style="width: 100%; height: 100%; object-fit: cover; display: block;" 
            onerror="this.src='https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'"
          />
          <span class="vehicle-badge" style="top: 16px; right: 16px; font-size: 0.85rem; padding: 0.35rem 0.9rem;">
            ${v.type}
          </span>
        </div>

        <div style="background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 2rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">
            Key Specifications
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
            <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block; font-weight: 600;">CITY LOCATION</span>
              <span style="font-size: 1.05rem; font-weight: 700; color: var(--primary);">📍 ${v.city || 'Mumbai'}</span>
            </div>
            <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block; font-weight: 600;">TRANSMISSION</span>
              <span style="font-size: 1.05rem; font-weight: 700; color: var(--secondary);">⚙️ ${v.transmission || 'Automatic'}</span>
            </div>
            <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block; font-weight: 600;">FUEL TYPE</span>
              <span style="font-size: 1.05rem; font-weight: 700; color: var(--secondary);">⛽ ${v.fuel_type || 'Petrol'}</span>
            </div>
            <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md);">
              <span style="font-size: 0.8rem; color: var(--text-muted); display: block; font-weight: 600;">SEATING CAPACITY</span>
              <span style="font-size: 1.05rem; font-weight: 700; color: var(--secondary);">👥 ${v.seats || 5} Passengers</span>
            </div>
          </div>
        </div>

        <div style="background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 2rem; box-shadow: var(--shadow-sm);">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--secondary); margin-bottom: 1rem;">
            Included Features & Amenities
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> Bluetooth Audio & Navigation
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> Air Conditioning & Heater
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> Power Steering & Windows
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> Comprehensive Insurance Included
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> 24/7 Roadside Assistance
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: var(--text-main);">
              <span style="color: var(--success); font-weight: bold;">✓</span> Thoroughly Sanitized & Serviced
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Booking Action Card -->
      <div style="position: sticky; top: 90px;">
        <div style="background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 2.25rem; box-shadow: var(--shadow-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">
              ${v.type} Vehicle
            </span>
            <span style="font-size: 0.82rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 0.2rem 0.6rem; border-radius: 9999px;">
              📍 ${v.city || 'Mumbai'}
            </span>
          </div>
          <h1 style="font-size: 2rem; font-weight: 800; color: var(--secondary); margin-top: 0.2rem; line-height: 1.2;">
            ${v.name}
          </h1>
          <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem;">
            Model / Edition: <strong>${v.model}</strong>
          </p>

          <div style="background: var(--primary-light); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid rgba(37,99,235,0.15); margin-bottom: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Daily Rate:</span>
                <span style="font-size: 2rem; font-weight: 800; color: var(--primary);">
                  ${formatCurrency(v.price_per_day)}
                </span>
                <span style="font-size: 0.85rem; color: var(--text-muted);"> / day</span>
              </div>
              <span style="background: #fff; color: var(--primary); font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 9999px; border: 1px solid rgba(37,99,235,0.2);">
                Best Rate Guarantee
              </span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);">
              <span>Location:</span>
              <strong style="color: var(--secondary);">📍 ${v.city || 'Mumbai'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);">
              <span>Security Deposit:</span>
              <strong style="color: var(--secondary);">₹0 (Waived)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);">
              <span>Free Cancellation:</span>
              <strong style="color: var(--success);">Yes (Before End Date)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);">
              <span>Daily KM Limit:</span>
              <strong style="color: var(--secondary);">Unlimited Kilometers</strong>
            </div>
          </div>

          <a href="booking.html?vehicle_id=${v.id}" class="btn btn-primary btn-block" style="padding: 0.85rem; font-size: 1.05rem;">
            Book This Vehicle Now ➔
          </a>

          <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 1rem;">
            🔒 Safe & Secure Checkout • Simulated Payment Protection
          </p>
        </div>
      </div>

    </div>
  `;
}
