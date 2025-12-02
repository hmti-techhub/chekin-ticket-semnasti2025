import { NextRequest, NextResponse } from 'next/server';
import { getEmailLogs, deleteEmailLog, deleteAllEmailLogs } from '@/lib/db';

export async function GET() {
    try {
        const logs = await getEmailLogs({ limit: 50 }); // Get last 50 logs
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch email logs:', error);
        return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get('id');
        const all = searchParams.get('all');

        // Delete all email logs
        if (all === 'true') {
            await deleteAllEmailLogs();
            return NextResponse.json({ message: 'All email logs deleted successfully' });
        }

        // Delete single email log
        if (!id) {
            return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
        }

        const success = await deleteEmailLog(parseInt(id));

        if (success) {
            return NextResponse.json({ message: 'Email log deleted successfully' });
        } else {
            return NextResponse.json({ error: 'Email log not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Failed to delete email log:', error);
        return NextResponse.json({ error: 'Failed to delete email log' }, { status: 500 });
    }
}
