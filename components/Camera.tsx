import React from "react";

function Camera({
  isCameraActive,
  toggleCamera,
  qrBoxId,
}: {
  isCameraActive: boolean;
  toggleCamera: () => void;
  qrBoxId: string;
}) {
  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6 h-full ">
      <div className="h-[465px] bg-[#0a071a] rounded-xl p-4 border flex flex-col w-lg border-none">
        {/* HTML5 QR Code Scanner Container */}
        <div className="bg-black h-full rounded-lg  flex items-center justify-center relative overflow-hidden">
          <div id={qrBoxId} className="w-full h-[360px]"></div>

          {!isCameraActive && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-gray-400 font-plus-jakarta-sans">Kamera belum diaktifkan</p>
                <p className="text-gray-500 text-sm mt-2 font-plus-jakarta-sans">
                  Klik tombol Hidupkan Kamera untuk memulai pemindaian QR Code
                </p>
              </div>
            </div>
          )}

          {/* Scanner Guide Overlay */}
        </div>
        <div className="mt-4 flex justify-center w-full">
          <div className="bg-[#0f0b24] rounded-lg border border-[#17D3FD]/10 w-full">
            <button
              onClick={toggleCamera}
              className={`py-3 w-full rounded-lg text-base font-semibold transition-colors font-plus-jakarta-sans ${
                isCameraActive
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
              }`}
            >
              {isCameraActive ? "Stop Kamera" : "Hidupkan Kamera"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Camera;
