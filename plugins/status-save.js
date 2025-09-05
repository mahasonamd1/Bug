import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import config from '../config.js'; // Assuming you might want to use config later

/**
 * Converts a readable stream into a Buffer.
 * @param {ReadableStream} stream - The stream to convert.
 * @returns {Promise<Buffer>} - A promise that resolves with the Buffer.
 */
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

export default {
    commands: ['save', 'statusdl'],
    description: 'Downloads a replied-to WhatsApp status (image or video).',
    permission: 'public', // Set permission to public so everyone can use it

    /**
     * The main function that runs when the command is triggered.
     * @param {object} sock - The WhatsApp socket connection.
     * @param {object} msg - The message object.
     * @param {Array<string>} args - The command arguments.
     */
    async run(sock, msg, args) {
        const jid = msg.key.remoteJid;
        // Correctly access the quoted message from the message context
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // Check if the user is replying to a message
        if (!quotedMsg) {
            return sock.sendMessage(jid, { text: 'Please reply to a status with the `.save` command.' }, { quoted: msg });
        }

        // Determine the type of the quoted message (image or video)
        const messageType = Object.keys(quotedMsg)[0];
        if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
            return sock.sendMessage(jid, { text: 'This command only works when replying to a status with an image or video.' }, { quoted: msg });
        }

        let statusMsg;
        try {
            // Send a "downloading" message to the user
            statusMsg = await sock.sendMessage(jid, { text: '📥 Downloading status...' }, { quoted: msg });
            const editStatus = (text) => sock.sendMessage(jid, { text, edit: statusMsg.key });

            const mediaContent = quotedMsg[messageType];
            const mediaTypeString = messageType.replace('Message', '');

            // Download the media content from the message
            const stream = await downloadContentFromMessage(mediaContent, mediaTypeString);
            const buffer = await streamToBuffer(stream);

            const caption = `✅ Status saved successfully!\n\n> *${config.botName}*`;

            // Send the downloaded media back to the user
            if (mediaTypeString === 'image') {
                await sock.sendMessage(jid, { image: buffer, caption: caption }, { quoted: msg });
            } else if (mediaTypeString === 'video') {
                await sock.sendMessage(jid, { video: buffer, caption: caption }, { quoted: msg });
            }

            // Delete the "downloading" message
            await sock.sendMessage(jid, { delete: statusMsg.key });

        } catch (error) {
            console.error('[ERR] Status Save Plugin:', error);
            const errorMessage = 'Sorry, I could not save that status. This might happen with older statuses that are no longer on WhatsApp\'s servers.';
            // Edit the status message to show an error if something went wrong
            if (statusMsg) {
                await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
            } else {
                await sock.sendMessage(jid, { text: errorMessage }, { quoted: msg });
            }
        }
    }
};
