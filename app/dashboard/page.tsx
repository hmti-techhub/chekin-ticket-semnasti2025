"use client";

import TableDashboard from "@/components/TableDashboard";
import { teamData } from "@/lib";
import { useMounted } from "@/lib/useMounted";
import Image from "next/image";
import { useState } from "react";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const mounted = useMounted();
  if (!mounted) return null;

  const itemsPerPage = 10;

  const filteredData = teamData.filter((team) => {
    const matchName = team.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ? true : statusFilter === "present" ? team.present : !team.present;

    return matchName && matchStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main className="relative w-full min-h-screen flex flex-col items-center bg-[#110c2a] font-sans">
      <Image
        src="/tech-element.svg"
        alt="left"
        width={240}
        height={350}
        className="h-4/5 w-auto rotate-180 absolute left-0 z-0 opacity-40"
      />
      <Image
        src="/tech-element.svg"
        alt="right"
        width={240}
        height={350}
        className="h-4/5 w-auto absolute right-0 z-0 opacity-40"
      />

      <div className="w-full min-h-screen p-14 bg-linear-to-r from-[#17D3FD]/20 to-[#CD3DFF]/20 backdrop-blur-sm relative z-10">
        <h1 className="text-6xl text-transparent bg-clip-text bg-linear-to-t from-gray-400 to-white uppercase font-bold font-stormfaze text-center">
          SEMNASTI 2025
        </h1>

        <h2 className="text-gray-200 text-xl mt-2 text-center font-plus-jakarta-sans">
          Dashboard Presensi & Registrasi Ulang Peserta
        </h2>

        <div className="max-w-7xl mx-auto mt-10 rounded-2xl bg-[#181138] border border-[#17D3FD]/30 shadow-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
            <h2 className="text-3xl font-bold font-plus-jakarta-sans">Team List</h2>

            <div className="flex gap-4">
              <button className="px-6 py-2 border border-green-400 text-green-300 hover:bg-green-500/20 transition">
                Generate QR Codes for All Teams
              </button>
              <button className="px-6 py-2 border border-red-400 text-red-300 hover:bg-red-500/20 transition">
                Delete All Teams
              </button>
              <button className="px-6 py-2 border border-blue-400 text-blue-300 hover:bg-blue-500/20 transition">
                Upload Data
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-6 font-plus-jakarta-sans">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none"
            >
              <option value="all">Semua</option>
              <option value="present">Hadir</option>
              <option value="absent">Tidak Hadir</option>
            </select>

            <input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none"
            />
          </div>

          <div className="mt-6 overflow-x-auto font-plus-jakarta-sans">
            <TableDashboard filteredData={paginatedData} />
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-gray-200 font-plus-jakarta-sans">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage === 1
                    ? "border-gray-600 text-gray-600 cursor-not-allowed"
                    : "border-[#17D3FD]/40 text-[#17D3FD] hover:bg-[#17D3FD]/10"
                }`}
              >
                Prev
              </button>

              {/* Page numbers */}
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md border transition-all ${
                        currentPage === page
                          ? "bg-[#17D3FD]/20 border-[#17D3FD] text-[#17D3FD] font-semibold"
                          : "border-gray-600 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage === totalPages
                    ? "border-gray-600 text-gray-600 cursor-not-allowed"
                    : "border-[#17D3FD]/40 text-[#17D3FD] hover:bg-[#17D3FD]/10"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
