const crypto = require('crypto');
require('dotenv').config();

const algorithm = 'aes-256-cbc';

// Ensure AES_SECRET_KEY exists and is exactly 32 bytes.
// If it doesn't exist, we generate a secure random one for development.
// In production, MUST define AES_SECRET_KEY in .env
let keyStr = process.env.AES_SECRET_KEY;
let key;

if (!keyStr || keyStr.length < 32) {
    console.warn("⚠️ AES_SECRET_KEY is missing or invalid in .env! Using a temporary random key. Passwords encrypted during this session will be lost if the server restarts.");
    key = crypto.randomBytes(32);
} else {
    // Truncate or pad to exactly 32 bytes just in case
    key = Buffer.from(keyStr.padEnd(32, '0').slice(0, 32));
}

exports.encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Return as a stringified JSON object containing iv and encryptedData
    return JSON.stringify({
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    });
};

exports.decrypt = (encryptedJsonStr) => {
    if (!encryptedJsonStr) return null;
    try {
        const text = JSON.parse(encryptedJsonStr);
        let iv = Buffer.from(text.iv, 'hex');
        let encryptedText = Buffer.from(text.encryptedData, 'hex');
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("AES Decryption error:", e);
        return null;
    }
};
