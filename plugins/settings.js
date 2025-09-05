import { getSettings, updateSetting } from '../lib/settings.js';

const validModes = ['public', 'private', 'group_only'];
const validOptions = ['on', 'off'];

const settingKeys = {
    botmode: 'bot_mode',
    autoread: 'auto_read_status',
    readmessages: 'read_messages',
    readcommand: 'read_command',
    autoreact: 'auto_react',
    autoblock: 'auto_block',
    antidelete: 'anti_delete' // Added new setting key
};

export default {
    command: 'settings',
    description: 'View and manage bot settings.',
    permission: 'admin',

    async run(sock, msg, args) {
        const [subCommand, value] = args;
        const settings = getSettings();

        // If no arguments, display current settings
        if (!subCommand) {
            let statusText = `*⚙️ Mahasona MD Settings ⚙️*\n\n`;
            statusText += `Here are the current bot settings. Use the provided commands to change them.\n\n`;

            // 1. Bot Mode
            statusText += `1. *Bot Mode*: ${settings.bot_mode}\n   - Command: \`.settings botmode <public|private|group_only>\`\n\n`;

            // 2. Auto Read Status
            const autoreadCmd = settings.auto_read_status ? 'off' : 'on';
            statusText += `2. *Auto Read Status*: ${settings.auto_read_status ? 'On' : 'Off'}\n   - Command: \`.settings autoread ${autoreadCmd}\`\n\n`;

            // 3. Read All Messages
            const readmessagesCmd = settings.read_messages ? 'off' : 'on';
            statusText += `3. *Read All Messages*: ${settings.read_messages ? 'On' : 'Off'}\n   - Command: \`.settings readmessages ${readmessagesCmd}\`\n\n`;

            // 4. Read Commands Only
            const readcommandCmd = settings.read_command ? 'off' : 'on';
            statusText += `4. *Read Commands Only*: ${settings.read_command ? 'On' : 'Off'}\n   - Command: \`.settings readcommand ${readcommandCmd}\`\n\n`;

            // 5. Auto React
            const autoreactCmd = settings.auto_react ? 'off' : 'on';
            statusText += `5. *Auto React*: ${settings.auto_react ? 'On' : 'Off'}\n   - Command: \`.settings autoreact ${autoreactCmd}\`\n\n`;

            // 6. Auto Block PM
            const autoblockCmd = settings.auto_block ? 'off' : 'on';
            statusText += `6. *Auto Block PM*: ${settings.auto_block ? 'On' : 'Off'}\n   - Command: \`.settings autoblock ${autoblockCmd}\`\n\n`;
            
            // 7. Anti Delete
            const antideleteCmd = settings.anti_delete ? 'off' : 'on';
            statusText += `7. *Anti Delete*: ${settings.anti_delete ? 'On' : 'Off'}\n   - Command: \`.settings antidelete ${antideleteCmd}\`\n`;


            return sock.sendMessage(msg.key.remoteJid, { text: statusText }, { quoted: msg });
        }

        // Logic for updating a setting
        const key = settingKeys[subCommand.toLowerCase()];
        if (!key) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Invalid setting command. Use *.settings* to see available options.` }, { quoted: msg });
        }

        if (!value) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Please provide a value for '${subCommand}'. Use 'on' or 'off'.` }, { quoted: msg });
        }

        let finalValue;
        if (key === 'bot_mode') {
            if (!validModes.includes(value.toLowerCase())) {
                return sock.sendMessage(msg.key.remoteJid, { text: `Invalid mode. Use one of: ${validModes.join(', ')}` }, { quoted: msg });
            }
            finalValue = value.toLowerCase();
        } else {
            if (!validOptions.includes(value.toLowerCase())) {
                return sock.sendMessage(msg.key.remoteJid, { text: `Invalid option. Use 'on' or 'off'.` }, { quoted: msg });
            }
            finalValue = value.toLowerCase() === 'on';
        }

        updateSetting(key, finalValue);
        await sock.sendMessage(msg.key.remoteJid, { text: `*Success!* Setting '${subCommand}' has been updated to *${value.toUpperCase()}*.` }, { quoted: msg });
    }
};
