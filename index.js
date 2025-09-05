import baileysModule from '@whiskeysockets/baileys';
import config from './config.js';
import { loadAdmins } from './lib/permissions.js';
import { getSettings } from './lib/settings.js';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// --- Baileys Functions Setup ---
const makeWASocket = baileysModule.default;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    isJidGroup,
    isJidStatusBroadcast,
    downloadContentFromMessage // Import for anti-delete
} = baileysModule;

// --- ES Module Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Global Variables ---
const plugins = new Map();
const messageStore = new Map(); // To store recent messages for anti-delete
const SESSION_FOLDER = 'auth_info_baileys';
let adminNumbers = [];

// --- Helper Functions ---
async function loadPlugins() {
    console.log('[PLUGIN] Loading plugins...');
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) { fs.mkdirSync(pluginsDir); return; }
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        try {
            const module = await import(path.toNamespacedPath(path.join(pluginsDir, file)));
            const plugin = module.default;

            if (plugin.commands && Array.isArray(plugin.commands)) {
                plugin.commands.forEach(command => {
                    plugins.set(command, plugin);
                    console.log(`[PLUGIN] ✔ Loaded command '${command}' from ${file}`);
                });
            } else if (plugin.command && typeof plugin.run === 'function') {
                plugins.set(plugin.command, plugin);
                console.log(`[PLUGIN] ✔ Loaded command '${plugin.command}' from ${file}`);
            }
        } catch (error) { console.error(`[ERR] Error loading plugin from file ${file}:`, error); }
    }
}

function reloadAdmins() {
    adminNumbers = loadAdmins();
    console.log('[PERMS] Reloaded admins. Current admins:', adminNumbers.length);
}

// Helper to convert stream to buffer for anti-delete
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};


// --- Main Bot Function ---
async function startBot() {
    await loadPlugins();
    reloadAdmins();

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

    const sock = makeWASocket({
        version: (await fetchLatestBaileysVersion()).version,
        printQRInTerminal: false,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Safari'),
        // This is necessary for anti-delete to work properly
        getMessage: async (key) => {
            if (messageStore.has(key.id)) {
                return messageStore.get(key.id);
            }
            // Fallback to a default empty message object if not found
            return { conversation: '' };
        }
    });

    // --- Pairing Code Logic (from old version) ---
    if (!sock.authState.creds.registered) {
        let phoneNumber = config.pairCodeNumber;
        if (!phoneNumber) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (text) => new Promise((resolve) => rl.question(text, resolve));
            phoneNumber = await question('Please enter your bot\'s WhatsApp number (e.g., 94771234567): ');
            rl.close();
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        console.log(`[PAIRING] Requesting pairing code for: ${phoneNumber}`);
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`[PAIRING CODE] Your Pairing Code is: ${code}`);
            } catch (error) { console.error('[ERR] Failed to request pairing code:', error); }
        }, 3000);
    }

    // --- Event Handlers ---
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('[AUTH] Device Logged Out. Please delete the "auth_info_baileys" folder and restart.');
                process.exit();
            } else {
                console.log('Connection closed. Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log(`[SUCCESS] Mahasona MD is now online! Bot Number: ${sock.user.id.split(':')[0]}`);
            await sock.sendMessage(sock.user.id, {
                image: { url: 'https://database.mizta-x.com/temp_links/1755270982146_1755270982146.image' },
                caption: `*👑 𝙃𝙚𝙡𝙡𝙤𝙬, 𝙄 𝙢 𝘼𝙡𝙞𝙫𝙚 𝙉𝙤𝙬💥*

┏━━━━━━━━━━━━━━━━
┃👺 \`ʙᴏᴛ ɴᴀᴍᴇ\` : මහසොනා MD
┃👾 \`ᴠᴇʀsɪᴏɴ\` : 0.1
┃🐓 \`ᴘʟᴀᴛғᴏʀᴍ\` : ...
┃👹 \`ᴏᴡɴᴇʀ: MAHASONA\`
┗━━━━━━━━━━━━━━𖣔𖣔
🦠 *𝙄𝙈 MAHASONA-𝙈𝘿* 𝙒𝙃𝘼𝙏𝙎𝘼𝙋𝙋 𝘽𝙊𝙏🤖.𝙎𝙄𝙈𝙋𝙇𝙀 𝙅𝘼𝙑𝘼 𝙎𝘾𝙍𝙄𝙋𝙏 𝘽𝙊𝙏⚙️. 
=====================

❶ || \`WELCOME TO GOST LAND\`
▬▬▬▬▬▬▬▬▬▬▬▬
❷ || \`BOT OWNER\`: 94768073555
▬▬▬▬▬▬▬▬▬▬▬▬▬▬

> *MAHASONA-MD*
*POWER BY MAHASONA*`
            });
        }
    });

    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from);
                await sock.sendMessage(call.from, { text: `Sorry, I am a bot and cannot answer calls. Your call has been rejected.` });
                console.log(`[CALL] Rejected call from ${call.from}`);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        // Store every message for anti-delete
        if (msg.key) {
            messageStore.set(msg.key.id, msg);
        }

        /*Code From Menaka Nilupul - https://nightwabot.site */
        
        // --- ANTI-DELETE LOGIC ---
        const settings = getSettings();
        if (settings.anti_delete && msg.message?.protocolMessage?.type === 'REVOKE') {
            const deletedKey = msg.message.protocolMessage.key;
            const originalMsg = messageStore.get(deletedKey.id);

            if (originalMsg) {
                const deletedBy = (msg.key.participant || msg.key.remoteJid).split('@')[0];
                const originalSender = (originalMsg.key.participant || originalMsg.key.remoteJid).split('@')[0];
                const botNumber = sock.user?.id.split(':')[0];

                // Don't act on deletions by the bot itself
                if (deletedBy.includes(botNumber) || originalSender.includes(botNumber)) {
                    return;
                }

                const jid = msg.key.remoteJid;
                const caption = `🚫 *Message Deleted* 🚫\n\n🚮 *Deleted by:* @${deletedBy}\n📩 *Sent by:* @${originalSender}`;
                
                try {
                    const originalMsgType = Object.keys(originalMsg.message)[0];
                    const originalContent = originalMsg.message[originalMsgType];
                    let resendContent = {};

                    if (originalMsg.message.conversation || originalMsg.message.extendedTextMessage) {
                        const text = originalMsg.message.conversation || originalMsg.message.extendedTextMessage.text;
                        resendContent = { text: `${caption}\n\n> ${text}` };
                    } else if (originalMsg.message.imageMessage) {
                        const stream = await downloadContentFromMessage(originalContent, 'image');
                        const buffer = await streamToBuffer(stream);
                        resendContent = { image: buffer, caption: caption };
                    } else if (originalMsg.message.videoMessage) {
                        const stream = await downloadContentFromMessage(originalContent, 'video');
                        const buffer = await streamToBuffer(stream);
                        resendContent = { video: buffer, caption: caption };
                    } else {
                         // Fallback for other types like stickers, audio etc.
                        await sock.sendMessage(jid, { text: caption, mentions: [msg.key.participant, originalMsg.key.participant] });
                        await sock.copyNForward(jid, originalMsg, false);
                        return;
                    }
                    
                    await sock.sendMessage(jid, { ...resendContent, mentions: [msg.key.participant, originalMsg.key.participant] });

                } catch (error) {
                    console.error('[ERR] Anti-Delete failed:', error);
                    // If forwarding fails, just send the notification text
                    await sock.sendMessage(jid, { text: caption, mentions: [msg.key.participant, originalMsg.key.participant] });
                }
            }
            return; // Stop further processing for delete messages
        }


        // --- REGULAR MESSAGE PROCESSING ---
        if (!msg.message) return;

        const jid = msg.key.remoteJid;

        if (isJidStatusBroadcast(jid)) {
            if (settings.auto_read_status) { await sock.readMessages([msg.key]); }
            return;
        }

        const isGroup = isJidGroup(jid);
        const senderJid = msg.key.fromMe ? sock.user.id : (isGroup ? msg.key.participant : jid);

        if (!senderJid) {
            console.log(`[WARN] Could not determine sender for a message in ${jid}. Ignoring.`);
            return;
        }

        const senderNumber = senderJid.split('@')[0].split(':')[0];
        const botNumber = sock.user?.id.split(':')[0];

        let userRole = 'user';
        if (config.ownerNumbers.includes(senderNumber)) {
            userRole = 'owner';
        } else if (adminNumbers.includes(senderNumber) || senderNumber === botNumber) {
            userRole = 'admin';
        }

        if (!msg.key.fromMe) {
            if (settings.auto_block && !isGroup && userRole === 'user') {
                await sock.sendMessage(jid, { text: 'Sorry, I do not accept private messages.' });
                await sock.updateBlockStatus(jid, 'block');
                return;
            }
            if (settings.auto_react) {
                const randomEmojis = ['👍', '❤️', '😂', '😮', '😊', '🙏', '✨', '🎉'];
                const reaction = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
                await sock.sendMessage(jid, { react: { text: reaction, key: msg.key } });
            }
        }

        if (settings.bot_mode === 'private' && isGroup) return;
        if (settings.bot_mode === 'group_only' && !isGroup) return;

        if (settings.read_messages) { await sock.readMessages([msg.key]); }

        const messageType = Object.keys(msg.message)[0];
        const text = (messageType === 'conversation') ? msg.message.conversation : (messageType === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';

        if (!text || !text.startsWith(config.prefix)) return;

        const args = text.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const plugin = plugins.get(command);

        if (plugin) {
            if (settings.read_command && !settings.read_messages) { await sock.readMessages([msg.key]); }

            const requiredPermission = plugin.permission || 'public';
            let hasPermission = false;

            if (userRole === 'owner') hasPermission = true;
            else if (userRole === 'admin' && (requiredPermission === 'admin' || requiredPermission === 'public')) hasPermission = true;
            else if (userRole === 'user' && requiredPermission === 'public') hasPermission = true;

            if (hasPermission) {
                try {
                    await plugin.run(sock, msg, args, userRole, reloadAdmins);
                } catch (error) {
                    console.error(`[ERR] Error executing command '${command}':`, error);
                    await sock.sendMessage(jid, { text: 'An error occurred while running the command.' }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(jid, { text: `*Permission Denied!*\n\nYou do not have permission to use the '.${command}' command.` }, { quoted: msg });
            }
        }
    });
}

// --- Start the Bot ---
startBot();

/*https://nightwabot.site*/
