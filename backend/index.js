// backend/index.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---- In-memory store (per patient shield address) ----
// recordsByPatient: { [patientShieldAddr: string]: MedicalRecord[] }
const recordsByPatient = {};

// --- simple numeric hash helper (demo only, NOT secure) ---
function demoHash(input) {
  let h = 0n;
  for (const ch of input) {
    h = (h * 131n + BigInt(ch.charCodeAt(0))) % 10_000_000_000_000_000n; // 10^16
  }
  return h;
}

// ---- POST /api/records : doctor submits record ----
app.post("/api/records", (req, res) => {
  const {
    doctorShieldAddr,
    patientShieldAddr,
    visitDate,
    diagnosis,
    prescription,
    notes,
  } = req.body ?? {};

  if (!doctorShieldAddr || !patientShieldAddr) {
    return res.status(400).json({ ok: false, error: "missing_addresses" });
  }

  const record = {
    doctorShieldAddr,
    patientShieldAddr,
    visitDate: visitDate || new Date().toISOString().slice(0, 10),
    diagnosis: diagnosis || "",
    prescription: prescription || "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };

  // Store in memory
  if (!recordsByPatient[patientShieldAddr]) {
    recordsByPatient[patientShieldAddr] = [];
  }
  recordsByPatient[patientShieldAddr].push(record);

  // For the contract: hash patient ID and ciphertext (here we fake ciphertext as JSON string)
  const plaintextJson = JSON.stringify(record);
  const patient_hash = demoHash(patientShieldAddr);
  const encrypted_hash = demoHash(plaintextJson); // demo: NOT real encryption

  console.log("✅ Record stored for patient:", patientShieldAddr);
  console.log(
    "✅ Record hashed. patient_hash =",
    patient_hash.toString(),
    "encrypted_hash =",
    encrypted_hash.toString()
  );
  console.log(
    "💡 Use these numbers in your Midnight CLI `update_record(patient_hash, encrypted_hash)`."
  );

  return res.json({
    ok: true,
    patient_hash: patient_hash.toString(),
    encrypted_hash: encrypted_hash.toString(),
    record,
  });
});

// ---- GET /api/records/:patientShieldAddr : patient fetches all their records ----
app.get("/api/records/:patientShieldAddr", (req, res) => {
  const { patientShieldAddr } = req.params;
  const records = recordsByPatient[patientShieldAddr] ?? [];
  return res.json({ ok: true, patientShieldAddr, count: records.length, records });
});

app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});