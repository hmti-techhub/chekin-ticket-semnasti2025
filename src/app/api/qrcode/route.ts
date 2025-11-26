import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateQRHash, createSecureQRPayload } from "@/lib/qr-security";
import { updateParticipant } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unique = searchParams.get("unique");

  console.log('📥 [QR API] Received QR generation request:', { unique });

  if (!unique) {
    console.warn('⚠️ [QR API] Missing unique ID in request');
    return NextResponse.json({ error: "Unique ID is required" }, { status: 400 });
  }

  try {
    console.log('🔄 [QR API] Starting QR generation process for:', unique);

    const qrHash = generateQRHash(unique);
    await updateParticipant(unique, { qr_hash: qrHash });

    console.log('💾 [QR API] Hash saved to database for:', unique);

    const securePayload = createSecureQRPayload(unique, qrHash);
    const qrCodeDataUrl = await QRCode.toDataURL(securePayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    console.log('✅ [QR API] QR code generated successfully for:', unique);

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('❌ [QR API] QR generation error:', error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
