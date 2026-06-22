const db = require('../config/db'); // Importing the DB Connection

// === 1. YOUR FUNCTION: Fetch all targets for the pinger loop ===
const getAllMonitors = async () => {
    const sql = 'SELECT * FROM monitors';
    const [rows] = await db.execute(sql);
    return rows;
};

// === 2. YOUR FUNCTION (UPGRADED): Fetch the last 20 heartbeats for the graph ===
const getMonitorHistory = async (monitorId) => {
    // Validation
    if (!Number.isInteger(Number(monitorId)) || monitorId <= 0) {
        throw new Error("Invalid monitorId: Must be a positive integer.");
    }

    const sql = `
        SELECT status, latency, created_at
        FROM heartbeats
        WHERE monitor_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    `;

    const [rows] = await db.execute(sql, [monitorId]);
    return rows.reverse(); // Reverse so oldest is first on the frontend graph!
};
// === 3. PARTNER's FUNCTION (FIXED): Securely log a new heartbeat AND update status ===
const logHeartbeat = async (monitorId, status, latency) => {
    if (!Number.isInteger(monitorId) || monitorId <= 0) {
        throw new Error("Invalid monitorId: Must be a positive integer.");
    }
    if (!['up', 'down'].includes(status)) {
        throw new Error("Invalid status: Must be either 'up' or 'down'.");
    }
    if (typeof latency !== 'number' || latency < 0) {
        throw new Error("Invalid latency: Must be a non-negative number.");
    }

    // Insert the heartbeat log
    const insertSql = "INSERT INTO heartbeats (monitor_id, status, latency) VALUES (?, ?, ?)";
    // Update the main dashboard status!
    const updateSql = "UPDATE monitors SET status = ? WHERE id = ?";

    try {
        await db.execute(insertSql, [monitorId, status, latency]);
        await db.execute(updateSql, [status, monitorId]); // <--- THIS WAS MISSING
    } catch (error) {
        console.error("Database Error:", error.message);
        throw error;
    }
};

// === 4. PARTNER's FUNCTION: Analytical summary ===
const getMonitorSummary = async (monitorId) => {
    if (!Number.isInteger(monitorId) || monitorId <= 0) {
        throw new Error("Invalid monitorId: Must be a positive integer.");
    }

    const sql = `SELECT
            COUNT(*) AS total_checks,
            AVG(latency) AS avg_latency,
            (SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS uptime_percent
        FROM heartbeats
        WHERE monitor_id = ?`;

    const [rows] = await db.execute(sql, [monitorId]);
    return rows[0];
};

// EXPORT ALL 4 SECURE FUNCTIONS
module.exports = {
    getAllMonitors,
    getMonitorHistory,
    logHeartbeat,
    getMonitorSummary
};