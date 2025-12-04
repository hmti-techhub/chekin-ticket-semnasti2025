"use client";

import TableDashboard from "@/components/TableDashboard";
import { useMounted } from "@/lib/useMounted";
import Image from "next/image";
import { useEffect, useState } from "react";
import UploadModal from "@/components/UploadModal";
import ManualRegistrationModal from "@/components/ManualRegistrationModal";
import EditParticipantModal from "@/components/EditParticipantModal";
import EmailProgressModal from "@/components/EmailProgressModal";
import { FaEnvelope, FaTrash, FaUpload, FaDownload, FaSearch, FaUserPlus, FaUsers, FaTimes } from "react-icons/fa";
import Toast from "@/components/Toast";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualRegModalOpen, setIsManualRegModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 30;

  useEffect(() => {
    if (isManualRegModalOpen || isUploadModalOpen || isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isManualRegModalOpen, isUploadModalOpen, isEditModalOpen]);

  // Email progress state
  const [emailProgress, setEmailProgress] = useState({
    isOpen: false,
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    isBulk: false,
  });

  // Optimistic UI state for checkboxes
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, { seminar_kit?: boolean; consumption?: boolean; heavy_meal?: boolean; mission_card?: boolean }>
  >({});

  const mounted = useMounted();

  // Use real-time participants hook
  const { participants: participantData, isConnected, error: realtimeError, refreshManually } = useRealtimeParticipants();

  // Auto-clear optimistic updates ketika real-time data sudah match
  useEffect(() => {
    if (participantData.length > 0 && Object.keys(optimisticUpdates).length > 0) {
      const newOptimisticUpdates = { ...optimisticUpdates };
      let hasChanges = false;

      participantData.forEach((participant) => {
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

  // Auto-reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

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

  const handleDeleteParticipant = async (unique: string) => {
    if (!confirm(`Are you sure you want to delete participant ${unique}?`)) return;

    try {
      const res = await fetch(`/api/participants?unique=${unique}`, { method: "DELETE" });
      if (res.ok) {
        showToastMessage("✅ Participant deleted successfully", "success");
        refreshManually();
      } else {
        showToastMessage("❌ Failed to delete participant", "error");
      }
    } catch (error) {
      console.error("Error deleting participant:", error);
      showToastMessage("❌ Error deleting participant", "error");
    }
  };

  const handleEditParticipant = (participant: any) => {
    setEditingParticipant(participant);
    setIsEditModalOpen(true);
  };

  const handleUpdateParticipant = async (unique: string, name: string, email: string) => {
    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique, name, email }),
      });

      const data = await res.json();

      if (res.ok) {
        showToastMessage("✅ Participant updated successfully", "success");
        refreshManually();
      } else {
        const errorMsg = data.error || "Failed to update participant";
        console.error("Update error:", data);
        showToastMessage(`❌ ${errorMsg}`, "error");
      }
    } catch (error) {
      console.error("Error updating participant:", error);
      showToastMessage("❌ Error updating participant", "error");
    }
  };

  const handleSendEmail = async () => {
    if (!confirm("Send emails to ALL participants?")) return;

    const allIds = participantData.map((p) => p.unique);
    const total = allIds.length;

    // Initialize progress
    setEmailProgress({
      isOpen: true,
      total,
      current: 0,
      success: 0,
      failed: 0,
      isBulk: true,
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
      setEmailProgress((prev) => ({
        ...prev,
        current: i + 1,
        success: successCount,
        failed: failCount,
      }));
    }

    setSendingEmail(false);
    fetchEmailLogs();
    showToastMessage(
      `✅ Email selesai dikirim: ${successCount} berhasil, ${failCount} gagal`,
      successCount > 0 ? "success" : "error"
    );

    // Auto close modal after 2 seconds
    setTimeout(() => {
      setEmailProgress((prev) => ({ ...prev, isOpen: false }));
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
      isBulk: false,
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
        isBulk: false,
      });

      if (res.ok) {
        showToastMessage(`✅ Email berhasil dikirim ke ${uniqueId}`, "success");
        fetchEmailLogs();
      } else {
        showToastMessage(`❌ Gagal mengirim email: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailProgress((prev) => ({
        ...prev,
        current: 1,
        failed: 1,
      }));
      showToastMessage("❌ Terjadi kesalahan saat mengirim email", "error");
    }

    // Auto close modal after 2 seconds
    setTimeout(() => {
      setEmailProgress((prev) => ({ ...prev, isOpen: false }));
    }, 2000);
  };

  const handleUpdateKitAndSnack = async (uniqueId: string, value: boolean) => {
    // Optimistic update - langsung update UI untuk kedua field
    setOptimisticUpdates((prev) => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], seminar_kit: value, consumption: value },
    }));

    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique: uniqueId, seminar_kit: value, consumption: value }),
      });

      if (res.ok) {
        showToastMessage(
          value ? "✅ Seminar kit & snack ditandai sudah diambil" : "⚠️ Seminar kit & snack ditandai belum diambil",
          "success"
        );
        // Jangan clear optimistic update, biarkan real-time update yang mengambil alih
        // Ini mencegah flickering
      } else {
        // Rollback jika gagal
        setOptimisticUpdates((prev) => {
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
      setOptimisticUpdates((prev) => {
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
    setOptimisticUpdates((prev) => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], heavy_meal: value },
    }));

    try {
      const res = await fetch("/api/participants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique: uniqueId, heavy_meal: value }),
      });

      if (res.ok) {
        showToastMessage(
          value ? "✅ Makanan berat ditandai sudah diambil" : "⚠️ Makanan berat ditandai belum diambil",
          "success"
        );
        // Jangan clear optimistic update, biarkan real-time update yang mengambil alih
        // Ini mencegah flickering
      } else {
        // Rollback jika gagal
        setOptimisticUpdates((prev) => {
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
      setOptimisticUpdates((prev) => {
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
    setOptimisticUpdates((prev) => ({
      ...prev,
      [uniqueId]: { ...prev[uniqueId], mission_card: value },
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
        setOptimisticUpdates((prev) => {
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
      setOptimisticUpdates((prev) => {
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

  const handleExport = async (type: "all" | "attended" | "not-attended") => {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Peserta_${type}_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToastMessage("✅ Data berhasil di-export!", "success");
      } else {
        showToastMessage("❌ Gagal export data", "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      showToastMessage("❌ Terjadi kesalahan saat export", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteEmailLog = async (id: number) => {
    if (!confirm("Hapus email log ini?")) return;

    try {
      const res = await fetch(`/api/email-logs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToastMessage("✅ Email log berhasil dihapus", "success");
        fetchEmailLogs(); // Refresh logs
      } else {
        showToastMessage("❌ Gagal menghapus email log", "error");
      }
    } catch (error) {
      console.error("Delete email log error:", error);
      showToastMessage("❌ Terjadi kesalahan", "error");
    }
  };

  const handleDeleteAllEmailLogs = async () => {
    if (!confirm("Hapus SEMUA email log? Tindakan ini tidak dapat dibatalkan!")) return;

    try {
      const res = await fetch("/api/email-logs?all=true", { method: "DELETE" });
      if (res.ok) {
        showToastMessage("✅ Semua email log berhasil dihapus", "success");
        fetchEmailLogs(); // Refresh logs
      } else {
        showToastMessage("❌ Gagal menghapus email log", "error");
      }
    } catch (error) {
      console.error("Delete all email logs error:", error);
      showToastMessage("❌ Terjadi kesalahan", "error");
    }
  };

  if (!mounted) return null;

  const itemsPerPage = 10;

  // Process Email Logs
  const processedLogsMap = emailLogs
    .filter((log) => {
      const searchLower = historySearch.toLowerCase();
      return (
        (log.email && log.email.toLowerCase().includes(searchLower)) ||
        (log.participant_unique_id && log.participant_unique_id.toLowerCase().includes(searchLower))
      );
    })
    .reduce((acc: Map<string, any>, log) => {
      const key = log.participant_unique_id || log.email;
      if (acc.has(key)) {
        const existing = acc.get(key);
        existing.count += 1;
        if (new Date(log.sent_at) > new Date(existing.sent_at)) {
          acc.set(key, { ...log, count: existing.count });
        }
      } else {
        acc.set(key, { ...log, count: 1 });
      }
      return acc;
    }, new Map());

  const processedLogs = Array.from(processedLogsMap.values()).sort(
    (a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  const totalHistoryPages = Math.ceil(processedLogs.length / historyItemsPerPage);
  const paginatedHistory = processedLogs.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage);

  // Optimized search with auto-reset pagination
  const searchTrimmed = search.trim().toLowerCase();

  const filteredData = participantData.filter((participant) => {
    // If no search term, only apply status filter
    if (!searchTrimmed) {
      const matchStatus = statusFilter === "all" ? true : statusFilter === "present" ? participant.present : !participant.present;
      return matchStatus;
    }

    // Normalize data for better matching
    const nameLower = participant.name.toLowerCase().trim();
    const uniqueLower = participant.unique.toLowerCase().trim();
    const emailLower = participant.email.toLowerCase().trim();

    // Check for exact match first (highest priority)
    const exactMatchName = nameLower === searchTrimmed;
    const exactMatchUnique = uniqueLower === searchTrimmed;
    const exactMatchEmail = emailLower === searchTrimmed;

    // Check for starts with (medium priority)
    const startsWithName = nameLower.startsWith(searchTrimmed);
    const startsWithUnique = uniqueLower.startsWith(searchTrimmed);
    const startsWithEmail = emailLower.startsWith(searchTrimmed);

    // Check for contains (lowest priority)
    const containsName = nameLower.includes(searchTrimmed);
    const containsUnique = uniqueLower.includes(searchTrimmed);
    const containsEmail = emailLower.includes(searchTrimmed);

    // Match if any condition is true
    const matchSearch =
      exactMatchName ||
      exactMatchUnique ||
      exactMatchEmail ||
      startsWithName ||
      startsWithUnique ||
      startsWithEmail ||
      containsName ||
      containsUnique ||
      containsEmail;

    // Apply status filter
    const matchStatus = statusFilter === "all" ? true : statusFilter === "present" ? participant.present : !participant.present;

    return matchSearch && matchStatus;
  });

  // Sort results: exact matches first, then starts with, then contains
  const sortedFilteredData = searchTrimmed
    ? filteredData.sort((a, b) => {
        const aName = a.name.toLowerCase().trim();
        const bName = b.name.toLowerCase().trim();
        const aUnique = a.unique.toLowerCase().trim();
        const bUnique = b.unique.toLowerCase().trim();
        const aEmail = a.email.toLowerCase().trim();
        const bEmail = b.email.toLowerCase().trim();

        // Exact matches get highest priority
        const aExact = aName === searchTrimmed || aUnique === searchTrimmed || aEmail === searchTrimmed;
        const bExact = bName === searchTrimmed || bUnique === searchTrimmed || bEmail === searchTrimmed;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Starts with gets second priority
        const aStarts = aName.startsWith(searchTrimmed) || aUnique.startsWith(searchTrimmed) || aEmail.startsWith(searchTrimmed);
        const bStarts = bName.startsWith(searchTrimmed) || bUnique.startsWith(searchTrimmed) || bEmail.startsWith(searchTrimmed);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      })
    : filteredData;

  const totalPages = Math.ceil(sortedFilteredData.length / itemsPerPage);
  const paginatedData = sortedFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      <div className="w-full min-h-screen px-2 py-8 md:px-8 md:py-10 lg:px-14 lg:py-14 bg-linear-to-r from-[#17D3FD]/20 to-[#CD3DFF]/20 backdrop-blur-sm relative z-10">
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
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30">
                <FaUsers className="text-blue-300 text-sm" />
                <span className="text-sm text-blue-200 font-semibold">{participantData.length} Total</span>
              </div>
              {/* Real-time connection indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
                <span className="text-xs text-gray-300">{isConnected ? "Live" : "Offline"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
              <button
                onClick={() => setIsManualRegModalOpen(true)}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 px-4 py-2.5 text-sm font-medium text-cyan-300 shadow-md shadow-cyan-500/20 ring-1 ring-inset ring-cyan-400/20 transition-all hover:from-cyan-500/20 hover:to-cyan-600/20 hover:shadow-cyan-500/30 hover:ring-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <FaUserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Tambah Manual</span>
                <span className="sm:hidden">Manual</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-4 py-2.5 text-sm font-medium text-blue-300 shadow-md shadow-blue-500/20 ring-1 ring-inset ring-blue-400/20 transition-all hover:from-blue-500/20 hover:to-blue-600/20 hover:shadow-blue-500/30 hover:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <FaUpload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Data</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10 px-4 py-2.5 text-sm font-medium text-green-300 shadow-md shadow-green-500/20 ring-1 ring-inset ring-green-400/20 transition-all hover:from-green-500/20 hover:to-green-600/20 hover:shadow-green-500/30 hover:ring-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <FaEnvelope className="h-4 w-4" />
                <span className="hidden sm:inline">{sendingEmail ? "Sending..." : "Send Emails"}</span>
                <span className="sm:hidden">Email</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 px-4 py-2.5 text-sm font-medium text-red-300 shadow-md shadow-red-500/20 ring-1 ring-inset ring-red-400/20 transition-all hover:from-red-500/20 hover:to-red-600/20 hover:shadow-red-500/30 hover:ring-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <FaTrash className="h-4 w-4" />
                <span className="hidden sm:inline">Delete All</span>
                <span className="sm:hidden">Delete</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10 px-4 py-2.5 text-sm font-medium text-purple-300 shadow-md shadow-purple-500/20 ring-1 ring-inset ring-purple-400/20 transition-all hover:from-purple-500/20 hover:to-purple-600/20 hover:shadow-purple-500/30 hover:ring-purple-400/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <FaDownload className="h-4 w-4" />
                  <span>{exporting ? "Exporting..." : "Export Data"}</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0f0b24]/95 backdrop-blur-sm shadow-2xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        handleExport("all");
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-gray-200 text-sm border-b border-white/5 disabled:opacity-50"
                    >
                      <FaDownload className="text-purple-400 h-4 w-4" />
                      <span>Semua Peserta</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExport("attended");
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-gray-200 text-sm border-b border-white/5 disabled:opacity-50"
                    >
                      <FaDownload className="text-green-400 h-4 w-4" />
                      <span>Peserta Hadir</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExport("not-attended");
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-gray-200 text-sm disabled:opacity-50"
                    >
                      <FaDownload className="text-red-400 h-4 w-4" />
                      <span>Peserta Tidak Hadir</span>
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
                className="w-full pl-9 md:pl-11 pr-10 py-2.5 md:py-3 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none placeholder:text-gray-500 focus:border-[#17D3FD]/60 transition text-sm md:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {search && (
            <div className="mt-4 flex items-center justify-between text-sm font-plus-jakarta-sans">
              <div className="text-gray-400">
                Menampilkan <span className="text-[#17D3FD] font-semibold">{sortedFilteredData.length}</span> hasil untuk "
                <span className="text-white font-medium">{search}</span>"
              </div>
              {sortedFilteredData.length === 0 && <div className="text-yellow-400 text-xs">Tidak ada hasil yang cocok</div>}
            </div>
          )}

          {/* Info Note */}
          <div className="mt-4 p-3 md:p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2 md:gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs md:text-sm text-gray-300 font-plus-jakarta-sans">
              <span className="font-semibold text-green-300">Info:</span> Nama peserta dengan{" "}
              <span className="px-2 py-0.5 bg-green-500/30 rounded text-green-300 font-semibold">background hijau</span>{" "}
              menandakan email tiket sudah berhasil terkirim.
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
                    registered_at: p.registered_at || "",
                    seminar_kit: optimistic.seminar_kit !== undefined ? optimistic.seminar_kit : p.seminar_kit || false,
                    consumption: optimistic.consumption !== undefined ? optimistic.consumption : p.consumption || false,
                    heavy_meal: optimistic.heavy_meal !== undefined ? optimistic.heavy_meal : p.heavy_meal || false,
                    mission_card: optimistic.mission_card !== undefined ? optimistic.mission_card : p.mission_card || false,
                  };
                })}
                emailLogs={emailLogs}
                onResend={handleResendEmail}
                onUpdateKitAndSnack={handleUpdateKitAndSnack}
                onUpdateHeavyMeal={handleUpdateHeavyMeal}
                onUpdateMissionCard={handleUpdateMissionCard}
                onEdit={handleEditParticipant}
                onDelete={handleDeleteParticipant}
              />
            )}
          </div>
          {!loading && totalPages > 1 && (
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
              <span>
                Page {currentPage} of {totalPages}
              </span>

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

        {/* Email History Section */}
        <div className="max-w-7xl mx-auto mt-6 md:mt-8 rounded-xl md:rounded-2xl bg-[#181138] border border-[#17D3FD]/30 shadow-2xl p-4 md:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold font-plus-jakarta-sans">Email History</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30">
                <FaEnvelope className="text-purple-300 text-sm" />
                <span className="text-sm text-purple-200 font-semibold">{processedLogs.length} Total</span>
              </div>
            </div>
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
                <span>{showEmailHistory ? "Sembunyikan" : "Tampilkan"}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showEmailHistory ? "rotate-180" : ""}`}
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
            <div className="space-y-4">
              {/* History Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search history by unique code or email..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1); // Reset to first page on search
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0f0b24] border border-[#17D3FD]/20 text-gray-200 outline-none placeholder:text-gray-500 focus:border-[#17D3FD]/60 transition text-sm"
                />
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-gray-300 font-plus-jakarta-sans">
                  <thead className="bg-black/20 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Waktu (Terbaru)</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Unique ID</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Attempts</th>
                      <th className="px-6 py-4">Error (Latest)</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          {historySearch ? "Tidak ada history yang cocok" : "Belum ada email yang dikirim"}
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                            {new Date(log.sent_at).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">{log.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-300">{log.participant_unique_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {log.status === "success" ? (
                              <span className="inline-flex items-center rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                                ✓ Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                                ✗ Error
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {log.count > 1 && (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full shadow-md shadow-blue-500/50">
                                {log.count}
                              </span>
                            )}
                            {log.count === 1 && <span className="text-gray-500 text-xs">-</span>}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-red-300 max-w-[200px] truncate"
                            title={log.error_message}
                          >
                            {log.error_message || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteEmailLog(log.id)}
                              className="group inline-flex items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                              title="Delete Log"
                            >
                              <FaTrash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* History Pagination */}
              {totalHistoryPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-gray-200 font-plus-jakarta-sans text-sm">
                  <button
                    onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                    disabled={historyPage === 1}
                    className={`px-3 py-1.5 rounded-lg border ${
                      historyPage === 1
                        ? "border-gray-600 text-gray-600 cursor-not-allowed"
                        : "border-[#17D3FD]/40 text-[#17D3FD] hover:bg-[#17D3FD]/10"
                    }`}
                  >
                    Prev
                  </button>
                  <span>
                    Page {historyPage} of {totalHistoryPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                    disabled={historyPage === totalHistoryPages}
                    className={`px-3 py-1.5 rounded-lg border ${
                      historyPage === totalHistoryPages
                        ? "border-gray-600 text-gray-600 cursor-not-allowed"
                        : "border-[#17D3FD]/40 text-[#17D3FD] hover:bg-[#17D3FD]/10"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
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
      <ManualRegistrationModal
        isOpen={isManualRegModalOpen}
        onClose={() => setIsManualRegModalOpen(false)}
        onSuccess={() => {
          showToastMessage("✅ Peserta berhasil ditambahkan!", "success");
          refreshManually();
        }}
        onError={(message) => showToastMessage(`❌ ${message}`, "error")}
      />
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={refreshManually} />

      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        participant={editingParticipant}
        onUpdate={handleUpdateParticipant}
      />
    </main>
  );
}
