const axios = require('axios');
// Make sure this file can read the .env file!
require('dotenv').config({ path: '../../.env' }); 

async function sendDiscordAlert(monitorName, targetUrl, state) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return; 

    let messageContent = '';

    // Create different messages based on the state!
    if (state === 'DOWN') {
        messageContent = `🚨 **CRITICAL NETWORK ALERT** 🚨\n**Monitor:** ${monitorName}\n**Target:** ${targetUrl}\n**Status:** OFFLINE`;
    } else if (state === 'UP') {
        messageContent = `✅ **NETWORK RECOVERY** ✅\n**Monitor:** ${monitorName}\n**Target:** ${targetUrl}\n**Status:** BACK ONLINE`;
    }

    try {
        await axios.post(webhookUrl, { content: messageContent });
        console.log(`🔔 [Discord] Sent ${state} alert for ${monitorName}`);
    } catch (error) {
        console.error("❌ Failed to send Discord alert:", error.message);
    }
}
module.exports = { sendDiscordAlert };