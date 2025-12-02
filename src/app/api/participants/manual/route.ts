import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { name, email } = await req.json();

        // Validasi input
        if (!name || !email) {
            return NextResponse.json({
                error: 'Nama dan email harus diisi'
            }, { status: 400 });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                error: 'Format email tidak valid'
            }, { status: 400 });
        }

        // Cek apakah email sudah terdaftar
        const [existingEmail] = await pool.query(
            'SELECT unique_id FROM participants WHERE email = ?',
            [email]
        );

        if ((existingEmail as any[]).length > 0) {
            return NextResponse.json({
                error: 'Email sudah terdaftar'
            }, { status: 400 });
        }

        // Ambil semua unique_id yang sudah ada
        const [existingRows] = await pool.query('SELECT unique_id FROM participants');
        const existingIds = new Set<string>(
            (existingRows as any[]).map(row => row.unique_id)
        );

        // Generate unique ID (000-299)
        let uniqueIdSuffix: string;
        let attempts = 0;
        const maxAttempts = 300;

        do {
            const randomNum = Math.floor(Math.random() * 300);
            uniqueIdSuffix = randomNum.toString().padStart(3, '0');
            attempts++;

            if (attempts >= maxAttempts) {
                return NextResponse.json({
                    error: 'Tidak ada ID unik yang tersedia (range 000-299 penuh)'
                }, { status: 500 });
            }
        } while (existingIds.has(`SEMNASTI2025-${uniqueIdSuffix}`));

        const uniqueId = `SEMNASTI2025-${uniqueIdSuffix}`;

        // Dapatkan tanggal saat ini dalam format MySQL DATETIME
        const now = new Date();
        const registeredAt = now.toISOString().slice(0, 19).replace('T', ' ');

        // Insert peserta baru
        await pool.query(
            'INSERT INTO participants (unique_id, name, email, present, registered_at) VALUES (?, ?, ?, ?, ?)',
            [uniqueId, name, email, false, registeredAt]
        );

        return NextResponse.json({
            message: 'Peserta berhasil ditambahkan',
            participant: {
                unique_id: uniqueId,
                name,
                email,
                registered_at: registeredAt
            }
        });

    } catch (error) {
        console.error('Manual registration error:', error);
        return NextResponse.json({
            error: 'Gagal menambahkan peserta',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
