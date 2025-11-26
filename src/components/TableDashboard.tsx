interface TableDashboardProps {
  filteredData: Array<{
    unique: string;
    name: string;
    email: string;
    present: boolean;
    seminar_kit: boolean;
    consumption: boolean;
    heavy_meal: boolean;
    registered_at: string;
  }>;
  onResend: (unique: string) => void;
  onUpdateKit: (unique: string, value: boolean) => void;
  onUpdateConsumption: (unique: string, value: boolean) => void;
  onUpdateHeavyMeal: (unique: string, value: boolean) => void;
}

function TableDashboard({ filteredData, onResend, onUpdateKit, onUpdateConsumption, onUpdateHeavyMeal }: TableDashboardProps) {
  return (
    <table className="w-full table-auto text-sm md:text-base">
      <thead>
        <tr className="text-left text-gray-300 border-b border-[#17D3FD]/20">
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Registered At</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Unique Code</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Nama</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Email</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Status</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Seminar Kit</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Snack</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Makanan Berat</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Action</th>
        </tr>
      </thead>

      <tbody>
        {filteredData.map((participant, idx) => (
          <tr key={idx} className="border-b border-[#ffffff]/10 hover:bg-white/5 transition">
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">{participant.registered_at ? new Date(participant.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A'}</td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm font-mono">{participant.unique}</td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">{participant.name}</td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm truncate max-w-[150px] md:max-w-none" title={participant.email}>{participant.email}</td>
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-green-300/30 text-green-300 font-semibold text-xs md:text-sm whitespace-nowrap">Hadir</span>
              ) : (
                <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-red-300/30 text-red-300 font-semibold text-xs md:text-sm whitespace-nowrap">Tidak Hadir</span>
              )}
            </td>

            {/* Seminar Kit Checkbox - Only show if present */}
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participant.seminar_kit}
                    onChange={(e) => onUpdateKit(participant.unique, e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-gray-300 whitespace-nowrap">
                    {participant.seminar_kit ? 'Sudah' : 'Belum'}
                  </span>
                </label>
              ) : (
                <span className="text-gray-500 text-xs md:text-sm">-</span>
              )}
            </td>

            {/* Consumption Checkbox - Only show if present */}
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participant.consumption}
                    onChange={(e) => onUpdateConsumption(participant.unique, e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-gray-300 whitespace-nowrap">
                    {participant.consumption ? 'Sudah' : 'Belum'}
                  </span>
                </label>
              ) : (
                <span className="text-gray-500 text-xs md:text-sm">-</span>
              )}
            </td>

            {/* Heavy Meal Checkbox - Only show if present */}
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participant.heavy_meal}
                    onChange={(e) => onUpdateHeavyMeal(participant.unique, e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 accent-orange-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-gray-300 whitespace-nowrap">
                    {participant.heavy_meal ? 'Sudah' : 'Belum'}
                  </span>
                </label>
              ) : (
                <span className="text-gray-500 text-xs md:text-sm">-</span>
              )}
            </td>

            <td className="py-2 md:py-3 px-1 md:px-2">
              <button
                onClick={() => onResend(participant.unique)}
                className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded-lg transition text-xs md:text-sm font-semibold whitespace-nowrap"
              >
                Resend
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TableDashboard;
