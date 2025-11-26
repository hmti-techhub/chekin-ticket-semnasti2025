# QR Security Logging Guide

## Overview
Sistem logging telah ditambahkan pada semua proses hashing dan validasi QR code untuk memudahkan debugging dan monitoring.

## Log Format

Semua log menggunakan emoji prefix untuk memudahkan identifikasi:
- 🔐 = Hash generation
- 📦 = Payload creation
- 🔍 = Parsing/lookup
- 🔒 = Validation
- ✅ = Success
- ❌ = Error/Failed
- ⚠️ = Warning
- 📥 = Incoming request
- 💾 = Database operation
- 🔄 = Processing
- 🎉 = Final success

## Log Categories

### 1. QR Hash Generation (`generateQRHash`)

**Location:** `src/lib/qr-security.ts`

**Log Output:**
```
🔐 [QR Hash] Generated new hash: {
  uniqueId: 'SEMNASTI2025-123',
  timestamp: '1732654324000',
  saltLength: 32,
  hashPreview: 'a1b2c3d4e5f6g7h8...',
  fullHashLength: 64
}
```

**Information:**
- `uniqueId`: Participant unique ID
- `timestamp`: Unix timestamp saat generate
- `saltLength`: Panjang random salt (32 chars)
- `hashPreview`: 16 karakter pertama hash
- `fullHashLength`: Total panjang hash (64 chars)

### 2. Secure Payload Creation (`createSecureQRPayload`)

**Location:** `src/lib/qr-security.ts`

**Log Output:**
```
📦 [QR Payload] Created secure payload: {
  uniqueId: 'SEMNASTI2025-123',
  hashPreview: 'a1b2c3d4e5f6g7h8...',
  payloadLength: 89
}
```

**Information:**
- `uniqueId`: Participant unique ID
- `hashPreview`: 16 karakter pertama hash
- `payloadLength`: Total panjang payload (uniqueId + | + hash)

### 3. Payload Parsing (`parseQRPayload`)

**Location:** `src/lib/qr-security.ts`

**Success Log:**
```
🔍 [QR Parse] Parsing payload: {
  payloadPreview: 'SEMNASTI2025-123|a1b2c3d4e5f6g7h8...',
  payloadLength: 89
}

✅ [QR Parse] Successfully parsed: {
  uniqueId: 'SEMNASTI2025-123',
  hashPreview: 'a1b2c3d4e5f6g7h8...',
  hashLength: 64
}
```

**Error Log:**
```
⚠️ [QR Parse] Invalid payload format: {
  expectedParts: 2,
  actualParts: 1,
  payload: 'SEMNASTI2025-123'
}
```

### 4. Hash Validation (`validateQRHash`)

**Location:** `src/lib/qr-security.ts`

**Success Log:**
```
🔒 [QR Validate] Validating hash: {
  providedHashPreview: 'a1b2c3d4e5f6g7h8...',
  storedHashPreview: 'a1b2c3d4e5f6g7h8...',
  storedHashExists: true
}

✅ [QR Validate] Hash validation successful
```

**Error Log (No Stored Hash):**
```
🔒 [QR Validate] Validating hash: {
  providedHashPreview: 'a1b2c3d4e5f6g7h8...',
  storedHashPreview: 'null',
  storedHashExists: false
}

❌ [QR Validate] Validation failed: No stored hash (QR already used or invalid)
```

**Error Log (Hash Mismatch):**
```
❌ [QR Validate] Hash mismatch: {
  providedHashPreview: 'a1b2c3d4e5f6g7h8...',
  storedHashPreview: 'x9y8z7w6v5u4t3s2...',
  providedLength: 64,
  storedLength: 64
}
```

### 5. QR Generation API

**Location:** `src/app/api/qrcode/route.ts`

**Log Flow:**
```
📥 [QR API] Received QR generation request: { unique: 'SEMNASTI2025-123' }

🔄 [QR API] Starting QR generation process for: SEMNASTI2025-123

🔐 [QR Hash] Generated new hash: {...}

📦 [QR Payload] Created secure payload: {...}

💾 [QR API] Hash saved to database for: SEMNASTI2025-123

✅ [QR API] QR code generated successfully for: SEMNASTI2025-123
```

**Error Log:**
```
⚠️ [QR API] Missing unique ID in request

❌ [QR API] QR generation error: [error details]
```

### 6. Check-in API

**Location:** `src/app/api/checkin/route.ts`

**Success Flow:**
```
📥 [Check-in API] Received check-in request

🔍 [QR Parse] Parsing payload: {...}

✅ [QR Parse] Successfully parsed: {...}

🔍 [Check-in API] Looking up participant: SEMNASTI2025-123

✅ [Check-in API] Participant found: { name: 'John Doe', unique: 'SEMNASTI2025-123' }

🔒 [QR Validate] Validating hash: {...}

✅ [QR Validate] Hash validation successful

🔄 [Check-in API] Processing check-in for: { name: 'John Doe', unique: 'SEMNASTI2025-123' }

✅ [Check-in API] Check-in successful! Hash invalidated for: { name: 'John Doe', unique: 'SEMNASTI2025-123' }

🎉 [Check-in API] Returning success response for: John Doe
```

**Error Flows:**

**Missing Unique ID:**
```
📥 [Check-in API] Received check-in request
⚠️ [Check-in API] Missing unique ID in request
```

**Invalid Payload:**
```
📥 [Check-in API] Received check-in request
🔍 [QR Parse] Parsing payload: {...}
⚠️ [QR Parse] Invalid payload format: {...}
❌ [Check-in API] Invalid QR payload format
```

**Participant Not Found:**
```
🔍 [Check-in API] Looking up participant: SEMNASTI2025-999
❌ [Check-in API] Participant not found: SEMNASTI2025-999
```

**Hash Validation Failed:**
```
✅ [Check-in API] Participant found: {...}
🔒 [QR Validate] Validating hash: {...}
❌ [QR Validate] Validation failed: No stored hash (QR already used or invalid)
❌ [Check-in API] Hash validation failed for: SEMNASTI2025-123
```

**Already Checked In:**
```
✅ [Check-in API] Participant found: {...}
✅ [QR Validate] Hash validation successful
⚠️ [Check-in API] Participant already checked in: { name: 'John Doe', unique: 'SEMNASTI2025-123' }
```

## Monitoring Best Practices

### 1. Development
Semua log akan muncul di console terminal saat `npm run dev`:
```bash
npm run dev
```

### 2. Production
Untuk production, gunakan logging service seperti:
- Vercel Logs (jika deploy di Vercel)
- CloudWatch (jika deploy di AWS)
- Google Cloud Logging (jika deploy di GCP)

### 3. Filtering Logs
Gunakan grep untuk filter log tertentu:

**Hanya QR generation:**
```bash
npm run dev | grep "\[QR"
```

**Hanya Check-in:**
```bash
npm run dev | grep "\[Check-in"
```

**Hanya errors:**
```bash
npm run dev | grep "❌"
```

**Hanya success:**
```bash
npm run dev | grep "✅"
```

## Common Issues & Solutions

### Issue 1: Hash Mismatch
**Log:**
```
❌ [QR Validate] Hash mismatch
```

**Penyebab:**
- QR code lama (sebelum regenerate)
- Database tidak sync

**Solusi:**
- Generate QR baru via "Resend Email"
- Check database untuk hash yang tersimpan

### Issue 2: No Stored Hash
**Log:**
```
❌ [QR Validate] Validation failed: No stored hash
```

**Penyebab:**
- QR sudah pernah di-scan (hash di-set null)
- Participant belum pernah generate QR

**Solusi:**
- Generate QR baru via "Resend Email"

### Issue 3: Invalid Payload Format
**Log:**
```
⚠️ [QR Parse] Invalid payload format
```

**Penyebab:**
- QR code format lama (tanpa hash)
- QR code corrupt

**Solusi:**
- Generate QR baru
- Pastikan QR code tidak rusak

## Log Analysis Examples

### Example 1: Successful Check-in
```
📥 [Check-in API] Received check-in request
🔍 [QR Parse] Parsing payload: { payloadLength: 89 }
✅ [QR Parse] Successfully parsed: { uniqueId: 'SEMNASTI2025-123' }
🔍 [Check-in API] Looking up participant: SEMNASTI2025-123
✅ [Check-in API] Participant found: { name: 'John Doe' }
🔒 [QR Validate] Validating hash: { storedHashExists: true }
✅ [QR Validate] Hash validation successful
🔄 [Check-in API] Processing check-in for: { name: 'John Doe' }
✅ [Check-in API] Check-in successful! Hash invalidated
🎉 [Check-in API] Returning success response for: John Doe
```

**Analysis:** Normal flow, semua tahap berhasil.

### Example 2: Duplicate Scan Attempt
```
📥 [Check-in API] Received check-in request
🔍 [QR Parse] Parsing payload: { payloadLength: 89 }
✅ [QR Parse] Successfully parsed: { uniqueId: 'SEMNASTI2025-123' }
🔍 [Check-in API] Looking up participant: SEMNASTI2025-123
✅ [Check-in API] Participant found: { name: 'John Doe' }
🔒 [QR Validate] Validating hash: { storedHashExists: false }
❌ [QR Validate] Validation failed: No stored hash
❌ [Check-in API] Hash validation failed for: SEMNASTI2025-123
```

**Analysis:** QR sudah pernah di-scan, hash sudah di-invalidate (null).

### Example 3: Old QR Code
```
📥 [Check-in API] Received check-in request
🔍 [QR Parse] Parsing payload: { payloadLength: 25 }
⚠️ [QR Parse] Invalid payload format: { expectedParts: 2, actualParts: 1 }
❌ [Check-in API] Invalid QR payload format
```

**Analysis:** QR code format lama (hanya uniqueId, tanpa hash).

## Performance Monitoring

Monitor waktu eksekusi untuk setiap tahap:

```javascript
// Example: Add timing logs
const startTime = Date.now();
const hash = generateQRHash(uniqueId);
console.log(`⏱️ Hash generation took: ${Date.now() - startTime}ms`);
```

## Security Monitoring

Monitor untuk suspicious activity:

1. **Multiple Failed Attempts**
   - Banyak hash validation failed dari IP yang sama
   - Possible brute force attack

2. **Rapid QR Generation**
   - Banyak QR generation request dalam waktu singkat
   - Possible abuse

3. **Pattern Anomalies**
   - Check-in di luar jam event
   - Unusual geographic patterns

## Troubleshooting Checklist

- [ ] Check terminal logs untuk error messages
- [ ] Verify database connection
- [ ] Check participant exists in database
- [ ] Verify qr_hash column exists
- [ ] Check QR code format (should have | separator)
- [ ] Verify hash length (should be 64 chars)
- [ ] Check if participant already checked in
- [ ] Verify timestamp is reasonable

## Additional Resources

- Main Documentation: `QR_SECURITY.md`
- Database Schema: `src/lib/db.ts`
- QR Security Utils: `src/lib/qr-security.ts`
- API Routes: `src/app/api/qrcode/route.ts`, `src/app/api/checkin/route.ts`
