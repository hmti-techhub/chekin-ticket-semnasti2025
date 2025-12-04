import { FaEdit, FaTrash, FaPaperPlane } from "react-icons/fa";

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
  onEdit: (participant: any) => void;
  onDelete: (unique: string) => void;
}

function TableDashboard({
  filteredData,
  emailLogs,
  onResend,
  onUpdateKitAndSnack,
  onUpdateHeavyMeal,
  onUpdateMissionCard,
  onEdit,
  onDelete,
}: TableDashboardProps) {
  // Helper function to check if email was successfully sent
  const hasSuccessfulEmail = (uniqueId: string) => {
    return emailLogs.some((log) => log.participant_unique_id === uniqueId && log.status === "success");
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-6xl overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-black/20 text-xs uppercase tracking-wider text-gray-400 font-semibold">
          <tr>
            <th className="px-6 py-4 text-nowrap">Registered At</th>
            <th className="px-6 py-4">Unique Code</th>
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-center">Kit & Snack</th>
            <th className="px-6 py-4 text-center">Heavy Meal</th>
            <th className="px-6 py-4 text-center">Mission Card</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {filteredData.map((participant, idx) => (
            <tr key={idx} className="hover:bg-white/5 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                {participant.registered_at
                  ? new Date(participant.registered_at)
                      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      .toUpperCase()
                  : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-300">{participant.unique}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                <div className="flex items-center gap-2">
                  {participant.name}
                  {hasSuccessfulEmail(participant.unique) && (
                    <span
                      className="flex h-2 w-2 rounded-full bg-green-500 ring-2 ring-green-500/30"
                      title="Email sent successfully"
                    ></span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-400 max-w-[200px] truncate" title={participant.email}>
                {participant.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {participant.present ? (
                  <span className="inline-flex items-center rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                    Hadir
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                    Tidak Hadir
                  </span>
                )}
              </td>

              {/* Seminar Kit & Snack Combined Checkbox */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {participant.present ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={participant.seminar_kit && participant.consumption}
                        onChange={(e) => onUpdateKitAndSnack(participant.unique, e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all checked:border-purple-500 checked:bg-purple-500 hover:border-purple-400"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        participant.seminar_kit && participant.consumption
                          ? "text-purple-300"
                          : "text-gray-500 group-hover:text-gray-400"
                      }`}
                    >
                      {participant.seminar_kit && participant.consumption ? "Sudah" : "Belum"}
                    </span>
                  </label>
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>

              {/* Heavy Meal Checkbox */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {participant.present ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={participant.heavy_meal}
                        onChange={(e) => onUpdateHeavyMeal(participant.unique, e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        participant.heavy_meal ? "text-orange-300" : "text-gray-500 group-hover:text-gray-400"
                      }`}
                    >
                      {participant.heavy_meal ? "Sudah" : "Belum"}
                    </span>
                  </label>
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>

              {/* Mission Card Checkbox */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={participant.mission_card}
                      onChange={(e) => onUpdateMissionCard(participant.unique, e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all checked:border-cyan-500 checked:bg-cyan-500 hover:border-cyan-400"
                    />
                    <svg
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        participant.mission_card ? "text-cyan-300" : "text-gray-500 group-hover:text-gray-400"
                      }`}
                    >
                      {participant.mission_card ? "Sudah" : "Belum"}
                    </span>
                  </label>
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onResend(participant.unique)}
                    className="group flex items-center justify-center rounded-lg bg-blue-500/10 p-2 text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-300"
                    title="Resend Email"
                  >
                    <FaPaperPlane className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(participant)}
                    className="group flex items-center justify-center rounded-lg bg-yellow-500/10 p-2 text-yellow-400 transition-all hover:bg-yellow-500/20 hover:text-yellow-300"
                    title="Edit Participant"
                  >
                    <FaEdit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(participant.unique)}
                    className="group flex items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                    title="Delete Participant"
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableDashboard;
