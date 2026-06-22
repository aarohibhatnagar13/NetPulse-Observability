const {
    logHeartbeat,
    getMonitorHistory,
    getMonitorSummary
} = require('../models/monitorModel');

// Function to CREATE a heartbeat
const createHeartbeat = async (req, res, next) => { // Added 'next' here
    const { monitorId, status, latency } = req.body;

    try {
        await logHeartbeat(monitorId, status, latency);

        res.status(201).json({
            message: 'Heartbeat logged successfully'
        });
    } catch (error) {
        next(error); // This "pushes" the error to your new errorHandler!
    }
};

// Function to GET the last 10 heartbeat logs
const getMonitorLogs = async (req, res, next) => { // Added 'next' here
    // Get monitorId from URL params and convert to integer
    const monitorId = parseInt(req.params.monitorId);

    try {
        const rows = await getHeartbeatsByMonitor(monitorId);

        // Return the rows
        res.status(200).json(rows);
    } catch (error) {
        next(error); // Send the error to the centralized errorHandler
    }
};

// Function to GET monitor statistics summary
const getSummary = async (req, res, next) => { // Added 'next' here
    // Get monitorId from URL params and convert to integer
    const monitorId = parseInt(req.params.monitorId);

    try {
        const summary = await getMonitorSummary(monitorId);

        // Handle monitors with no heartbeats
        if (summary.total_checks === 0) {
            summary.avg_latency = 0;
            summary.uptime_percent = 0;
        }

        // Return the summary data
        res.status(200).json(summary);
    } catch (error) {
        next(error); // Send the error to the centralized errorHandler
    }
};

// Exporting the functions
module.exports = {
    createHeartbeat,
    getMonitorLogs,
    getSummary
};