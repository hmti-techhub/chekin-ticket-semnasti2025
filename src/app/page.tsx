"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Camera from "@/components/Camera";
import InputCode from "@/components/InputCode";
import Toast from "@/components/Toast";
import { useMounted } from "@/lib/useMounted";

export default function Home() {
  const [uniqueCode, setUniqueCode] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrBoxId = "qr-reader";
  const [toastMessage, setToastMessage] = useState("");
  const [toastTitle, setToastTitle] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("success");
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastScanTimeRef = useRef<number>(0); // Track last scan time for cooldown

  const mounted = useMounted();
  if (!mounted) return null;

  const showToastMessage = (message: string, type: "success" | "error" | "warning" | "info", title?: string) => {
    setToastMessage(message);
    setToastTitle(title || "");
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const fullCode = `SEMNASTI2025-${uniqueCode}`;
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique: fullCode,
          type: 'code' // Manual input menggunakan type 'code'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        showToastMessage(`Halo ${data.participant?.name || fullCode}, Selamat Datang di SEMNASTI 2025`, "success", "Check-in Berhasil!");
        setUniqueCode("");
      } else {
        if (data.invalidQR) {
          showToastMessage(data.error || 'Code tidak valid', "warning", "Code Tidak Valid");
        } else if (data.alreadyCheckedIn) {
          showToastMessage(`${data.participant?.name} sudah melakukan check-in sebelumnya`, "warning", "Sudah Check-in");
        } else {
          showToastMessage(data.error || 'Check-in gagal', "error", "Check-in Gagal");
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        showToastMessage('Waktu check-in habis (timeout 2 detik)', "error", "Timeout");
      } else {
        console.error('Check-in error:', error);
        showToastMessage('Terjadi kesalahan saat check-in', "error", "Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isLoading) {
      console.log('⏸️ Scan ignored - already processing a request');
      return;
    }

    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;

    // Cooldown 3 detik untuk mencegah spam
    if (timeSinceLastScan < 3000) {
      console.log(`⏸️ Scan ignored - cooldown active (${timeSinceLastScan}ms since last scan)`);
      return;
    }

    console.log(`📷 QR Code detected: ${decodedText.substring(0, 30)}...`);
    setIsLoading(true);
    lastScanTimeRef.current = now;

    // Pause scanner saat processing untuk mencegah multiple scan
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
        console.log('⏸️ Scanner paused during processing');
      } catch (error) {
        console.warn('Failed to pause scanner:', error);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unique: decodedText,
          type: 'qrcode'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        showToastMessage(`Halo ${data.participant?.name || decodedText}, Selamat Datang di SEMNASTI 2025`, "success", "Check-in Berhasil!");

        // Delay sebelum resume scanner untuk memberi waktu user melihat hasil
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
            console.log('▶️ Scanner resumed');
          }
        }, 1500);
      } else {
        if (data.invalidQR) {
          showToastMessage(data.error || 'QR Code tidak valid atau sudah digunakan', "warning", "QR Code Tidak Valid");
        } else if (data.alreadyCheckedIn) {
          showToastMessage(`${data.participant?.name} sudah melakukan check-in sebelumnya`, "warning", "Sudah Check-in");
        } else {
          showToastMessage(data.error || 'Check-in gagal', "error", "Check-in Gagal");
        }

        // Resume scanner lebih cepat jika error
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
            console.log('▶️ Scanner resumed after error');
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Check-in error:', error);

      if (error.name === 'AbortError') {
        showToastMessage('Request timeout - silakan coba lagi', "error", "Timeout");
      } else {
        showToastMessage('Terjadi kesalahan saat check-in', "error", "Error");
      }

      // Resume scanner jika error
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
          console.log('▶️ Scanner resumed after error');
        }
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const onScanFailure = (error: string) => {
    // Hanya log error yang penting, abaikan "No QR code found"
    if (!error.includes('NotFoundException')) {
      console.warn(`QR Code scan error: ${error}`);
    }
  };

  const toggleCamera = () => {
    if (isCameraActive && scannerRef.current) {
      scannerRef.current.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
      scannerRef.current = null;
      setIsCameraActive(false);
    } else if (!isCameraActive && activeTab === "scan") {
      scannerRef.current = new Html5QrcodeScanner(
        qrBoxId,
        {
          fps: 10, // Tingkatkan FPS untuk scan lebih responsif
          qrbox: { width: 325, height: 325 },
          supportedScanTypes: [],
          rememberLastUsedCamera: true,
        },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
      setIsCameraActive(true);
    }
  };

  return (
    <main className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#110c2a] font-sans ">
      <Image
        src="/tech-element.svg"
        alt="elemen left"
        width={200}
        height={300}
        className="h-4/5 w-auto rotate-180 absolute left-0 z-0 opacity-50"
      />
      <Image
        src="/tech-element.svg"
        alt="elemen right"
        width={200}
        height={300}
        className="w-auto absolute right-0 h-4/5 z-0 opacity-50"
      />

      <div className="w-full min-h-screen flex flex-col items-center p-14 bg-linear-to-r from-[#17D3FD]/20 to-[#CD3DFF]/20 border-white/30 backdrop-blur-sm relative z-10">
        <div className="max-w-3xl mt-8 rounded-2xl w-full h-auto bg-[#181138] p-6 text-white flex flex-col items-center gap-6 border border-[#17D3FD]/30 shadow-2xl shadow-[#CD3DFF]/10">
          <div className="flex w-full max-w-md bg-[#0f0b24] rounded-full h-fit border border-[#17D3FD]/20 font-plus-jakarta-sans">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-3 px-4 h-fit rounded-full font-semibold transition-all duration-300 ${activeTab === "scan" ? "bg-[#CD3DFF]/80 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
            >
              Scan QR Code
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 px-4 h-fit rounded-full font-semibold transition-all duration-300  ${activeTab === "manual" ? "bg-[#CD3DFF]/80 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
            >
              Masukan Kode
            </button>
          </div>

          {activeTab === "manual" ? (
            <InputCode uniqueCode={uniqueCode} setUniqueCode={setUniqueCode} handleSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <Camera isCameraActive={isCameraActive} toggleCamera={toggleCamera} qrBoxId={qrBoxId} isLoading={isLoading} />
          )}
        </div>
      </div>
      <Toast message={toastMessage} type={toastType} show={showToast} title={toastTitle} />
    </main>
  );
}
