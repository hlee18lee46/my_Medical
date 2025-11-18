// backend/index.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { exec } from "child_process";
import path from "path";

function callMidnightUpdate(patient_hash, encrypted_hash) {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(
      process.cwd(),
      "../contracts/boilerplate/contract-cli/dist/cli.js"
    );

    const cmd = `node ${cliPath} update-record ${patient_hash} ${encrypted_hash}`;
    console.log("▶️ Running:", cmd);

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout);
      resolve(stdout);
    });
  });
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const recordsByPatient = {};

// demo hash (BigInt), NOT secure
function demoHash(input) {
  let h = 0n;
  for (const ch of input) {
    h = (h * 131n + BigInt(ch.charCodeAt(0))) % 10_000_000_000_000_000n; // 10^16
  }
  return h;
}

app.post("/api/records", async (req, res) => {
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

  if (!recordsByPatient[patientShieldAddr]) {
    recordsByPatient[patientShieldAddr] = [];
  }
  recordsByPatient[patientShieldAddr].push(record);

  const plaintextJson = JSON.stringify(record);
  const patient_hash = demoHash(patientShieldAddr);
  const encrypted_hash = demoHash(plaintextJson);

  console.log("✅ Record stored for patient:", patientShieldAddr);
  console.log(
    "✅ Record hashed. patient_hash =",
    patient_hash.toString(),
    "encrypted_hash =",
    encrypted_hash.toString()
  );

  let onChain = null;
  try {
    const cliOutput = await callMidnightUpdate(
      patient_hash.toString(),
      encrypted_hash.toString()
    );
    console.log("🌙 On-chain CLI output:", cliOutput);
    onChain = { rawOutput: cliOutput };
  } catch (err) {
    console.error("❌ Failed to call Midnight CLI:", err);
  }

  return res.json({
    ok: true,
    patient_hash: patient_hash.toString(),
    encrypted_hash: encrypted_hash.toString(),
    record,
    onChain,
  });
});

app.get("/api/records/:patientShieldAddr", (req, res) => {
  const { patientShieldAddr } = req.params;
  const records = recordsByPatient[patientShieldAddr] ?? [];
  return res.json({ ok: true, patientShieldAddr, count: records.length, records });
});

app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});