import { getParticipantByUniqueId, updateParticipant } from "@/lib/db";
import { parseQRPayload, validateQRHash } from "@/lib/qr-security";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { unique } = await request.json();

    console.log('📥 [Check-in API] Received check-in request');

    if (!unique) {
      console.warn('⚠️ [Check-in API] Missing unique ID in request');
      return NextResponse.json({ error: "Unique ID is required" }, { status: 400 });
    }

    const parsed = parseQRPayload(unique);

    if (!parsed) {
      console.warn('❌ [Check-in API] Invalid QR payload format');
      return NextResponse.json({
        error: "QR Code tidak valid atau sudah kadaluarsa. Silakan minta QR code baru.",
        invalidQR: true
      }, { status: 400 });
    }

    const { uniqueId, hash } = parsed;

    console.log('🔍 [Check-in API] Looking up participant:', uniqueId);
    const participant = await getParticipantByUniqueId(uniqueId);

    if (!participant) {
      console.warn('❌ [Check-in API] Participant not found:', uniqueId);
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    console.log('✅ [Check-in API] Participant found:', { name: participant.name, unique: participant.unique });

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

    console.log('🔄 [Check-in API] Processing check-in for:', { name: participant.name, unique: uniqueId });

    const success = await updateParticipant(uniqueId, {
      present: true,
      qr_hash: null
    });

    if (!success) {
      console.error('❌ [Check-in API] Failed to update participant:', uniqueId);
      return NextResponse.json({ error: "Gagal melakukan check-in" }, { status: 500 });
    }

    console.log('✅ [Check-in API] Check-in successful! Hash invalidated for:', { name: participant.name, unique: uniqueId });

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
