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
    // Normalize payload: trim whitespace and remove any potential encoding issues
    const normalizedPayload = payload.trim().replace(/\s+/g, '');

    console.log('🔍 [QR Parse] Parsing payload:', {
        originalLength: payload.length,
        normalizedLength: normalizedPayload.length,
        payloadPreview: normalizedPayload.substring(0, 50) + (normalizedPayload.length > 50 ? '...' : ''),
    });

    const parts = normalizedPayload.split('|');

    if (parts.length !== 2) {
        console.warn('⚠️ [QR Parse] Invalid payload format:', {
            expectedParts: 2,
            actualParts: parts.length,
            payload: normalizedPayload.substring(0, 100)
        });
        return null;
    }

    const result = {
        uniqueId: parts[0].trim(),
        hash: parts[1].trim()
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
        providedHashLength: providedHash.length,
        storedHashPreview: storedHash ? storedHash.substring(0, 16) + '...' : 'null',
        storedHashLength: storedHash?.length || 0,
        storedHashExists: !!storedHash
    });

    if (!storedHash) {
        console.warn('❌ [QR Validate] Validation failed: No stored hash (QR already used or invalid)');
        return false;
    }

    // Normalize both hashes to ensure comparison works
    const normalizedProvided = providedHash.trim();
    const normalizedStored = storedHash.trim();

    const isValid = normalizedProvided === normalizedStored;

    if (isValid) {
        console.log('✅ [QR Validate] Hash validation successful');
    } else {
        console.warn('❌ [QR Validate] Hash mismatch:', {
            providedHashPreview: normalizedProvided.substring(0, 16) + '...',
            storedHashPreview: normalizedStored.substring(0, 16) + '...',
            providedLength: normalizedProvided.length,
            storedLength: normalizedStored.length,
            firstDiffIndex: [...normalizedProvided].findIndex((char, i) => char !== normalizedStored[i])
        });
    }

    return isValid;
}
