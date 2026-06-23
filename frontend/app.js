// 1. Configuration: This defines the link to your partner's backend
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 2. LOAD DATA FROM BACKEND (GET)
 * This replaces the mockMonitors array with real data from the database.
 */
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/monitors`);
        if (!response.ok) throw new Error("Backend connection failed");
        
        const monitors = await response.json();
        
        // Pass the real data to our UI functions
        renderMonitorCards(monitors);
        updateSummary(monitors);
        
        // Update the header status
        const engineStatus = document.querySelector('.engine-status');
        if (engineStatus) {
            engineStatus.innerHTML = '<div class="status-dot"></div> System Active';
        }

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        const engineStatus = document.querySelector('.engine-status');
        if (engineStatus) {
            engineStatus.innerHTML = '<div class="status-dot" style="background-color: #ef4444;"></div> Engine Offline';
        }
    }
}

/**
 * 3. LOAD CHART DATA FROM BACKEND (GET)
 * This replaces mockHistory with real time-series data.
 */
async function loadChartData() {
    try {
        const response = await fetch(`${API_BASE_URL}/monitors/1/history`);
        if (!response.ok) throw new Error("Chart fetch failed");
        
        const history = await response.json();
        renderLatencyChart(history);
    } catch (error) {
        console.error("Chart Load Error:", error);
    }
}

/**
 * 4. RENDER MONITOR CARDS
 */
function renderMonitorCards(monitors) {
    const container = document.getElementById('status-container');
    if (!container) return;

    container.innerHTML = ''; // Clear previous content

    monitors.forEach(monitor => {
        // 1. Determine if the monitor is healthy (Case-insensitive check)
        const isUp = monitor.status && monitor.status.toLowerCase() === 'up';
        
        // 2. Set the CSS classes and text based on health
        const stateClass = isUp ? 'is-up' : 'is-down';
        const displayLatency = isUp ? (monitor.latency || 0) : '--';
        const statusLabel = isUp ? 'UP' : 'DOWN';

        // 3. Create the card element
        const card = document.createElement('div');
        card.className = `monitor-card ${stateClass}`;
        
        // 4. Build the HTML inside the card
        card.innerHTML = `
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
                    <span>${statusLabel}</span>
                </div>
                <div class="latency-metric">
                    <span class="value">${displayLatency}</span>
                    <span class="unit">ms</span>
                </div>
                <button class="ping-btn" onclick="triggerHeartbeat(${monitor.id}, '${monitor.status}')">
                    Ping
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

/**
 * 5. UPDATE SUMMARY COUNTERS
 */
function updateSummary(monitors) {
    const totalEl = document.getElementById('total-count');
    const upEl = document.getElementById('up-count');
    const downEl = document.getElementById('down-count');

    if (totalEl && upEl && downEl) {
        totalEl.textContent = monitors.length;
        upEl.textContent = monitors.filter(m => m.status.toLowerCase() === 'up').length;
        downEl.textContent = monitors.filter(m => m.status.toLowerCase() === 'down').length;
    }
}

/**
 * 6. DATA VISUALIZATION (Chart.js)
 */
let latencyChartInstance = null; // Store chart so we can destroy/rebuild on refresh

function renderLatencyChart(historyData) {
    const ctx = document.getElementById('latency-chart');
    if (!ctx) return;

    // Format data for Chart.js
    const labels = historyData.map(h => {
        const time = new Date(h.created_at);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const dataPoints = historyData.map(h => h.latency);

    // If chart exists, destroy it before creating a new one (prevents glitching)
    if (latencyChartInstance) {
        latencyChartInstance.destroy();
    }

    latencyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Latency (ms)',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#27272a' }, ticks: { color: '#a1a1aa' } },
                x: { grid: { display: false }, ticks: { color: '#a1a1aa' } }
            }
        }
    });
}

/**
 * 7. SEND HEARTBEAT (POST)
 */
async function triggerHeartbeat(id, currentStatus) {
    // 1. Toggle logic: If it's down, we'll try to bring it 'up'. If it's up, we'll keep it 'up'.
    const newStatus = 'up'; 
    const newLatency = Math.floor(Math.random() * 60) + 10; // Random latency between 10-70ms

    console.log(`📡 Manually pinging Monitor ${id}. Setting to ${newStatus}...`);

    try {
        const response = await fetch(`${API_BASE_URL}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                monitorId: id,
                status: newStatus,
                latency: newLatency
            })
        });

        if (response.ok) {
            console.log("✅ Heartbeat success!");
            // 2. IMPORTANT: We must reload the data to see the change!
            await loadDashboardData(); 
            await loadChartData();
        } else {
            const errData = await response.json();
            console.error("❌ Server rejected heartbeat:", errData.error);
        }
    } catch (err) {
        console.error("🌐 Network Error:", err);
    }
}

/**
 * 8. INITIALIZE THE APP
 */
function init() {
    console.log("NetPulse Observability Engine: LIVE MODE");
    loadDashboardData();
    loadChartData();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadDashboardData();
        loadChartData();
    }, 30000);
}

document.addEventListener('DOMContentLoaded', init);