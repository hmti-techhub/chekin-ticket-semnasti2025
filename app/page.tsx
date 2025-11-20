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
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const mounted = useMounted();
  if (!mounted) return null;

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`QR Code detected: ${uniqueCode}`);
    showToastMessage(`${uniqueCode}`, "success");
    setUniqueCode("");
  };

  const onScanSuccess = (decodedText: string) => {
    console.log(`QR Code detected: ${decodedText}`);
    showToastMessage(`${decodedText}`, "success");
  };

  const onScanFailure = (error: string) => {
    // showToastMessage(`Gagal memindai QR Code: ${error}`, "error");
    console.warn(`QR Code scan error: ${error}`);
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
          fps: 5,
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
        <h1 className="text-7xl text-transparent bg-clip-text bg-linear-to-t from-gray-400 to-white uppercase font-bold font-stormfaze">
          SEMNASTI 2025
        </h1>
        <h2 className="text-white text-lg mt-4 text-center px-4 font-plus-jakarta-sans">
          Silakan scan QR Code / Masukan Kode Unik Anda untuk melanjutkan registrasi ulang.
        </h2>

        <div className="max-w-3xl mt-8 rounded-2xl w-full h-auto bg-[#181138] p-6 text-white flex flex-col items-center gap-6 border border-[#17D3FD]/30 shadow-2xl shadow-[#CD3DFF]/10">
          <div className="flex w-full max-w-md bg-[#0f0b24] rounded-full h-fit border border-[#17D3FD]/20 font-plus-jakarta-sans">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-3 px-4 h-fit rounded-full font-semibold transition-all duration-300 ${
                activeTab === "scan" ? "bg-[#CD3DFF]/80 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Scan QR Code
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 px-4 h-fit rounded-full font-semibold transition-all duration-300  ${
                activeTab === "manual" ? "bg-[#CD3DFF]/80 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Masukan Kode
            </button>
          </div>

          {activeTab === "manual" ? (
            <InputCode uniqueCode={uniqueCode} setUniqueCode={setUniqueCode} handleSubmit={handleSubmit} />
          ) : (
            <Camera isCameraActive={isCameraActive} toggleCamera={toggleCamera} qrBoxId={qrBoxId} />
          )}
        </div>
      </div>
      <Toast message={toastMessage} type={toastType} show={showToast} />
    </main>
  );
}
