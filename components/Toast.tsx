"use client";

export default function Toast({ message, type, show }: { message: string; type: "success" | "error"; show: boolean }) {
  return (
    <div
      className={`fixed font-plus-jakarta-sans bottom-6 max-w-sm w-full right-6 z-50 flex flex-col px-5 py-4 rounded-md border transition-all duration-500 ${
        show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      } ${type === "success" ? "bg-green-500 border-green-400 text-white" : "bg-red-500 border-red-400 text-white"}`}
    >
      <h1 className="font-medium">{type === "success" ? "Presensi Berhasil" : "Presensi Gagal"}</h1>
      <p className="text-sm">Halo {message}, Selamat Datang di SEMNASTI 2025</p>
    </div>
  );
}
