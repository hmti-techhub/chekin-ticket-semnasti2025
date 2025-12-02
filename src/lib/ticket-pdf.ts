import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

export interface TicketParticipant {
    name: string;
    unique_id: string;
    registered_at?: string | Date | null;
    email: string;
}

export async function generateTicketPDF(participant: TicketParticipant, qrCodeBuffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper to draw centered text
    const drawCenteredText = (text: string, y: number, size: number, fontToUse: PDFFont, color = rgb(0, 0, 0)) => {
        // Basic sanitization to remove unsupported characters (like emojis)
        // pdf-lib standard fonts only support WinAnsi encoding
        const cleanText = text.replace(/[^\x00-\x7F]/g, "").trim();

        const textWidth = fontToUse.widthOfTextAtSize(cleanText, size);
        page.drawText(cleanText, {
            x: (width - textWidth) / 2,
            y,
            size,
            font: fontToUse,
            color,
        });
    };

    // Background
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
    });

    let currentY = height - 50;

    // Header
    drawCenteredText('This is your ticket', currentY, 24, font, rgb(0.125, 0.129, 0.141));
    currentY -= 30;
    drawCenteredText('HMTI UDINUS - Himpunan Mahasiswa Teknik Informatika', currentY, 12, font, rgb(0.37, 0.39, 0.41));
    currentY -= 40;

    // Event Name
    drawCenteredText('SEMNASTI X AORUS Campus Tour', currentY, 20, boldFont, rgb(0.125, 0.129, 0.141));
    currentY -= 30;

    // Location
    drawCenteredText('Universitas Dian Nuswantoro', currentY, 12, font, rgb(0.37, 0.39, 0.41));
    currentY -= 20;
    drawCenteredText('Kompleks Udinus Gedung E, Jl. Nakula 1 No.5-11', currentY, 10, font, rgb(0.37, 0.39, 0.41));
    currentY -= 15;
    drawCenteredText('Lt.3, Pendrikan Kidul, Semarang Tengah', currentY, 10, font, rgb(0.37, 0.39, 0.41));
    currentY -= 30;

    // Date
    drawCenteredText('Event Date: DEC 6, 2025, 8:00 AM (WIB)', currentY, 12, boldFont, rgb(0.37, 0.39, 0.41));
    currentY -= 40;

    // QR Code
    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
    const qrDims = qrImage.scale(0.5); // Adjust scale
    page.drawImage(qrImage, {
        x: (width - qrDims.width) / 2,
        y: currentY - qrDims.height,
        width: qrDims.width,
        height: qrDims.height,
    });
    currentY -= (qrDims.height + 40);

    // Participant Info
    drawCenteredText('ISSUED TO', currentY, 10, boldFont, rgb(0.37, 0.39, 0.41));
    currentY -= 20;
    drawCenteredText(participant.name, currentY, 16, font, rgb(0.125, 0.129, 0.141));
    currentY -= 40;

    drawCenteredText('ORDER NUMBER', currentY, 10, boldFont, rgb(0.37, 0.39, 0.41));
    currentY -= 20;
    drawCenteredText(participant.unique_id, currentY, 16, font, rgb(0.125, 0.129, 0.141));
    currentY -= 40;

    // Ticket Badge
    drawCenteredText('General Admission', currentY, 14, boldFont, rgb(0.11, 0.56, 0.24));
    currentY -= 40;

    drawCenteredText('REGISTERED', currentY, 10, boldFont, rgb(0.37, 0.39, 0.41));
    currentY -= 20;
    const regDate = participant.registered_at
        ? new Date(participant.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
        : 'N/A';
    drawCenteredText(regDate, currentY, 16, font, rgb(0.125, 0.129, 0.141));

    // Footer
    drawCenteredText(`© ${new Date().getFullYear()} HMTI UDINUS - All Rights Reserved.`, 50, 10, font, rgb(0.37, 0.39, 0.41));

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
