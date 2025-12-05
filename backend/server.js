// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ---------- MONGODB CONNECTION ----------
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    dbName: "devign-attendance", // or your custom db name
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- MONGOOSE SCHEMAS & MODELS ----------

// One document that holds current meeting info
const meetingSchema = new mongoose.Schema(
  {
    meetingDate: { type: String, required: true }, // YYYY-MM-DD
    agenda: { type: String, required: true },
  },
  { timestamps: true }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

// Each attendance mark is one document
const attendanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },
    meetingDate: { type: String, required: true }, // YYYY-MM-DD
    agenda: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

// Helper to map Mongo _id → id for frontend
const mapAttendanceDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return { id: _id.toString(), ...rest };
};

// ---------- ROUTES ----------

/**
 * GET /api/meeting
 * Returns current meeting. If none exists, create a default one for today.
 */
app.get("/api/meeting", async (req, res) => {
  try {
    let meeting = await Meeting.findOne().sort({ updatedAt: -1 });

    if (!meeting) {
      const todayISO = new Date().toISOString().slice(0, 10);
      meeting = await Meeting.create({
        meetingDate: todayISO,
        agenda: "Devign Club Meeting",
      });
    }

    res.json({
      meetingDate: meeting.meetingDate,
      agenda: meeting.agenda,
    });
  } catch (err) {
    console.error("GET /api/meeting error:", err);
    res.status(500).json({ message: "Failed to fetch meeting." });
  }
});

/**
 * PUT /api/meeting
 * Body: { meetingDate: string (YYYY-MM-DD), agenda: string }
 */
app.put("/api/meeting", async (req, res) => {
  try {
    const { meetingDate, agenda } = req.body;

    if (!meetingDate || !agenda) {
      return res
        .status(400)
        .json({ message: "Meeting date and agenda are required." });
    }

    // Upsert: either update the latest doc or create a new one
    let meeting = await Meeting.findOne().sort({ updatedAt: -1 });

    if (!meeting) {
      meeting = await Meeting.create({ meetingDate, agenda });
    } else {
      meeting.meetingDate = meetingDate;
      meeting.agenda = agenda;
      await meeting.save();
    }

    console.log("Updated meeting:", meeting);
    res.json({
      meetingDate: meeting.meetingDate,
      agenda: meeting.agenda,
    });
  } catch (err) {
    console.error("PUT /api/meeting error:", err);
    res.status(500).json({ message: "Failed to update meeting." });
  }
});

/**
 * POST /api/attendance
 * Body: { name, branch, year, meetingDate?, agenda? }
 */
app.post("/api/attendance", async (req, res) => {
  try {
    const { name, branch, year, meetingDate, agenda } = req.body;

    if (!name || !branch || !year) {
      return res
        .status(400)
        .json({ message: "Name, branch, and year are required." });
    }

    // Use provided meetingDate/agenda OR fall back to current meeting
    let dateToUse = meetingDate;
    let agendaToUse = agenda;

    if (!dateToUse || !agendaToUse) {
      const current = await Meeting.findOne().sort({ updatedAt: -1 });
      if (!current) {
        return res
          .status(400)
          .json({ message: "No current meeting configured." });
      }
      if (!dateToUse) dateToUse = current.meetingDate;
      if (!agendaToUse) agendaToUse = current.agenda;
    }

    const record = await Attendance.create({
      name,
      branch,
      year,
      meetingDate: dateToUse,
      agenda: agendaToUse,
    });

    res.status(201).json(mapAttendanceDoc(record));
  } catch (err) {
    console.error("POST /api/attendance error:", err);
    res.status(500).json({ message: "Failed to mark attendance." });
  }
});

/**
 * GET /api/attendance?meetingDate=YYYY-MM-DD
 */
app.get("/api/attendance", async (req, res) => {
  try {
    const { meetingDate } = req.query;

    let dateToFilter = meetingDate;
    if (!dateToFilter) {
      const current = await Meeting.findOne().sort({ updatedAt: -1 });
      if (!current) {
        return res.json([]);
      }
      dateToFilter = current.meetingDate;
    }

    const records = await Attendance.find({ meetingDate: dateToFilter })
      .sort({ timestamp: -1 })
      .exec();

    res.json(records.map(mapAttendanceDoc));
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    res.status(500).json({ message: "Failed to fetch attendance." });
  }
});

/**
 * DELETE /api/attendance/:id
 */
app.delete("/api/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    console.log("Deleted attendance:", deleted);
    res.json({ message: "Deleted successfully.", record: mapAttendanceDoc(deleted) });
  } catch (err) {
    console.error("DELETE /api/attendance error:", err);
    res.status(500).json({ message: "Failed to delete attendance." });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Devign Attendance API running on http://localhost:${PORT}`);
});
