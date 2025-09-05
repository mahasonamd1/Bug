// Define the plugin
const plugin = {
    // The command that triggers this plugin
    command: 'ping',

    // Description (optional)
    description: "Responds with 'pong' to check if the bot is active.",

    /**
     * The main function of the plugin
     * @param {object} sock - The Baileys socket instance
     * @param {object} msg - The received message object
     * @param {string} text - The full text of the message
     */
    async run(sock, msg, text) {
        // Send 'pong' as a reply
        await sock.sendMessage(msg.key.remoteJid, { text: 'pong' }, { quoted: msg });
    }
};

// Export the plugin using ES Module syntax
export default plugin;
