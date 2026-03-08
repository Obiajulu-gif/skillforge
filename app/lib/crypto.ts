import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
    const secret = process.env.ENCRYPTION_KEY || 'default_secret_key_for_dev_mode_only_12345';
    return createHash('sha256').update(secret).digest();
}

export function encrypt(text: string): { iv: string; encryptedData: string; authTag: string } {
    const iv = randomBytes(16);
    const key = getKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag
    };
}

export function decrypt(encryptedData: string, iv: string, authTag: string): string {
    const key = getKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
