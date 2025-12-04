"use client";

import { useState } from "react";
import { FaTimes, FaUserPlus, FaUser, FaEnvelope, FaInfoCircle } from "react-icons/fa";

interface ManualRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function ManualRegistrationModal({ isOpen, onClose, onSuccess, onError }: ManualRegistrationModalProps) {
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
    <div
      className="fixed h-screen inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative bg-gradient-to-br from-[#181138]/95 to-[#0f0b24]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-md transform animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full blur-md opacity-50" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <FaUserPlus className="text-white text-lg" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tambah Peserta</h2>
              <p className="text-xs text-gray-400 mt-0.5">Registrasi manual peserta baru</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="group relative w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <FaTimes className="text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-300">
              Nama Lengkap
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaUser className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Masukkan nama lengkap"
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="contoh@email.com"
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
            <div className="relative flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <FaInfoCircle className="text-cyan-400 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Peserta akan didaftarkan dengan tanggal registrasi <span className="text-cyan-300 font-semibold">hari ini</span>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex-1 px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-semibold overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus className="text-lg" />
                    <span>Tambah Peserta</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
