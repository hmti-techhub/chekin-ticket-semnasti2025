import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { pool, logEmailSend, updateParticipant } from '@/lib/db';
import { generateQRHash, createSecureQRPayload } from '@/lib/qr-security';
import { generateTicketPDF } from '@/lib/ticket-pdf';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const { uniqueIds } = await req.json();

    if (!uniqueIds || !Array.isArray(uniqueIds) || uniqueIds.length === 0) {
      return NextResponse.json({ error: 'No participants selected' }, { status: 400 });
    }

    // Fetch participants
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM participants WHERE unique_id IN (?)',
      [uniqueIds]
    );

    const participants = rows as any[];

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants found' }, { status: 404 });
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or use host/port from env
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const p of participants) {
      try {
        const qrHash = generateQRHash(p.unique_id);
        await updateParticipant(p.unique_id, { qr_hash: qrHash });
        const securePayload = createSecureQRPayload(p.unique_id, qrHash);

        const qrCodeBuffer = await QRCode.toBuffer(securePayload, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H',
        });

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>This is your ticket - SEMNASTI X AORUS Campus Tour</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Google Sans', 'Roboto', Arial, sans-serif; background-color: #ffffff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
              td { padding: 0; }
              img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header-title { font-size: 32px; font-weight: 400; color: #202124; margin: 0 0 5px 0; line-height: 1.2; }
              .event-name { font-size: 28px; font-weight: 500; color: #202124; margin: 0 0 8px 0; line-height: 1.3; }
              .event-location { font-size: 14px; color: #5f6368; margin: 0 0 15px 0; line-height: 1.5; }
              .event-datetime { font-size: 14px; color: #5f6368; margin: 0 0 30px 0; line-height: 1.5; }
              .section-header { font-size: 11px; font-weight: 500; color: #5f6368; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 8px 0; }
              .section-value { font-size: 16px; color: #202124; margin: 0 0 25px 0; line-height: 1.4; }
              .qr-wrapper { text-align: center; margin: 30px 0; }
              .ticket-badge { display: inline-block; background-color: #e8f5e9; color: #1e8e3e; padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: 500; margin-bottom: 30px; }
              .footer-text { font-size: 12px; color: #5f6368; margin: 30px 0 0 0; text-align: center; }
              @media screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .header-title { font-size: 28px !important; }
                .event-name { font-size: 24px !important; }
              }
            </style>
          </head>
          <body>
            <center style="width: 100%; background-color: #ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 40px 20px;">
                    <table role="presentation" class="container" width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="width: 600px;">
                      <tr>
                        <td style="padding: 0 20px;">
                          <h1 class="header-title">This is your ticket</h1>
                          <p style="font-size: 13px; color: #5f6368; margin: 0 0 25px 0;">HMTI UDINUS - Himpunan Mahasiswa Teknik Informatika</p>
                          
                          <h2 class="event-name">SEMNASTI X AORUS Campus Tour</h2>
                          
                          <p class="event-location">
                            Universitas Dian Nuswantoro<br>
                            Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11 Lt.3, Pendrikan Kidul, Semarang Tengah, Semarang City, Central Java 50131
                          </p>
                          
                          <p class="event-datetime">
                            <strong>Event Date: DEC 6, 2025, 8:00 AM (WIB)</strong>
                          </p>
                          
                          <div class="qr-wrapper">
                            <img src="cid:qrcode" alt="Ticket QR Code" width="280" style="max-width: 100%; height: auto; margin: 0 auto;" />
                          </div>
                          
                          <p class="section-header">ISSUED TO</p>
                          <p class="section-value">${p.name}</p>
                          
                          <p class="section-header">ORDER NUMBER</p>
                          <p class="section-value">${p.unique_id}</p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <span class="ticket-badge">General Admission</span>
                          </div>
                          
                          <p class="section-header">REGISTERED</p>
                          <p class="section-value">${p.registered_at ? new Date(p.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A'}</p>
                          
                          <!-- Instructions Section -->
                          <div style="background-color: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 30px 0; border-radius: 4px;">
                            <p style="font-size: 16px; font-weight: 500; color: #202124; margin: 0 0 15px 0;">How to Use Your Ticket</p>
                            <ol style="margin: 0; padding-left: 20px; color: #5f6368; font-size: 14px; line-height: 1.8;">
                              <li style="margin-bottom: 8px;"><strong>Save this email</strong> or download the attached PDF ticket for offline access</li>
                              <li style="margin-bottom: 8px;"><strong>Arrive at the venue</strong> on DEC 6, 2025 at 8:00 AM (WIB)</li>
                              <li style="margin-bottom: 8px;"><strong>Show your QR code</strong> at the registration desk for check-in</li>
                              <li style="margin-bottom: 0;"><strong>Your order number</strong> (${p.unique_id}) will be verified by our team</li>
                            </ol>
                          </div>
                          
                          <p style="font-size: 13px; color: #5f6368; margin: 20px 0; text-align: center; line-height: 1.6;">
                            <strong>Tip:</strong> You can also download your ticket as a PDF attachment in this email for easy access on your mobile device.
                          </p>
                          
                          <p class="footer-text">
                            © ${new Date().getFullYear()} HMTI UDINUS - All Rights Reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: '"SEMNASTI X AORUS CAMPUS TOUR" <no-reply@semnasti.hmti.udinus@gmail.com>',
          to: p.email,
          subject: 'Your Ticket for SEMNASTI X AORUS CAMPUS TOUR',
          html: htmlContent,
          attachments: [
            {
              filename: 'qrcode.png',
              content: qrCodeBuffer,
              cid: 'qrcode',
            },
            {
              filename: `ticket-${p.unique_id}.pdf`,
              content: await generateTicketPDF(p, qrCodeBuffer),
              contentType: 'application/pdf',
            },
          ],
        });

        successCount++;
        await logEmailSend(p.unique_id, p.email, 'success');
      } catch (err) {
        console.error(`Failed to send email to ${p.email}:`, err);
        failCount++;
        await logEmailSend(p.unique_id, p.email, 'error', err instanceof Error ? err.message : 'Unknown error');
      }
    }

    return NextResponse.json({
      message: `Processed ${participants.length} emails`,
      success: successCount,
      failed: failCount
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
