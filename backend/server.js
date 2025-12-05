// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---- Simple JSON storage helpers ----
const dataDir = path.join(__dirname, "data");
const meetingFile = path.join(dataDir, "meeting.json");
const attendanceFile = path.join(dataDir, "attendance.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// --- Meeting state (admin-controlled) ---
const todayISO = new Date().toISOString().slice(0, 10);

let currentMeeting = loadJson(meetingFile, null) || {
  meetingDate: todayISO,
  agenda: "Devign Club Meeting",
};

// --- Attendance store ---
let attendanceRecords = loadJson(attendanceFile, []);

/**
 * GET /api/meeting
 * Returns the current meeting date & agenda
 */
app.get("/api/meeting", (req, res) => {
  return res.json(currentMeeting);
});

/**
 * PUT /api/meeting
 * Body: { meetingDate: string (YYYY-MM-DD), agenda: string }
 */
app.put("/api/meeting", (req, res) => {
  const { meetingDate, agenda } = req.body;

  if (!meetingDate || !agenda) {
    return res
      .status(400)
      .json({ message: "Meeting date and agenda are required." });
  }

  currentMeeting = {
    meetingDate,
    agenda,
  };

  saveJson(meetingFile, currentMeeting);
  console.log("Updated meeting:", currentMeeting);
  return res.json(currentMeeting);
});

/**
 * POST /api/attendance
 * Body: { name, branch, year, meetingDate?, agenda? }
 */
app.post("/api/attendance", (req, res) => {
  const { name, branch, year, meetingDate, agenda } = req.body;

  if (!name || !branch || !year) {
    return res
      .status(400)
      .json({ message: "Name, branch, and year are required." });
  }

  const dateToUse = meetingDate || currentMeeting.meetingDate;
  const agendaToUse = agenda || currentMeeting.agenda;

  const record = {
    id: Date.now().toString(), // ensure string ID
    name,
    branch,
    year,
    meetingDate: dateToUse,
    agenda: agendaToUse,
    timestamp: new Date().toISOString(),
  };

  attendanceRecords.push(record);
  saveJson(attendanceFile, attendanceRecords);

  return res.status(201).json(record);
});

/**
 * GET /api/attendance?meetingDate=YYYY-MM-DD
 */
app.get("/api/attendance", (req, res) => {
  const { meetingDate } = req.query;
  const dateToFilter = meetingDate || currentMeeting.meetingDate;

  const filtered = attendanceRecords.filter(
    (r) => r.meetingDate === dateToFilter
  );
  return res.json(filtered);
});

/**
 * DELETE /api/attendance/:id
 */
app.delete("/api/attendance/:id", (req, res) => {
  const { id } = req.params;

  console.log("DELETE request for ID:", id);
  console.log(
    "Current IDs in store:",
    attendanceRecords.map((r) => r.id)
  );

  const index = attendanceRecords.findIndex((r) => String(r.id) === String(id));

  if (index === -1) {
    console.log("Not found → cannot delete");
    return res.status(404).json({ message: "Attendance record not found." });
  }

  const [deleted] = attendanceRecords.splice(index, 1);
  console.log("Deleted attendance:", deleted);

  // persist updated list
  saveJson(attendanceFile, attendanceRecords);

  return res.json({ message: "Deleted successfully.", record: deleted });
});

app.listen(PORT, () => {
  console.log(`Devign Attendance API running on http://localhost:${PORT}`);
});
