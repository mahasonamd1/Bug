import { loadAdmins } from '../lib/permissions.js';
import config from '../config.js';

export default {
    command: 'admins',
    description: 'Lists all current owners and admins.',
    permission: 'public', // ඕනෑම කෙනෙකුට ලැයිස්තුව බැලිය හැක

    async run(sock, msg, args) {
        // Bot ගේම අංකය ලබාගැනීම
        const botNumber = sock.user?.id.split(':')[0];

        // admins.json ගොනුවෙන් admin ලා ලබාගැනීම
        const fileAdmins = loadAdmins();

        // එකම අංකය දෙපාරක් list වීම වැළැක්වීමට Set එකක් භාවිතා කිරීම
        // පළමුව, හිමිකරුවන් (owners) එකතු කිරීම
        const allAdmins = new Set(config.ownerNumbers);

        // දෙවනුව, bot ගේ අංකය එකතු කිරීම
        if (botNumber) {
            allAdmins.add(botNumber);
        }

        // තෙවනුව, admins.json ගොනුවේ සිටින admin ලා එකතු කිරීම
        fileAdmins.forEach(admin => allAdmins.add(admin));

        // නැවත Set එක Array එකක් බවට පත් කිරීම
        const adminList = Array.from(allAdmins);

        if (adminList.length === 0) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'There are currently no owners or admins.' }, { quoted: msg });
        }

        let adminListText = '*👑 Owners & Admins 👑*\n\n';
        const mentions = [];

        // ලැයිස්තුව සකස් කිරීම
        adminList.forEach((admin, index) => {
            let role = 'Admin'; // Default role
            if (config.ownerNumbers.includes(admin)) {
                role = 'Owner';
            } else if (admin === botNumber) {
                role = 'Bot';
            }
            adminListText += `${index + 1}. @${admin} - *[${role}]*\n`;
            mentions.push(`${admin}@s.whatsapp.net`);
        });

        // සකස් කල ලැයිස්තුව mention සමග යැවීම
        await sock.sendMessage(msg.key.remoteJid, { text: adminListText, mentions: mentions }, { quoted: msg });
    }
};
