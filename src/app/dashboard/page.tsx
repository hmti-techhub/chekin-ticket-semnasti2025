"use client";

import TableDashboard from "@/components/TableDashboard";
import { useMounted } from "@/lib/useMounted";
import Image from "next/image";
import { useEffect, useState } from "react";
import UploadModal from "@/components/UploadModal";
import ManualRegistrationModal from "@/components/ManualRegistrationModal";
import EmailProgressModal from "@/components/EmailProgressModal";
import { FaEnvelope, FaTrash, FaUpload, FaDownload, FaSearch, FaUserPlus } from "react-icons/fa";
import Toast from "@/components/Toast";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualRegModalOpen, setIsManualRegModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);

  // Email progress state
  const [emailProgress, setEmailProgress] = useState({
    isOpen: false,
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    isBulk: false
  });

  // Optimistic UI state for checkboxes
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { seminar_kit?: boolean; consumption?: boolean; heavy_meal?: boolean; mission_card?: boolean }>>({});

  const mounted = useMounted();

  // Use real-time participants hook
  const { participants: participantData, isConnected, error: realtimeError, refreshManually } = useRealtimeParticipants();

  // Auto-clear optimistic updates ketika real-time data sudah match
  useEffect(() => {
    if (participantData.length > 0 && Object.keys(optimisticUpdates).length > 0) {
      const newOptimisticUpdates = { ...optimisticUpdates };
      let hasChanges = false;

      participantData.forEach(participant => {
        const optimistic = optimisticUpdates[participant.unique];
        if (optimistic) {
          // Check apakah data real-time sudah match dengan optimistic update
          if (optimistic.seminar_kit !== undefined && participant.seminar_kit === optimistic.seminar_kit) {
            delete newOptimisticUpdates[participant.unique]?.seminar_kit;
            hasChanges = true;
          }
          if (optimistic.consumption !== undefined && participant.consumption === optimistic.consumption) {
            delete newOptimisticUpdates[participant.unique]?.consumption;
            hasChanges = true;
          }
          if (optimistic.heavy_meal !== undefined && participant.heavy_meal === optimistic.heavy_meal) {
            delete newOptimisticUpdates[participant.unique]?.heavy_meal;
            hasChanges = true;
          }
          if (optimistic.mission_card !== undefined && participant.mission_card === optimistic.mission_card) {
            delete newOptimisticUpdates[participant.unique]?.mission_card;
            hasChanges = true;
          }

          // Hapus entry jika sudah kosong
          if (newOptimisticUpdates[participant.unique] && Object.keys(newOptimisticUpdates[participant.unique]).length === 0) {
            delete newOptimisticUpdates[participant.unique];
          }
        }
      });

      if (hasChanges) {
        setOptimisticUpdates(newOptimisticUpdates);
      }
    }
  }, [participantData, optimisticUpdates]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch("/api/email-logs");
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch email logs:", error);
    }
  };

  useEffect(() => {
    // Initial load
    setLoading(false);
    fetchEmailLogs();
  }, []);

  // Show realtime error if any
  useEffect(() => {
    if (realtimeError) {
      showToastMessage(`⚠️ Real-time connection: ${realtimeError}`, "error");
    }
  }, [realtimeError]);

  const handleDeleteAll = async () => {
    if (confirm("Are you sure you want to delete ALL participants? This cannot be undone.")) {
      try {
        const res = await fetch("/api/participants?all=true", { method: "DELETE" });
        if (res.ok) {
          refreshManually();
          alert("All participants deleted successfully.");
        } else {
          alert("Failed to delete participants.");
        }
      } catch (error) {
        console.error("Error deleting participants:", error);
      }
    }
  };

  const handleSendEmail = async () => {
    if (!confirm("Send emails to ALL participants?")) return;

    const allIds = participantData.map(p => p.unique);
    const total = allIds.length;

    // Initialize progress
    setEmailProgress({
      isOpen: true,
      total,
      current: 0,
      success: 0,
      failed: 0,
      isBulk: true
    });

    setSendingEmail(true);

    let successCount = 0;
    let failCount = 0;

    // Send emails one by one to track progress
    for (let i = 0; i < allIds.length; i++) {
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uniqueIds: [allIds[i]] }),
        });

        const data = await res.json();
        if (res.ok && data.success > 0) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error("Error sending email:", error);
        failCount++;
      }

      // Update progress
      setEmailProgress(prev => ({
        ...prev,
        current: i + 1,
        success: successCount,
        failed: failCount
      }));
    }

    setSendingEmail(false);
    fetchEmailLogs();
    showToastMessage(`✅ Email selesai dikirim: ${successCount} berhasil, ${failCount} gagal`, successCount > 0 ? "success" : "error");

    // Auto close modal after 2 seconds
    setTimeout(() => {
      setEmailProgress(prev => ({ ...prev, isOpen: false }));
    }, 2000);
  };

  const handleResendEmail = async (uniqueId: string) => {
    if (!confirm(`Resend email to participant ${uniqueId}?`)) return;

    // Initialize progress for single email
    setEmailProgress({
      isOpen: true,
      total: 1,
      current: 0,
      success: 0,
      failed: 0,
      isBulk: false
    });

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueIds: [uniqueId] }),
      });

      const data = await res.json();

      // Update progress
      setEmailProgress({
        isOpen: true,
        total: 1,
        current: 1,
        success: res.ok && data.success > 0 ? 1 : 0,
        failed: res.ok && data.success > 0 ? 0 : 1,
        isBulk: false
      });

      if (res.ok) {
        showToastMessage(`✅ Email berhasil dikirim ke ${uniqueId}`, "success");
        fetchEmailLogs();
      } else {
        showToastMessage(`❌ Gagal mengirim email: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailProgress(prev => ({
        ...prev,
        current: 1,
        failed: 1
      }));
      showToastMessage("❌ Terjadi kesalahan saat mengirim email", "error");
    }

    // Auto close modal after 2 seconds
    setTimeout(() => {
      setEmailProgress(prev => ({ ...prev, isOpen: false }));
    }, 2000);
  };

  const handleUpdateKitAndSnack = async (uniqueId: string, value: boolean) => {
    // Optimistic update - langsung update UI untuk kedua field
    setOptimisticUpdates(prev => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], seminar_kit: value, consumption: value }
    }));

    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique: uniqueId, seminar_kit: value, consumption: value }),
      });

      if (res.ok) {
        showToastMessage(value ? "✅ Seminar kit & snack ditandai sudah diambil" : "⚠️ Seminar kit & snack ditandai belum diambil", "success");
        // Jangan clear optimistic update, biarkan real-time update yang mengambil alih
        // Ini mencegah flickering
      } else {
        // Rollback jika gagal
        setOptimisticUpdates(prev => {
          const newState = { ...prev };
          if (newState[uniqueId]) {
            delete newState[uniqueId].seminar_kit;
            delete newState[uniqueId].consumption;
            if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
          }
          return newState;
        });
        showToastMessage("❌ Gagal update seminar kit & snack", "error");
      }
    } catch (error) {
      // Rollback jika error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        if (newState[uniqueId]) {
          delete newState[uniqueId].seminar_kit;
          delete newState[uniqueId].consumption;
          if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
        }
        return newState;
      });
      console.error("Error updating seminar kit & snack:", error);
      showToastMessage("❌ Terjadi kesalahan", "error");
    }
  };

  const handleUpdateHeavyMeal = async (uniqueId: string, value: boolean) => {
    // Optimistic update - langsung update UI
    setOptimisticUpdates(prev => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], heavy_meal: value }
    }));

    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique: uniqueId, heavy_meal: value }),
      });

      if (res.ok) {
        showToastMessage(value ? "✅ Makanan berat ditandai sudah diambil" : "⚠️ Makanan berat ditandai belum diambil", "success");
        // Jangan clear optimistic update, biarkan real-time update yang mengambil alih
        // Ini mencegah flickering
      } else {
        // Rollback jika gagal
        setOptimisticUpdates(prev => {
          const newState = { ...prev };
          if (newState[uniqueId]) {
            delete newState[uniqueId].heavy_meal;
            if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
          }
          return newState;
        });
        showToastMessage("❌ Gagal update makanan berat", "error");
      }
    } catch (error) {
      // Rollback jika error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        if (newState[uniqueId]) {
          delete newState[uniqueId].heavy_meal;
          if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
        }
        return newState;
      });
      console.error("Error updating heavy meal:", error);
      showToastMessage("❌ Terjadi kesalahan", "error");
    }
  };

  const handleUpdateMissionCard = async (uniqueId: string, value: boolean) => {
    // Optimistic update - langsung update UI
    setOptimisticUpdates(prev => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], mission_card: value }
    }));

    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique: uniqueId, mission_card: value }),
      });

      if (res.ok) {
        showToastMessage(value ? "✅ Mission card ditandai sudah diambil" : "⚠️ Mission card ditandai belum diambil", "success");
        // Jangan clear optimistic update, biarkan real-time update yang mengambil alih
        // Ini mencegah flickering
      } else {
        // Rollback jika gagal
        setOptimisticUpdates(prev => {
          const newState = { ...prev };
          if (newState[uniqueId]) {
            delete newState[uniqueId].mission_card;
            if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
          }
          return newState;
        });
        showToastMessage("❌ Gagal update mission card", "error");
      }
    } catch (error) {
      // Rollback jika error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        if (newState[uniqueId]) {
          delete newState[uniqueId].mission_card;
          if (Object.keys(newState[uniqueId]).length === 0) delete newState[uniqueId];
        }
        return newState;
      });
      console.error("Error updating mission card:", error);
      showToastMessage("❌ Terjadi kesalahan", "error");
    }
  };

  const handleExport = async (type: 'all' | 'attended' | 'not-attended') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Peserta_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToastMessage('✅ Data berhasil di-export!', 'success');
      } else {
        showToastMessage('❌ Gagal export data', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage('❌ Terjadi kesalahan saat export', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteEmailLog = async (id: number) => {
    if (!confirm('Hapus email log ini?')) return;

    try {
      const res = await fetch(`/api/email-logs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToastMessage('✅ Email log berhasil dihapus', 'success');
        fetchEmailLogs(); // Refresh logs
      } else {
        showToastMessage('❌ Gagal menghapus email log', 'error');
      }
    } catch (error) {
      console.error('Delete email log error:', error);
      showToastMessage('❌ Terjadi kesalahan', 'error');
    }
  };

  const handleDeleteAllEmailLogs = async () => {
    if (!confirm('Hapus SEMUA email log? Tindakan ini tidak dapat dibatalkan!')) return;

    try {
      const res = await fetch('/api/email-logs?all=true', { method: 'DELETE' });
      if (res.ok) {
        showToastMessage('✅ Semua email log berhasil dihapus', 'success');
        fetchEmailLogs(); // Refresh logs
      } else {
        showToastMessage('❌ Gagal menghapus email log', 'error');
      }
    } catch (error) {
      console.error('Delete all email logs error:', error);
      showToastMessage('❌ Terjadi kesalahan', 'error');
    }
  };

  if (!mounted) return null;

  const itemsPerPage = 10;

  const filteredData = participantData.filter((participant) => {
    const searchLower = search.toLowerCase();
    const matchName = participant.name.toLowerCase().includes(searchLower);
    const matchUnique = participant.unique.toLowerCase().includes(searchLower);
    const matchEmail = participant.email.toLowerCase().includes(searchLower);
    const matchSearch = matchName || matchUnique || matchEmail;

    const matchStatus = statusFilter === "all" ? true : statusFilter === "present" ? participant.present : !participant.present;

    return matchSearch && matchStatus;
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

      <div className="w-full min-h-screen px-4 py-8 md:px-8 md:py-10 lg:px-14 lg:py-14 bg-linear-to-r from-[#17D3FD]/20 to-[#CD3DFF]/20 backdrop-blur-sm relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-linear-to-t from-gray-400 to-white uppercase font-bold font-stormfaze text-center">
          SEMNASTI 2025
        </h1>

        <h2 className="text-gray-200 text-base md:text-lg lg:text-xl mt-2 text-center font-plus-jakarta-sans px-4">
          Dashboard Presensi & Registrasi Ulang Peserta
        </h2>

        <div className="max-w-7xl mx-auto mt-6 md:mt-8 lg:mt-10 rounded-xl md:rounded-2xl bg-[#181138] border border-[#17D3FD]/30 shadow-2xl p-4 md:p-6 lg:p-8 text-white">
          <div className="flex flex-col lg:flex-row justify-between gap-4 lg:gap-6 items-start lg:items-center">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <h2 className="text-2xl md:text-3xl font-bold font-plus-jakarta-sans">Participant List</h2>
              {/* Real-time connection indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-300">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
              <button
                onClick={() => setIsManualRegModalOpen(true)}
                className="px-3 md:px-4 lg:px-6 py-2 md:py-2.5 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 transition flex items-center justify-center gap-2 rounded-lg text-sm md:text-base whitespace-nowrap"
              >
                <FaUserPlus className="text-sm" /> <span className="hidden sm:inline">Tambah Manual</span><span className="sm:hidden">Manual</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 md:px-4 lg:px-6 py-2 md:py-2.5 border border-blue-400 text-blue-300 hover:bg-blue-500/20 transition flex items-center justify-center gap-2 rounded-lg text-sm md:text-base whitespace-nowrap"
              >
                <FaUpload className="text-sm" /> <span className="hidden sm:inline">Upload Data</span><span className="sm:hidden">Upload</span>
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="px-3 md:px-4 lg:px-6 py-2 md:py-2.5 border border-green-400 text-green-300 hover:bg-green-500/20 transition flex items-center justify-center gap-2 rounded-lg text-sm md:text-base whitespace-nowrap disabled:opacity-50"
              >
                <FaEnvelope className="text-sm" /> <span className="hidden sm:inline">{sendingEmail ? "Sending..." : "Send Emails"}</span><span className="sm:hidden">Email</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-3 md:px-4 lg:px-6 py-2 md:py-2.5 border border-red-400 text-red-300 hover:bg-red-500/20 transition flex items-center justify-center gap-2 rounded-lg text-sm md:text-base whitespace-nowrap"
              >
                <FaTrash className="text-sm" /> <span className="hidden sm:inline">Delete All</span><span className="sm:hidden">Delete</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative col-span-2 lg:col-span-1">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="w-full lg:w-auto px-3 md:px-4 lg:px-6 py-2 md:py-2.5 border border-purple-400 text-purple-300 hover:bg-purple-500/20 transition flex items-center justify-center gap-2 rounded-lg text-sm md:text-base whitespace-nowrap disabled:opacity-50"
                >
                  <FaDownload className="text-sm" /> {exporting ? "Exporting..." : "Export Data"}
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-full lg:w-56 bg-[#0f0b24] border border-purple-400/30 rounded-lg shadow-xl z-20">
                    <button
                      onClick={() => {
                        handleExport('all');
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition flex items-center gap-2 text-gray-200 rounded-t-lg text-sm md:text-base"
                    >
                      <FaDownload className="text-purple-400 text-sm" /> Semua Peserta
                    </button>
                    <button
                      onClick={() => {
                        handleExport('attended');
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition flex items-center gap-2 text-gray-200 text-sm md:text-base"
                    >
                      <FaDownload className="text-green-400 text-sm" /> Peserta Hadir
                    </button>
                    <button
                      onClick={() => {
                        handleExport('not-attended');
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition flex items-center gap-2 text-gray-200 rounded-b-lg text-sm md:text-base"
                    >
                      <FaDownload className="text-red-400 text-sm" /> Peserta Tidak Hadir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6 font-plus-jakarta-sans">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 md:py-3 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none text-sm md:text-base focus:border-[#17D3FD]/60 transition"
            >
              <option value="all">Semua</option>
              <option value="present">Hadir</option>
              <option value="absent">Tidak Hadir</option>
            </select>

            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by name, unique code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 md:pl-11 pr-4 py-2.5 md:py-3 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none placeholder:text-gray-500 focus:border-[#17D3FD]/60 transition text-sm md:text-base"
              />
            </div>
          </div>

          {/* Search Results Info */}
          {search && (
            <div className="mt-4 text-sm text-gray-400 font-plus-jakarta-sans">
              Menampilkan <span className="text-[#17D3FD] font-semibold">{filteredData.length}</span> hasil untuk "{search}"
            </div>
          )}

          {/* Info Note */}
          <div className="mt-4 p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2 md:gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs md:text-sm text-gray-300 font-plus-jakarta-sans">
              <span className="font-semibold text-green-300">Info:</span> Nama peserta dengan <span className="px-2 py-0.5 bg-green-500/30 rounded text-green-300 font-semibold">background hijau</span> menandakan email tiket sudah berhasil terkirim.
            </div>
          </div>

          <div className="mt-6 overflow-x-auto font-plus-jakarta-sans">
            {loading ? (
              <p className="text-center text-gray-400">Loading data...</p>
            ) : (
              <TableDashboard
                filteredData={paginatedData.map((p) => {
                  const optimistic = optimisticUpdates[p.unique] || {};
                  return {
                    ...p,
                    registered_at: p.registered_at || '',
                    seminar_kit: optimistic.seminar_kit !== undefined ? optimistic.seminar_kit : (p.seminar_kit || false),
                    consumption: optimistic.consumption !== undefined ? optimistic.consumption : (p.consumption || false),
                    heavy_meal: optimistic.heavy_meal !== undefined ? optimistic.heavy_meal : (p.heavy_meal || false),
                    mission_card: optimistic.mission_card !== undefined ? optimistic.mission_card : (p.mission_card || false),
                  };
                })}
                emailLogs={emailLogs}
                onResend={handleResendEmail}
                onUpdateKitAndSnack={handleUpdateKitAndSnack}
                onUpdateHeavyMeal={handleUpdateHeavyMeal}
                onUpdateMissionCard={handleUpdateMissionCard}
              />
            )}
          </div>
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-gray-200 font-plus-jakarta-sans">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border ${currentPage === 1
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
                      className={`px-3 py-1 rounded-md border transition-all ${currentPage === page
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
                className={`px-4 py-2 rounded-lg border ${currentPage === totalPages
                  ? "border-gray-600 text-gray-600 cursor-not-allowed"
                  : "border-[#17D3FD]/40 text-[#17D3FD] hover:bg-[#17D3FD]/10"
                  }`}
              >
                Next
              </button>
            </div>
          )}
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={refreshManually}
          />
          <ManualRegistrationModal
            isOpen={isManualRegModalOpen}
            onClose={() => setIsManualRegModalOpen(false)}
            onSuccess={() => {
              showToastMessage('✅ Peserta berhasil ditambahkan!', 'success');
              refreshManually();
            }}
            onError={(message) => showToastMessage(`❌ ${message}`, 'error')}
          />
        </div>

        {/* Email History Section */}
        <div className="max-w-7xl mx-auto mt-6 md:mt-8 rounded-xl md:rounded-2xl bg-[#181138] border border-[#17D3FD]/30 shadow-2xl p-4 md:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-plus-jakarta-sans">Email History</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleDeleteAllEmailLogs}
                disabled={emailLogs.length === 0}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTrash className="text-xs" />
                <span>Delete All</span>
              </button>
              <button
                onClick={() => setShowEmailHistory(!showEmailHistory)}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <span>{showEmailHistory ? 'Sembunyikan' : 'Tampilkan'}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showEmailHistory ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {showEmailHistory && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-plus-jakarta-sans">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 px-4">Waktu</th>
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Unique ID</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Error</th>
                    <th className="pb-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        Belum ada email yang dikirim
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {new Date(log.sent_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-sm">{log.email}</td>
                        <td className="py-3 px-4 text-sm font-mono text-blue-300">
                          {log.participant_unique_id}
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'success' ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
                              ✓ Success
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold">
                              ✗ Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-red-300">
                          {log.error_message || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteEmailLog(log.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-xs transition flex items-center gap-1"
                          >
                            <FaTrash className="text-xs" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Toast message={toastMessage} type={toastType} show={showToast} />
      <EmailProgressModal
        isOpen={emailProgress.isOpen}
        total={emailProgress.total}
        current={emailProgress.current}
        success={emailProgress.success}
        failed={emailProgress.failed}
        isBulk={emailProgress.isBulk}
      />
    </main>
  );
}
