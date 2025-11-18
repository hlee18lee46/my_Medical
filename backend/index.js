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
// backend/index.js (or .ts)

app.post("/api/records/consent", async (req, res) => {
  const { patientShieldAddr, doctorShieldAddr, message, signature } = req.body ?? {};
  if (!patientShieldAddr || !doctorShieldAddr || !message || !signature) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }

  // TODO: verify the signature using Midnight’s verification lib or public key
  // This usually needs:
  //  - recover the public key from signature + message
  //  - check that it corresponds to patientShieldAddr

  const isValid = true; // <— replace with real verification
  if (!isValid) {
    return res.status(400).json({ ok: false, error: "invalid_signature" });
  }

  // If valid, create a short share token
  const shareToken = crypto.randomUUID(); // or shorter hash/token

  // Store in some in-memory or DB consent map
  consents[shareToken] = {
    patientShieldAddr,
    doctorShieldAddr,
    message,
    signature,
  };

  return res.json({ ok: true, shareToken });
});

// Doctor / viewer uses this share URL
app.get("/api/records/share/:token", (req, res) => {
  const token = req.params.token;
  const consent = consents[token];
  if (!consent) {
    return res.status(404).json({ ok: false, error: "invalid_token" });
  }

  // Optional: check consent.message.expiry and that it's still valid

  const records = recordsByPatient[consent.patientShieldAddr] ?? [];
  return res.json({ ok: true, patientShieldAddr: consent.patientShieldAddr, records });
});
app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
});