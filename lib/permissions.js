import fs from 'fs';
import path from 'path';

const ADMINS_FILE_PATH = path.join(process.cwd(), 'database', 'admins.json');

// Ensure the database directory exists
function ensureDbDirectory() {
    const dbDir = path.dirname(ADMINS_FILE_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

// Load admin numbers from the JSON file
export function loadAdmins() {
    ensureDbDirectory();
    if (!fs.existsSync(ADMINS_FILE_PATH)) {
        return [];
    }
    try {
        const data = fs.readFileSync(ADMINS_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[DB-ERR] Error loading admins.json:', error);
        return [];
    }
}

// Save admin numbers to the JSON file
function saveAdmins(admins) {
    ensureDbDirectory();
    try {
        fs.writeFileSync(ADMINS_FILE_PATH, JSON.stringify(admins, null, 2));
    } catch (error) {
        console.error('[DB-ERR] Error saving admins.json:', error);
    }
}

// Add a new admin
export function addAdmin(number) {
    const admins = loadAdmins();
    if (!admins.includes(number)) {
        admins.push(number);
        saveAdmins(admins);
        return true;
    }
    return false;
}

// Remove an admin
export function removeAdmin(number) {
    let admins = loadAdmins();
    if (admins.includes(number)) {
        admins = admins.filter(admin => admin !== number);
        saveAdmins(admins);
        return true;
    }
    return false;
}
