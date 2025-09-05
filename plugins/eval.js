import util from 'util';

export default {
    // ඔබ ලබාදුන් command නම්
    commands: ['>', '=>', 'eval'],
    description: 'Executes JavaScript code on the server. (Owner only)',
    permission: 'owner', // ownerOnly: true වෙනුවට අපගේ පද්ධතියේ permission භාවිතා කිරීම

    // execute වෙනුවට අපගේ පද්ධතියේ run function එක භාවිතා කිරීම
    async run(sock, msg, args, userRole, reloadAdmins) {
        const jid = msg.key.remoteJid;
        const codeToExecute = args.join(' ');

        if (!codeToExecute) {
            return sock.sendMessage(jid, { text: 'Please provide some code to execute.' }, { quoted: msg });
        }

        try {
            // ඔබගේ කේතයේ ඇති async IIFE (Immediately Invoked Function Expression) ක්‍රමය
            // මෙමගින් eval එක තුල await භාවිතා කිරීමට ඉඩ සලසයි.
            const result = await eval(`(async () => { ${codeToExecute} })()`);

            // util.inspect මගින් ප්‍රතිඵලය format කිරීම
            let output = util.inspect(result, { depth: null });

            // සාර්ථක ප්‍රතිඵලය නැවත යැවීම
            await sock.sendMessage(jid, { text: `✅ *Result:*\n\`\`\`${output}\`\`\`` }, { quoted: msg });

        } catch (e) {
            // දෝෂයක් ඇති වුවහොත්, එය format කර නැවත යැවීම
            let errorOutput = util.inspect(e, { depth: null });
            await sock.sendMessage(jid, { text: `❌ *Error:*\n\`\`\`${errorOutput}\`\`\`` }, { quoted: msg });
        }
    }
};
