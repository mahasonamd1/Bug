import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../config.js';

/**
 * Creates the API request parameters for instatiktok.com.
 * @param {string} text - The TikTok URL.
 * @returns {object} - The site URL and the form data.
 */
function createApiRequest(text) {
    const SITE_URL = 'https://instatiktok.com/';
    const form = new URLSearchParams();
    form.append('url', text);
    form.append('platform', 'tiktok');
    form.append('siteurl', SITE_URL);
    return { SITE_URL, form };
}

/**
 * Fetches download links from the API response.
 * @param {string} text - The TikTok URL.
 * @returns {Promise<Array<string>|null>} - An array of download links or null on failure.
 */
async function fetchDownloadLinks(text) {
    try {
        const { SITE_URL, form } = createApiRequest(text);
        const res = await axios.post(`${SITE_URL}api`, form.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': SITE_URL,
                'Referer': SITE_URL,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const html = res?.data?.html;
        if (!html || res?.data?.status !== 'success') {
            return null;
        }

        const $ = cheerio.load(html);
        const links = [];
        $('a.btn[href^="http"]').each((_, el) => {
            const link = $(el).attr('href');
            if (link && !links.includes(link)) {
                links.push(link);
            }
        });
        return links.length > 0 ? links : null;
    } catch (error) {
        console.error("[ERR] fetchDownloadLinks failed:", error.message);
        return null;
    }
}

/**
 * Selects the best download link from the results.
 * @param {Array<string>} links - The array of links.
 * @returns {string|null} - The best available download link.
 */
function getDownloadLink(links) {
    if (!links || links.length === 0) return null;
    return links.find(link => /hdplay/.test(link)) || links[0];
}

// --- Main Plugin ---
export default {
    commands: ['tiktok', 'ttdl', 'tiktokdl', 'tiktoknowm'],
    description: 'Downloads a TikTok video without a watermark.',
    permission: 'public', // Everyone can use this command
    
    async run(sock, msg, args) { // Changed from 'execute' to 'run'
        const text = args[0];
        const jid = msg.key.remoteJid;

        if (!text || !/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) {
            return sock.sendMessage(jid, { text: 'Please provide a valid TikTok URL.\nExample: `.tiktok https://vt.tiktok.com/ZS6pwFLBM/`' }, { quoted: msg });
        }

        let statusMsg;
        try {
            statusMsg = await sock.sendMessage(jid, { text: '📥 Processing your link...' }, { quoted: msg });
            const editStatus = (text) => sock.sendMessage(jid, { text, edit: statusMsg.key });

            const links = await fetchDownloadLinks(text);
            if (!links) {
                return editStatus('❌ Failed to get download links. The service may be down or the URL is invalid.');
            }

            const downloadUrl = getDownloadLink(links);
            if (!downloadUrl) {
                return editStatus('❌ Could not find a valid download link from the results.');
            }

            const caption = `✅ Video downloaded successfully!\n\n> *${config.botName}*`;
            await sock.sendMessage(jid, { video: { url: downloadUrl }, caption: caption }, { quoted: msg });
            await sock.sendMessage(jid, { delete: statusMsg.key });

        } catch (error) {
            console.error("[ERR] TikTok Download Plugin:", error);
            const errorMessage = 'An unexpected error occurred. Please try again later.';
            if (statusMsg) {
                await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
            } else {
                await sock.sendMessage(jid, { text: errorMessage }, { quoted: msg });
            }
        }
    }
};
