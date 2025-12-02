"use client";

import { useState } from "react";
import { FaTimes, FaUserPlus } from "react-icons/fa";

interface ManualRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export default function ManualRegistrationModal({
    isOpen,
    onClose,
    onSuccess,
    onError,
}: ManualRegistrationModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            onError("Nama dan email harus diisi");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/participants/manual", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setName("");
                setEmail("");
                onSuccess();
                onClose();
            } else {
                onError(data.error || "Gagal menambahkan peserta");
            }
        } catch (error) {
            console.error("Manual registration error:", error);
            onError("Terjadi kesalahan saat menambahkan peserta");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setName("");
            setEmail("");
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#181138] border border-[#17D3FD]/30 rounded-2xl shadow-2xl shadow-[#CD3DFF]/20 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#17D3FD]/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17D3FD] to-[#CD3DFF] flex items-center justify-center">
                            <FaUserPlus className="text-white text-lg" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Tambah Peserta Manual</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name Input */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                            placeholder="Masukkan nama lengkap"
                            className="w-full px-4 py-3 bg-[#0f0b24] border border-[#17D3FD]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#17D3FD] focus:ring-2 focus:ring-[#17D3FD]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="contoh@email.com"
                            className="w-full px-4 py-3 bg-[#0f0b24] border border-[#17D3FD]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#17D3FD] focus:ring-2 focus:ring-[#17D3FD]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Info Text */}
                    <div className="bg-[#0f0b24] border border-[#17D3FD]/10 rounded-lg p-4">
                        <p className="text-sm text-gray-400">
                            <span className="text-[#17D3FD] font-semibold">Info:</span> Peserta akan didaftarkan dengan tanggal registrasi hari ini.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-300 rounded-lg font-semibold hover:bg-[#17D3FD]/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#17D3FD] to-[#CD3DFF] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#CD3DFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menambahkan...</span>
                                </>
                            ) : (
                                <>
                                    <FaUserPlus />
                                    <span>Tambah Peserta</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
