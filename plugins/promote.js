import { addAdmin } from '../lib/permissions.js';
import config from '../config.js';

export default {
    command: 'promote',
    description: 'Promotes a user to admin.',
    permission: 'admin', // UPDATED: Admins සහ Owners ලාට භාවිතා කළ හැක
    
    async run(sock, msg, args, userRole, reloadAdmins) {
        let targetUser;
        // Check if a user is mentioned
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Check if the command is a reply to another message
        else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetUser = msg.message.extendedTextMessage.contextInfo.participant;
        } else {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user or reply to a message to promote.' }, { quoted: msg });
        }

        const targetNumber = targetUser.split('@')[0];

        if (config.ownerNumbers.includes(targetNumber)) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'This user is an owner and cannot be promoted.' }, { quoted: msg });
        }

        const success = addAdmin(targetNumber);

        if (success) {
            reloadAdmins(); // Reload the admin list in index.js
            await sock.sendMessage(msg.key.remoteJid, { text: `*Success!* @${targetNumber} has been promoted to admin.`, mentions: [targetUser] }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: `@${targetNumber} is already an admin.`, mentions: [targetUser] }, { quoted: msg });
        }
    }
};
