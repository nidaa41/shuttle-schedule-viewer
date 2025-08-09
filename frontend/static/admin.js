document.addEventListener('DOMContentLoaded', () => {
    const routeSelect = document.getElementById('route-select');
    const weekdayInput = document.getElementById('weekday');
    const weekendInput = document.getElementById('weekend');
    const specialInput = document.getElementById('special');
    const stopsContainer = document.getElementById('stops-container');
    const saveButton = document.getElementById('save');

    // Load all routes into dropdown
    fetch('/test-mysql')
    .then(res => res.json())
    .then(routes => {
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name || `Route ${route.id}`;
            routeSelect.appendChild(option);
        });
    })
    .catch(err => {
        console.error('Error fetching routes:', err);
        alert('Failed to load routes.');
    });

    // On route selection
    routeSelect.addEventListener('change', () => {
        const routeId = routeSelect.value;
        if (!routeId) return;
        
        loadStops(routeId);
        loadSchedule(routeId);
    });

    // Load stops
    function loadStops(routeId) {
        fetch(`/routes/${routeId}/stops`)
        .then(res => res.json())
        .then(stops => {
            stops.sort((a, b) => a.sequence - b.sequence);
            stopsContainer.innerHTML = '';
            
            stops.forEach((stop, index) => {
                const stopDiv = document.createElement('div');
                stopDiv.classList.add('stop-block');
                stopDiv.innerHTML = `<label>Stop ${index + 1}:</label><br>
                <p>${stop.name}</p><br>`;

            stopsContainer.appendChild(stopDiv);
        });
    })
    .catch(err => {
        console.error('Error loading stops:', err);
        stopsContainer.innerHTML = 'Failed to load stops.';
    });
}

    // Load schedule from MongoDB
    function loadSchedule(routeId) {
        fetch(`/routes/${routeId}/schedule`)
        .then(res => res.json())
        .then(schedule => {
            weekdayInput.value = Array.isArray(schedule.weekday)
            ? schedule.weekday.join(', ')
            : schedule.weekday || '';
            
            weekendInput.value = Array.isArray(schedule.weekend)
            ? schedule.weekend.join(', ')
            : schedule.weekend || '';
            
            if (typeof schedule.special === 'object') {
                const specialLines = Object.entries(schedule.special)
                .map(([date, times]) => `${date}:${times.join(',')}`);
                specialInput.value = specialLines.join('\n');
            } else {
                specialInput.value = schedule.special || '';
            }
        })
        
        .catch(err => {
            console.warn('No schedule found or error:', err);
            weekdayInput.value = '';
            weekendInput.value = '';
            specialInput.value = '';
        });
    }
    
    function parseSpecialDays(input) {
        const specialObj = {};
        input.split('\n').forEach(line => {
            const [date, times] = line.split(/:(.+)/); 
            if (date && times) {
                specialObj[date.trim()] = times.split(',').map(t => t.trim());
            }
        });
        return specialObj;
    }


    // Save schedule 
    saveButton.addEventListener('click', async () => {
        const routeId = routeSelect.value;
        if (!routeId) return alert('Please select a route.');
        
        const scheduleData = {
            weekday: weekdayInput.value.split(',').map(t => t.trim()).filter(Boolean),
            weekend: weekendInput.value.split(',').map(t => t.trim()).filter(Boolean),
            special: parseSpecialDays(specialInput.value),
        };

        try {
            const res = await fetch(`/routes/${routeId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData),
            });
            
            if (res.ok) {
                alert('Schedule updated successfully!');
            } else {
                alert('Failed to update schedule.');
            }
        } catch (err) {
            console.error('Error updating schedule:', err);
            alert('Error saving schedule.');
        }
    });
});

document.getElementById('log-out').addEventListener('click', () => {
  fetch('/logout')
    .then(() => {
      window.location.href = '/';
    })
    .catch(err => {
      console.error('Logout failed:', err);
      alert('Error logging out');
    });
});
