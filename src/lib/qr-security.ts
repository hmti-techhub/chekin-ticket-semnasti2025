import crypto from 'crypto';

/**
 * Generate a secure hash for QR code
 * Combines unique ID with timestamp and random salt for security
 */
export function generateQRHash(uniqueId: string): string {
    const timestamp = Date.now().toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const data = `${uniqueId}-${timestamp}-${salt}`;

    const hash = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');

    console.log('🔐 [QR Hash] Generated new hash:', {
        uniqueId,
        timestamp,
        saltLength: salt.length,
        hashPreview: hash.substring(0, 16) + '...',
        fullHashLength: hash.length
    });

    return hash;
}

/**
 * Create a secure QR code payload
 * Format: uniqueId|hash
 */
export function createSecureQRPayload(uniqueId: string, hash: string): string {
    const payload = `${uniqueId}|${hash}`;

    console.log('📦 [QR Payload] Created secure payload:', {
        uniqueId,
        hashPreview: hash.substring(0, 16) + '...',
        payloadLength: payload.length
    });

    return payload;
}

/**
 * Parse QR code payload
 * Returns null if format is invalid
 */
export function parseQRPayload(payload: string): { uniqueId: string; hash: string } | null {
    console.log('🔍 [QR Parse] Parsing payload:', {
        payloadPreview: payload.substring(0, 50) + (payload.length > 50 ? '...' : ''),
        payloadLength: payload.length
    });

    const parts = payload.split('|');

    if (parts.length !== 2) {
        console.warn('⚠️ [QR Parse] Invalid payload format:', {
            expectedParts: 2,
            actualParts: parts.length,
            payload: payload.substring(0, 100)
        });
        return null;
    }

    const result = {
        uniqueId: parts[0],
        hash: parts[1]
    };

    console.log('✅ [QR Parse] Successfully parsed:', {
        uniqueId: result.uniqueId,
        hashPreview: result.hash.substring(0, 16) + '...',
        hashLength: result.hash.length
    });

    return result;
}

/**
 * Validate if QR hash matches the stored hash
 */
export function validateQRHash(providedHash: string, storedHash: string | null | undefined): boolean {
    console.log('🔒 [QR Validate] Validating hash:', {
        providedHashPreview: providedHash.substring(0, 16) + '...',
        storedHashPreview: storedHash ? storedHash.substring(0, 16) + '...' : 'null',
        storedHashExists: !!storedHash
    });

    if (!storedHash) {
        console.warn('❌ [QR Validate] Validation failed: No stored hash (QR already used or invalid)');
        return false;
    }

    const isValid = providedHash === storedHash;

    if (isValid) {
        console.log('✅ [QR Validate] Hash validation successful');
    } else {
        console.warn('❌ [QR Validate] Hash mismatch:', {
            providedHashPreview: providedHash.substring(0, 16) + '...',
            storedHashPreview: storedHash.substring(0, 16) + '...',
            providedLength: providedHash.length,
            storedLength: storedHash.length
        });
    }

    return isValid;
}
