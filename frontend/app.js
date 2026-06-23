// The URL of your Node.js Backend API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 1. Fetch the monitors from the backend
 */
async function fetchMonitors() {
    try {
        const response = await fetch(`${API_BASE_URL}/monitors`);
        if (!response.ok) throw new Error("Failed to fetch data");
        
        const data = await response.json();
        renderCards(data); // Send the data to the rendering function
    } catch (error) {
        console.error("Error connecting to backend:", error);
        document.getElementById('status-container').innerHTML = 
            `<p style="color: red;">Failed to connect to Cisco Engine API.</p>`;
    }
}

/**
 * 2. Generate the HTML cards dynamically
 */
function renderCards(monitors) {
    const container = document.getElementById('status-container');
    container.innerHTML = ''; // Clear out any old cards before drawing new ones

    monitors.forEach(monitor => {
        // Determine CSS class based on status (lowercase from backend)
        const stateClass = monitor.status === 'up' ? 'is-up' : 'is-down';
        
        // Format latency (if it's down, show '--')
        const displayLatency = monitor.status === 'up' ? monitor.latency : '--';
        const statusText = monitor.status === 'up' ? 'UP' : 'DOWN';

        // Create the card HTML template
        const cardHTML = `
            <div class="monitor-card ${stateClass}">
                <div class="card-header">
                    <h3 class="monitor-name">${monitor.name}</h3>
                    <span class="protocol-badge">${monitor.protocol}</span>
                </div>
                <div class="card-body">
                    <span class="target-url">${monitor.target}</span>
                </div>
                <div class="card-footer">
                    <div class="status-indicator">
                        <div class="dot"></div>
                        <span>${statusText}</span>
                    </div>
                    <div class="latency-metric">
                        <span class="value">${displayLatency}</span>
                        <span class="unit">ms</span>
                    </div>
                </div>
            </div>
        `;

        // Inject the card into the container
        container.innerHTML += cardHTML;
    });
}

/**
 * 3. Start the Application
 */
function init() {
    console.log("Cisco Frontend Engine Started");
    fetchMonitors(); // Fetch immediately on load

    // Auto-refresh the dashboard every 30 seconds
    setInterval(fetchMonitors, 30000); 
}
// --- NEW CODE FOR THE CHART ---

let latencyChart = null; // Global variable to hold the chart instance

/**
 * 4. Fetch the history data for Google (Monitor ID: 1)
 */
async function fetchChartData() {
    try {
        const response = await fetch(`${API_BASE_URL}/monitors/1/history`);
        if (!response.ok) throw new Error("Failed to fetch history");
        
        const historyData = await response.json();
        drawChart(historyData);
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}

/**
 * 5. Draw the Chart.js Line Graph
 */
function drawChart(historyData) {
    const ctx = document.getElementById('latency-chart').getContext('2d');
    
    // Extract the exact data we need for the X and Y axes
    const labels = historyData.map(ping => {
        const date = new Date(ping.created_at);
        // Format time to look clean: "10:05:30 AM"
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
    const latencies = historyData.map(ping => ping.latency);

    // Destroy the old chart if it exists so it doesn't glitch when refreshing
    if (latencyChart) {
        latencyChart.destroy();
    }

    // Create the sleek, dark-mode chart
    latencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // X-axis (Times)
            datasets: [{
                label: 'Latency (ms)',
                data: latencies, // Y-axis (Speed)
                borderColor: '#3b82f6', // Cisco/Tech Blue line
                backgroundColor: 'rgba(59, 130, 246, 0.1)', // Faint blue glow underneath
                borderWidth: 2,
                tension: 0.3, // Smooth, curved lines
                fill: true,
                pointBackgroundColor: '#10b981', // Healthy green dots on the line
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Hide the legend for a cleaner look
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#27272a' }, // Match our CSS dark borders
                    ticks: { color: '#a1a1aa' } // Muted gray text
                },
                x: {
                    grid: { display: false }, // Hide vertical grid lines for modern look
                    ticks: { color: '#a1a1aa', maxTicksLimit: 7 } // Don't crowd the bottom text
                }
            }
        }
    });
}

/**
 * 6. Update the Init function to include the Chart!
 */
function init() {
    console.log("Cisco Frontend Engine Started");
    
    // Initial fetch on load
    fetchMonitors(); 
    fetchChartData(); // <--- ADD THIS LINE

    // Auto-refresh the dashboard every 60 seconds
    setInterval(() => {
        fetchMonitors();
        fetchChartData(); // <--- ADD THIS LINE
    }, 60000); 
}


// Run the init function when the page loads
init();