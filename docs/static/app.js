if (
    localStorage.getItem('adminLoggedIn') === 'true' ||
    sessionStorage.getItem('adminLoggedIn') === 'true'
) {
    console.log('Admin is already logged in.');              ////////////////////////////// remove this
}

// Load route list and display in dropdown
async function loadRoutes() {
    try {
        const response = await fetch('/test-mysql');
        if (!response.ok) throw new Error('Failed to fetch routes');

        const routes = await response.json();

        const select = document.getElementById('route-select');
        select.innerHTML = '';

        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            select.appendChild(option);
        });

        // Load first route's data
        if (routes.length > 0) {
            const firstRouteId = routes[0].id;
            select.value = firstRouteId;
            loadStops(firstRouteId);
            loadSchedule(firstRouteId);
        }
    } catch (err) {
        console.error('Error loading routes:', err);
        document.getElementById('route-select').innerHTML = '<option>Error loading routes</option>';
    }
}

// Fetch and display stops for selected route
async function loadStops(routeId) {
    const res = await fetch(`/routes/${routeId}/stops`);
    const stops = await res.json();
    
    const stopsList = document.getElementById('stops-list');
    
    stopsList.innerHTML = '';
    stops.forEach(stop => {
        const li = document.createElement('li');
        li.textContent = `Stop ${stop.sequence}: ${stop.name}`;
        stopsList.appendChild(li);
    });
}

// Fetch and display schedule for selected route
async function loadSchedule(routeId) {
    const res = await fetch(`/routes/${routeId}/schedule`);
    const schedule = await res.json();
    
    const scheduleDiv = document.getElementById('schedule-view');
    
    // Safety check if schedule is missing or incomplete
    if (!schedule || typeof schedule !== 'object') {
        scheduleDiv.innerHTML = 'No schedule found for this route.';
        return;
    }
    
    scheduleDiv.innerHTML = `<h3>Weekday:</h3> ${schedule.weekday ? schedule.weekday.join(', ') : 'Not available'}<br>
    <h3>Weekend:</h3> ${schedule.weekend ? schedule.weekend.join(', ') : 'Not available'}<br>
    <h3>Special Days:</h3> ${
        schedule.special
        ? Object.entries(schedule.special)
        .map(([date, times]) => `${date}: ${times.join(', ')}`)
        .join('<br>')
        : 'None'
    }`;
}

// On route select change
document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
    
    const select = document.getElementById('route-select');
    select.addEventListener('change', () => {
        const routeId = select.value;
        loadStops(routeId);
        loadSchedule(routeId);
    });
});
