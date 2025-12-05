import { useEffect, useState } from "react";
import BackgroundParticles from "./BackgroundParticles";
import Logo from "./Logo";
import LoaderOverlay from "./LoaderOverlay";

const API_BASE = "http://localhost:5000"; // change to your deployed API
const todayISO = new Date().toISOString().slice(0, 10);

const branches = ["CSE", "CSE (AI)", "ECE", "EE", "ME", "CE", "Other"];
const years = ["1st", "2nd", "3rd", "4th"];

// Simple shared PIN for admin mode (not real security)
const ADMIN_PIN = "1104";

export default function App() {
  // Loader state
  const [loading, setLoading] = useState(true);

  const [meetingDate, setMeetingDate] = useState(todayISO);
  const [agenda, setAgenda] = useState("Devign Club Meeting");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [meetingSaving, setMeetingSaving] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Delete error (for admin delete)
  const [deleteError, setDeleteError] = useState("");

  // --- Loader timing: logo shows in center, then moves to top ---
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // 2s loader
    return () => clearTimeout(timer);
  }, []);

  // Fetch current meeting info on mount
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/meeting`);
        const data = await res.json();
        if (data.meetingDate) setMeetingDate(data.meetingDate);
        if (data.agenda) setAgenda(data.agenda);
      } catch (err) {
        console.error("Error fetching meeting:", err);
      }
    };
    fetchMeeting();
  }, []);

  // Fetch attendance whenever meetingDate changes
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/attendance?meetingDate=${meetingDate}`
        );
        const data = await res.json();
        setAttendees(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (meetingDate) fetchAttendance();
  }, [meetingDate]);

  // --- Admin / Member UI handlers ---

  const handleMemberClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setAdminMessage("Switched to member view.");
      setTimeout(() => setAdminMessage(""), 2000);
    }
  };

  const handleAdminClick = () => {
    setPinInput("");
    setPinError("");
    if (isAdmin) return;
    setShowPinModal(true);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError("");

    if (pinInput.trim() === "") {
      setPinError("Please enter the admin PIN.");
      return;
    }

    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput("");
      setAdminMessage("Admin mode enabled.");
      setTimeout(() => setAdminMessage(""), 2000);
    } else {
      setPinError("Incorrect PIN. Try again.");
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingDate || !agenda.trim()) {
      setError("Meeting date and agenda are required.");
      return;
    }

    setMeetingSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/meeting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate,
          agenda: agenda.trim(),
        }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "Failed to update meeting");
      }

      setAdminMessage("Meeting updated.");
      setTimeout(() => setAdminMessage(""), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setMeetingSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDeleteError("");

    if (!name.trim() || !branch || !year || !agenda.trim() || !meetingDate) {
      setError("Please fill all the fields.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          branch,
          year,
          meetingDate,
          agenda: agenda.trim(),
        }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "Failed to mark attendance");
      }

      const saved = await res.json();
      setAttendees((prev) => [saved, ...prev]);
      setSuccess("Attendance marked ✨");
      setName("");
      setBranch("");
      setYear("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- Delete attendance (admin only) ---
  const handleDeleteAttendance = async (id) => {
    if (!isAdmin) return;
    setDeleteError("");

    try {
      const res = await fetch(`${API_BASE}/api/attendance/${id}`, {
        method: "DELETE",
      });

      let msg = {};
      try {
        msg = await res.json();
      } catch (e) {
        console.log("DELETE: failed to parse JSON");
      }

      if (!res.ok) {
        throw new Error(msg.message || "Failed to delete attendance");
      }

      setAttendees((prev) => prev.filter((a) => a.id !== id));
      setAdminMessage("Attendance removed.");
      setTimeout(() => setAdminMessage(""), 2000);
    } catch (err) {
      console.error("DELETE ERROR (frontend):", err);
      setDeleteError(err.message);
    }
  };

  const meetingFieldDisabled = !isAdmin;

  return (
    <div className="relative min-h-screen bg-slate-100">
      {/* Optional particles in the background */}
      {/* <BackgroundParticles /> */}

      {/* Shared logo that starts centered and moves to top after loading */}
      <Logo animateToTop={!loading} />

      {/* Fullscreen overlay with subtle spinner while logo is in center */}
      <LoaderOverlay active={loading} />

      {/* Main content, padded down so it doesn't collide with logo */}
      <div className="app-root relative flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10 pt-32">
        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Admin Access
                  </p>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                    Enter admin PIN
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError("");
                  }}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Only core Devign coordinators should have this PIN. Members can
                still mark attendance without it.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    autoFocus
                    placeholder="••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  />
                </div>

                {pinError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
                    {pinError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                      setPinError("");
                    }}
                    className="text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-4 py-2 rounded-full bg-slate-900 text-white font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition"
                  >
                    Unlock admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="relative z-10 w-full max-w-5xl">
          <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-4 pt-5 sm:px-6 sm:pt-6 md:px-10 md:pt-8">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Devign Club
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                  Attendance
                  <span className="text-lg sm:text-xl align-middle">📝</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                  Capture who showed up for today&apos;s creative session,
                  cleanly and effortlessly.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-1 text-xs w-full sm:w-auto">
                {/* Segmented control */}
                <div className="inline-flex items-center rounded-full bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleMemberClick}
                    className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] flex-1 sm:flex-none transition-all ${
                      !isAdmin
                        ? "bg-white shadow-sm text-slate-900"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        !isAdmin ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className="font-medium">Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminClick}
                    className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] flex-1 sm:flex-none transition-all ${
                      isAdmin
                        ? "bg-slate-900 shadow-sm text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isAdmin ? "bg-emerald-400" : "bg-slate-300"
                      }`}
                    />
                    <span className="font-medium">Admin</span>
                  </button>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-400 text-left sm:text-right">
                  {isAdmin
                    ? "Admin mode: You can edit meeting details."
                    : "Members can only mark attendance."}
                </p>
                {adminMessage && (
                  <span className="text-[10px] text-slate-400 text-left sm:text-right">
                    {adminMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid gap-5 sm:gap-6 md:gap-8 px-4 pb-5 pt-3 sm:px-6 sm:pb-6 md:px-10 md:pb-8 md:pt-4 md:grid-cols-[1.1fr_1fr]">
              {/* Left side: meeting details + form */}
              <div className="space-y-5 sm:space-y-6">
                {/* Meeting details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="w-full text-[11px] sm:text-xs font-medium text-slate-600 space-y-1">
                      Meeting Date
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        disabled={meetingFieldDisabled}
                        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 ${
                          meetingFieldDisabled
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </label>
                    <label className="w-full text-[11px] sm:text-xs font-medium text-slate-600 space-y-1">
                      Agenda
                      <input
                        type="text"
                        value={agenda}
                        onChange={(e) => setAgenda(e.target.value)}
                        disabled={meetingFieldDisabled}
                        placeholder="Design review, project sync, etc."
                        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 ${
                          meetingFieldDisabled
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                      The agenda and date are global for this meet.
                      {!isAdmin && " Only admins can modify them."}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleSaveMeeting}
                        disabled={meetingSaving}
                        className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium bg-slate-900 text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {meetingSaving ? "Saving..." : "Save meeting"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Attendance form */}
                <form
                  onSubmit={handleSubmit}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="w-full text-[11px] sm:text-xs font-medium text-slate-600 space-y-1">
                      Name
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Club Member"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      />
                    </label>

                    <label className="w-full text-[11px] sm:text-xs font-medium text-slate-600 space-y-1">
                      Branch
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 justify-between">
                    <label className="text-[11px] sm:text-xs font-medium text-slate-600 space-y-1">
                      Year
                      <div className="flex flex-wrap gap-2 mt-1">
                        {years.map((y) => (
                          <button
                            type="button"
                            key={y}
                            onClick={() => setYear(y)}
                            className={`px-3 py-1 rounded-full text-[11px] border transition-all ${
                              year === y
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={loadingSubmit}
                      className="sm:ml-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-slate-900 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {loadingSubmit ? "Marking..." : "Mark Present"}
                      <span className="text-base">⌁</span>
                    </button>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
                      {success}
                    </p>
                  )}
                </form>
              </div>

              {/* Right side: attendees list */}
              <div className="bg-slate-900 text-slate-50 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Today&apos;s Meet
                    </p>
                    <p className="text-xs sm:text-sm font-medium mt-1 text-slate-50">
                      {meetingDate} • {agenda || "No agenda set"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] text-slate-400">Present</span>
                    <span className="text-xl sm:text-2xl font-semibold leading-none">
                      {attendees.length}
                    </span>
                  </div>
                </div>

                {deleteError && (
                  <p className="mb-2 text-[10px] text-red-300 bg-red-900/30 border border-red-500/40 rounded-lg px-2 py-1">
                    {deleteError}
                  </p>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3" />

                <div className="flex-1 max-h-[200px] overflow-y-auto pr-1 space-y-2 custom-scroll">
                  {attendees.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[11px] text-slate-400">
                      <span className="text-lg sm:text-xl mb-1">👀</span>
                      Nobody marked present yet.
                      <br />
                      Start with the first name.
                    </div>
                  ) : (
                    attendees.map((a) => (
                      <div
                        key={a.id}
                        className="group flex items-center justify-between gap-3 rounded-xl bg-slate-800 px-3 py-2 text-[11px] sm:text-xs border border-slate-700 hover:border-slate-500 transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-50 group-hover:text-white">
                            {a.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {a.branch} • {a.year}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {new Date(a.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttendance(a.id)}
                              className="rounded-full border border-slate-600/60 px-2 py-1 text-[10px] text-slate-300 hover:bg-red-500 hover:text-white hover:border-red-400 transition"
                              title="Remove attendance"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="mt-3 text-[9px] sm:text-[10px] text-slate-500 text-right">
                  Designed for Devign ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
