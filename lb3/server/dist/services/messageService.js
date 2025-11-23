import fs from 'node:fs/promises';
import path from 'node:path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const MESSAGES_PATH = path.join(__dirname, '../../data/messages.json');
export async function getMessages() {
    try {
        const data = await fs.readFile(MESSAGES_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export async function addMessage(message) {
    const messages = await getMessages();
    messages.push(message);
    await fs.writeFile(MESSAGES_PATH, JSON.stringify(messages, null, 2));
    return message;
}
