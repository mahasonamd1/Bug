import fs from 'fs';
import path from 'path';

// settings.json ගොනුව තිබෙන තැන
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'database', 'settings.json');

// Default settings (පළමු වරට bot එක දමන විට)
const DEFAULT_SETTINGS = {
    bot_mode: 'public',
    auto_read_status: false,
    read_messages: false,
    read_command: false,
    auto_react: false,
    auto_block: false
};

// settings.json ගොනුව ඇත්දැයි බලා, නැත්නම් එය නිර්මාණය කිරීම
function ensureSettingsFile() {
    const dbDir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
        // ගොනුව නැත්නම්, default settings සමඟ එය නිර්මාණය කරනවා
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
}

// settings.json ගොනුවෙන් settings සියල්ල load කරගැනීම
export function getSettings() {
    ensureSettingsFile(); // ගොනුව තියෙනවද බලනවා
    try {
        const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
        // ගොනුවෙන් settings කියවනවා
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
        console.error('[DB-ERR] Error loading settings.json:', error);
        return DEFAULT_SETTINGS;
    }
}

// යම් setting එකක් වෙනස් කර, එය ගොනුවේ save කිරීම
export function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    try {
        // නව settings ටික settings.json ගොනුවට ලියනවා
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('[DB-ERR] Error saving settings.json:', error);
        return false;
    }
}
