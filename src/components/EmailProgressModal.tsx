interface EmailProgressModalProps {
    isOpen: boolean;
    total: number;
    current: number;
    success: number;
    failed: number;
    isBulk: boolean;
}

export default function EmailProgressModal({
    isOpen,
    total,
    current,
    success,
    failed,
    isBulk
}: EmailProgressModalProps) {
    if (!isOpen) return null;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const isComplete = current >= total;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#181138] border border-[#17D3FD]/30 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {isComplete ? '✅ Email Terkirim!' : '📧 Mengirim Email...'}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base">
                        {isBulk ? 'Bulk Email' : 'Single Email'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Progress</span>
                        <span className="font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#17D3FD] to-[#CD3DFF] transition-all duration-300 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>{current} / {total}</span>
                        <span>{total - current} tersisa</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{success}</div>
                        <div className="text-xs text-gray-400 mt-1">Berhasil</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-400">{failed}</div>
                        <div className="text-xs text-gray-400 mt-1">Gagal</div>
                    </div>
                </div>

                {/* Loading Animation */}
                {!isComplete && (
                    <div className="flex justify-center items-center gap-2 text-gray-400 text-sm">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[#17D3FD] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#17D3FD] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#17D3FD] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span>Mohon tunggu...</span>
                    </div>
                )}

                {/* Complete Message */}
                {isComplete && (
                    <div className="text-center text-sm text-gray-300">
                        <p>Proses pengiriman email selesai!</p>
                        <p className="text-xs text-gray-400 mt-1">Modal akan tertutup otomatis</p>
                    </div>
                )}
            </div>
        </div>
    );
}
