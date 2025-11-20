import React from "react";

function InputCode({
  uniqueCode,
  setUniqueCode,
  handleSubmit,
}: {
  uniqueCode: string;
  setUniqueCode: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col items-center gap-4 justify-center h-[305px] font-plus-jakarta-sans my-20"
    >
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#CD3DFF] to-[#17D3FD] font-plus-jakarta-sans ">
        Masukan Kode Unik
      </h3>

      <input
        type="text"
        value={uniqueCode}
        onChange={(e) => setUniqueCode(e.target.value)}
        placeholder="SEMNASTI-2025-12345"
        className="w-full max-w-md px-5 py-3 rounded-lg bg-[#0f0b24]/90 border border-[#17D3FD]/40 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-[#CD3DFF]/70 transition-all duration-300"
      />

      <button
        type="submit"
        className="w-full max-w-md py-3 mt-2 bg-[#CD3DFF]/90 text-white font-semibold rounded-lg shadow-lg active:scale-95 transition-all duration-200 hover:bg-[#DD49FF]/90"
      >
        Submit Kode
      </button>
    </form>
  );
}

export default InputCode;
