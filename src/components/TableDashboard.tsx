interface EmailLog {
  id: number;
  participant_unique_id: string;
  email: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

interface TableDashboardProps {
  filteredData: Array<{
    unique: string;
    name: string;
    email: string;
    present: boolean;
    seminar_kit: boolean;
    consumption: boolean;
    heavy_meal: boolean;
    mission_card: boolean;
    registered_at: string;
  }>;
  emailLogs: EmailLog[];
  onResend: (unique: string) => void;
  onUpdateKitAndSnack: (unique: string, value: boolean) => void;
  onUpdateHeavyMeal: (unique: string, value: boolean) => void;
  onUpdateMissionCard: (unique: string, value: boolean) => void;
}

function TableDashboard({ filteredData, emailLogs, onResend, onUpdateKitAndSnack, onUpdateHeavyMeal, onUpdateMissionCard }: TableDashboardProps) {
  // Helper function to check if email was successfully sent
  const hasSuccessfulEmail = (uniqueId: string) => {
    return emailLogs.some(log =>
      log.participant_unique_id === uniqueId && log.status === 'success'
    );
  };

  return (
    <table className="w-full table-auto text-sm md:text-base">
      <thead>
        <tr className="text-left text-gray-300 border-b border-[#17D3FD]/20">
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Registered At</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Unique Code</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Nama</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Email</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Status</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Seminar Kit & Snack</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Makanan Berat</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Mission Card</th>
          <th className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">Action</th>
        </tr>
      </thead>

      <tbody>
        {filteredData.map((participant, idx) => (
          <tr key={idx} className="border-b border-[#ffffff]/10 hover:bg-white/5 transition">
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">{participant.registered_at ? new Date(participant.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A'}</td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm font-mono">{participant.unique}</td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm">
              <span className={hasSuccessfulEmail(participant.unique) ? "px-2 py-1 bg-green-500/30 rounded" : ""}>
                {participant.name}
              </span>
            </td>
            <td className="py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm truncate max-w-[150px] md:max-w-none" title={participant.email}>{participant.email}</td>
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-green-300/30 text-green-300 font-semibold text-xs md:text-sm whitespace-nowrap">Hadir</span>
              ) : (
                <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-red-300/30 text-red-300 font-semibold text-xs md:text-sm whitespace-nowrap">Tidak Hadir</span>
              )}
            </td>

            {/* Seminar Kit & Snack Combined Checkbox - Only show if present */}
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participant.seminar_kit && participant.consumption}
                    onChange={(e) => onUpdateKitAndSnack(participant.unique, e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-gray-300 whitespace-nowrap">
                    {(participant.seminar_kit && participant.consumption) ? 'Sudah' : 'Belum'}
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

            {/* Mission Card Checkbox - Only show if present */}
            <td className="py-2 md:py-3 px-1 md:px-2">
              {participant.present ? (
                <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={participant.mission_card}
                    onChange={(e) => onUpdateMissionCard(participant.unique, e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs md:text-sm text-gray-300 whitespace-nowrap">
                    {participant.mission_card ? 'Sudah' : 'Belum'}
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
