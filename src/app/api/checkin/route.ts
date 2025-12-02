import { getParticipantByUniqueId, updateParticipant } from "@/lib/db";
import { parseQRPayload, validateQRHash } from "@/lib/qr-security";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { unique, type = 'qrcode' } = await request.json();

    console.log('📥 [Check-in API] Received check-in request:', { type });

    if (!unique) {
      console.warn('⚠️ [Check-in API] Missing unique ID in request');
      return NextResponse.json({ error: "Unique ID is required" }, { status: 400 });
    }

    // Validate type parameter
    if (type !== 'qrcode' && type !== 'code') {
      console.warn('⚠️ [Check-in API] Invalid type parameter:', type);
      return NextResponse.json({ error: "Type must be 'qrcode' or 'code'" }, { status: 400 });
    }

    let uniqueId: string;
    let hash: string | undefined;

    // Handle QR code type - requires hash validation
    if (type === 'qrcode') {
      const parsed = parseQRPayload(unique);

      if (!parsed) {
        console.warn('❌ [Check-in API] Invalid QR payload format');
        return NextResponse.json({
          error: "QR Code tidak valid atau sudah kadaluarsa. Silakan minta QR code baru.",
          invalidQR: true
        }, { status: 400 });
      }

      uniqueId = parsed.uniqueId;
      hash = parsed.hash;
    } else {
      // Handle manual code type - no hash validation needed
      uniqueId = unique.trim();
      console.log('🔑 [Check-in API] Manual code check-in, skipping hash validation');
    }

    console.log('🔍 [Check-in API] Looking up participant:', uniqueId);
    const participant = await getParticipantByUniqueId(uniqueId);

    if (!participant) {
      console.warn('❌ [Check-in API] Participant not found:', uniqueId);
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    console.log('✅ [Check-in API] Participant found:', { name: participant.name, unique: participant.unique });

    if (participant.present) {
      console.warn('⚠️ [Check-in API] Participant already checked in:', { name: participant.name, unique: participant.unique });
      return NextResponse.json({
        error: "Peserta sudah melakukan check-in sebelumnya",
        alreadyCheckedIn: true,
        participant: {
          name: participant.name,
          unique: participant.unique
        }
      }, { status: 400 });
    }

    // Only validate hash for QR code type
    if (type === 'qrcode' && hash) {
      if (!validateQRHash(hash, participant.qr_hash)) {
        console.warn('❌ [Check-in API] Hash validation failed for:', uniqueId);
        return NextResponse.json({
          error: "QR Code tidak valid atau sudah pernah digunakan. Silakan minta QR code baru.",
          invalidQR: true,
          participant: {
            name: participant.name,
            unique: participant.unique
          }
        }, { status: 400 });
      }
    }

    console.log('🔄 [Check-in API] Processing check-in for:', { name: participant.name, unique: uniqueId, type });

    // For QR code type, invalidate the hash. For manual code, keep the hash intact
    const updateData: any = { present: true };
    if (type === 'qrcode') {
      updateData.qr_hash = null;
      console.log('🔒 [Check-in API] Invalidating QR hash for security');
    }

    const success = await updateParticipant(uniqueId, updateData);

    if (!success) {
      console.error('❌ [Check-in API] Failed to update participant:', uniqueId);
      return NextResponse.json({ error: "Gagal melakukan check-in" }, { status: 500 });
    }

    console.log('✅ [Check-in API] Check-in successful!', {
      name: participant.name,
      unique: uniqueId,
      type,
      hashInvalidated: type === 'qrcode'
    });

    console.log('🎉 [Check-in API] Returning success response for:', participant.name);

    return NextResponse.json({
      message: "Check-in berhasil",
      participant: {
        name: participant.name,
        unique: participant.unique
      }
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
