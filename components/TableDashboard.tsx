import React from "react";

interface TableDashboardProps {
  filteredData: Array<{
    unique: string;
    name: string;
    nim: string;
    email: string;
    present: boolean;
  }>;
}

function TableDashboard({ filteredData }: TableDashboardProps) {
  return (
    <table className="w-full table-auto">
      <thead>
        <tr className="text-left text-gray-300 border-b border-[#17D3FD]/20">
          <th className="py-3 px-2">Unique Code</th>
          <th className="py-3 px-2">Nama</th>
          <th className="py-3 px-2">NIM</th>
          <th className="py-3 px-2">Email</th>
          <th className="py-3 px-2">Status</th>
        </tr>
      </thead>

      <tbody>
        {filteredData.map((team, idx) => (
          <tr key={idx} className="border-b border-[#ffffff]/10 hover:bg-white/5 transition">
            <td className="py-3 px-2">{team.unique}</td>
            <td className="py-3 px-2">{team.name}</td>
            <td className="py-3 px-2">{team.nim}</td>
            <td className="py-3 px-2">{team.email}</td>
            <td className="py-3 px-2">
              {team.present ? (
                <span className="px-3 py-1 rounded-full bg-green-300/30 text-green-300 font-semibold">Hadir</span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-300/30 text-red-300 font-semibold">Tidak Hadir</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TableDashboard;
