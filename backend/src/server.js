require('./config/db'); // Database connection
const express = require('express');
const cors = require('cors'); // Import CORS so frontend can talk to backend
const app = express();
const port = 3000; 

app.use(cors()); // Enable CORS
app.use(express.json()); // Allow JSON parsing

// === 1. YOUR PARTNER's CODE (The Routes & Middleware) ===
const monitorRoutes = require('./routes/monitorRoutes');
const errorHandler = require('./middleware/errorHandler');

// Mount their REST API routes (handles /api/heartbeat)
app.use('/api', monitorRoutes); 

// === 2. YOUR CUSTOM ENDPOINTS (For the Frontend API Contract) ===
const { getAllMonitors, logHeartbeat, getMonitorHistory } = require('./models/monitorModel'); 
const { checkHttp, checkTcp } = require('./services/pinger');
const { sendDiscordAlert } = require('./services/notifier');

// Endpoint: GET /api/monitors
app.get('/api/monitors', async (req, res) => {
    try {
        const monitors = await getAllMonitors();
        res.json(monitors); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch monitors' });
    }
});

// Endpoint: GET /api/monitors/:id/history
app.get('/api/monitors/:id/history', async (req, res) => {
    try {
        const monitorId = req.params.id; 
        const history = await getMonitorHistory(monitorId);
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Mount their Global Error Handler at the very end
app.use(errorHandler); 

// === 3. YOUR CODE (The Background Network Engine) ===
async function runEngine() {
    console.log("\n[Engine] Waking up... Running network checks...");
    const targets = await getAllMonitors();
    
    for (const target of targets) {
        let result;
        if (target.protocol === 'HTTP') {
            result = await checkHttp(target.target);
        } else if (target.protocol === 'TCP') {
            result = await checkTcp(target.target, process.env.DB_PORT || 3307);
        }

        const oldStatus = target.status.toLowerCase(); 
        const newStatus = result.status; // 'up' or 'down'

        // Save using your partner's secure Model!
        await logHeartbeat(target.id, newStatus, result.latency || 0);

        // Your Discord State Change Logic
        if (newStatus === 'down' && oldStatus !== 'down') {
            await sendDiscordAlert(target.name, target.target, 'DOWN');
        } else if (newStatus === 'up' && oldStatus === 'down') {
            await sendDiscordAlert(target.name, target.target, 'UP');
        }
    }
}

// Start the background engine loop (Every 60 seconds)
runEngine();
setInterval(runEngine, 60000);

// === 4. START THE SERVER ===
app.listen(port, () => {
    console.log(`🚀 Master Server running on http://localhost:${port}`);
});