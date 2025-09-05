import baileys from '@whiskeysockets/baileys';
import config from '../config.js';

const { downloadContentFromMessage } = baileys;

export default {
    commands: ['view', 'oneview', 'reveal'],
    description: 'Reveals a "view once" message by re-sending it.',
    permission: 'public',

    async run(sock, msg, args) {
        const jid = msg.key.remoteJid;

        // 1. Reply කර ඇති පණිවිඩය ලබාගැනීම
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(jid, { text: 'Please reply to a "view once" image or video to use this command.' }, { quoted: msg });
        }

        // --- THE FIX IS HERE ---
        // Media වර්ගය සහ එහි අන්තර්ගතය නිවැරදිව හඳුනාගැනීම
        let messageContent;
        let messageType;

        if (quoted.imageMessage && quoted.imageMessage.viewOnce) {
            messageContent = quoted.imageMessage;
            messageType = 'imageMessage';
        } else if (quoted.videoMessage && quoted.videoMessage.viewOnce) {
            messageContent = quoted.videoMessage;
            messageType = 'videoMessage';
        } else {
            return sock.sendMessage(jid, { text: 'The replied message is not a valid "view once" message. Please reply directly to the disappearing photo/video.' }, { quoted: msg });
        }
        
        try {
            // 3. Media එක download කිරීම
            const stream = await downloadContentFromMessage(
                messageContent,
                messageType.replace('Message', '') // 'imageMessage' -> 'image'
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 4. Download කරගත් media එක නැවත යැවීම
            const caption = `✅ Here is the "view once" content.\n\n> *${config.botName}*`;

            if (messageType === 'imageMessage') {
                await sock.sendMessage(jid, { image: buffer, caption: caption }, { quoted: msg });
            } else if (messageType === 'videoMessage') {
                await sock.sendMessage(jid, { video: buffer, caption: caption }, { quoted: msg });
            }

        } catch (error) {
            console.error("[ERR] View Once Plugin:", error);
            await sock.sendMessage(jid, { text: 'Failed to reveal the "view once" message. It may have expired or a network error occurred.' }, { quoted: msg });
        }
    }
};
