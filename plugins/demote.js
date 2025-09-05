import { removeAdmin } from '../lib/permissions.js';

export default {
    command: 'demote',
    description: 'Demotes an admin back to a user.',
    permission: 'owner', // Only owners can use this
    
    async run(sock, msg, args, userRole, reloadAdmins) {
        let targetUser;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetUser = msg.message.extendedTextMessage.contextInfo.participant;
        } else {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user or reply to a message to demote.' }, { quoted: msg });
        }

        const targetNumber = targetUser.split('@')[0];
        const success = removeAdmin(targetNumber);

        if (success) {
            reloadAdmins(); // Reload the admin list
            await sock.sendMessage(msg.key.remoteJid, { text: `*Success!* @${targetNumber} has been demoted.`, mentions: [targetUser] }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: `@${targetNumber} is not an admin.`, mentions: [targetUser] }, { quoted: msg });
        }
    }
};
