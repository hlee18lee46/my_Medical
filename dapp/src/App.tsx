// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { getMidnightProvider } from "./midnight-provider";
import { QRCodeCanvas as QRCode } from "qrcode.react"; // QR code

type WalletState = {
  address?: string;
  addressLegacy?: string;
  coinPublicKey?: string;
  coinPublicKeyLegacy?: string;
  encryptionPublicKey?: string;
  encryptionPublicKeyLegacy?: string;
  balances?: any;
  [k: string]: any;
};

type UserRole = "patient" | "doctor" | "pharmacy" | "insurance" | null;

type DoctorFormState = {
  patientShieldAddr: string;
  visitDate: string;
  diagnosis: string;
  prescription: string;
  notes: string;
};

type MedicalRecord = {
  doctorShieldAddr: string;
  patientShieldAddr: string;
  visitDate: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  createdAt: string;
};

function deriveTDustBalanceFromState(s: any): string {
  if (!s) return "—";
  if (s?.balances?.tDUST != null) return String(s.balances.tDUST);
  if (s?.balances?.tdust != null) return String(s.balances.tdust);
  const arrays: any[] = [];
  if (Array.isArray(s?.assets)) arrays.push(s.assets);
  if (Array.isArray(s?.balances)) arrays.push(s.balances);
  if (Array.isArray(s?.coins)) arrays.push(s.coins);
  for (const arr of arrays) {
    const hit = arr.find(
      (x: any) =>
        x?.asset === "tDUST" ||
        x?.ticker === "tDUST" ||
        x?.symbol === "tDUST" ||
        x?.denom === "tDUST"
    );
    if (hit?.amount != null) return String(hit.amount);
    if (hit?.balance != null) return String(hit.balance);
    if (hit?.quantity != null) return String(hit.quantity);
  }
  return "—";
}

function detectProviderLabel(api: any, provider: any): string {
  const m: any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    for (const k of Object.keys(m)) if (m[k] === provider || m[k] === api) return k;
  }
  const c = (window as any)?.cardano?.midnight;
  if (c && (provider === c || api === c)) return "cardano.midnight";
  return api?.providerName ?? provider?.providerName ?? "(auto-detected)";
}

function detectWalletLabel(api: any, provider: any): string {
  return (
    api?.walletName ??
    provider?.walletName ??
    api?.wallet?.name ??
    provider?.wallet?.name ??
    api?.name ??
    provider?.name ??
    provider?.constructor?.name ??
    "—"
  );
}

async function detectApiVersion(api: any, provider: any): Promise<string> {
  const vals = [api?.apiVersion, api?.version, provider?.apiVersion, provider?.version];
  for (const v of vals) if (typeof v === "string" && v) return v;
  const fns = [api?.getVersion, provider?.getVersion, api?.info, provider?.info];
  for (const fn of fns) {
    try {
      if (typeof fn === "function") {
        const v = await fn.call(api ?? provider);
        if (v) return v;
      }
    } catch {
      // ignore
    }
  }
  return "—";
}

export default function App() {
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const [providerName, setProviderName] = useState("(auto-detected)");
  const [walletName, setWalletName] = useState("—");
  const [apiVersion, setApiVersion] = useState("—");
  const [addr, setAddr] = useState("—");
  const [tDustBalance, setTDustBalance] = useState("—");
  const [capWalletTransfer, setCapWalletTransfer] = useState<boolean | null>(null);
  const [capCoinEnum, setCapCoinEnum] = useState<boolean | null>(null);

  const [shieldAddr, setShieldAddr] = useState("—");
  const [shieldCPK, setShieldCPK] = useState("—");
  const [shieldEPK, setShieldEPK] = useState("—");
  const [legacyAddr, setLegacyAddr] = useState("—");
  const [legacyCPK, setLegacyCPK] = useState("—");
  const [legacyEPK, setLegacyEPK] = useState("—");

  const [role, setRole] = useState<UserRole>(null);

  const [doctorForm, setDoctorForm] = useState<DoctorFormState>({
    patientShieldAddr: "",
    visitDate: new Date().toISOString().slice(0, 10),
    diagnosis: "",
    prescription: "",
    notes: "",
  });
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);

  // Patient view state
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[] | null>(null);
  const [patientStatus, setPatientStatus] = useState<string | null>(null);

  // Patient consent / sharing state
  const [doctorToAuthorize, setDoctorToAuthorize] = useState<string>("");
  const [consentStatus, setConsentStatus] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const readState = async (src: any) => {
    if (!src) return null;
    if (typeof src.serializeState === "function") {
      const s = await src.serializeState();
      try {
        const parsed = typeof s === "string" ? JSON.parse(s) : s;
        return parsed?.state ?? parsed ?? null;
      } catch {
        return null;
      }
    }
    if (typeof src.state === "function") {
      const st = await src.state();
      return st?.state ?? st ?? null;
    }
    return null;
  };

  async function loadWalletInfoNonInteractive(ctx?: { api?: any; provider?: any }) {
    setLoading(true);
    try {
      const provider = ctx?.provider ?? getMidnightProvider();
      const api = ctx?.api ?? apiRef.current ?? null;
      if (ctx?.api) apiRef.current = ctx.api;
      if (!provider && !api) return;

      setProviderName(detectProviderLabel(api, provider));
      setWalletName(detectWalletLabel(api, provider));
      setApiVersion(await detectApiVersion(api, provider));

      const state: WalletState | null =
        (await readState(api)) ?? (await readState(provider)) ?? null;
      const address = state?.address ?? state?.addresses?.[0] ?? state?.account?.address ?? "—";
      setAddr(address);
      setTDustBalance(deriveTDustBalanceFromState(state));

      const w = api ?? provider;
      setCapWalletTransfer(
        typeof w?.balanceAndProveTransaction === "function" &&
          typeof w?.submitTransaction === "function"
      );
      setCapCoinEnum(
        typeof w?.listCoins === "function" ||
          typeof w?.getUtxos === "function" ||
          typeof w?.coins === "function" ||
          typeof w?.serializeState === "function" ||
          typeof w?.state === "function"
      );

      setShieldAddr(state?.address ?? "—");
      setShieldCPK(state?.coinPublicKey ?? "—");
      setShieldEPK(state?.encryptionPublicKey ?? "—");
      setLegacyAddr(state?.addressLegacy ?? "—");
      setLegacyCPK(state?.coinPublicKeyLegacy ?? "—");
      setLegacyEPK(state?.encryptionPublicKeyLegacy ?? "—");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWalletInfoNonInteractive();
    const onConnected = (e: Event) => {
      const { api, provider } = (e as CustomEvent).detail || {};
      loadWalletInfoNonInteractive({ api, provider });
    };
    window.addEventListener("midnight:connected", onConnected);
    return () => window.removeEventListener("midnight:connected", onConnected);
  }, []);

  const roleLabel = (r: UserRole) => {
    if (r === "patient") return "Patient";
    if (r === "doctor") return "Doctor";
    if (r === "pharmacy") return "Pharmacy";
    if (r === "insurance") return "Insurance";
    return "—";
  };

  const handleDoctorChange = (field: keyof DoctorFormState, value: string) => {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
    setDoctorStatus(null);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorStatus(null);

    if (!doctorForm.patientShieldAddr.trim()) {
      setDoctorStatus("❗ Please enter the patient's shield address.");
      return;
    }
    if (!doctorForm.diagnosis.trim() && !doctorForm.prescription.trim()) {
      setDoctorStatus("❗ Enter at least a diagnosis or a prescription.");
      return;
    }

    const payload = {
      doctorShieldAddr: shieldAddr,
      patientShieldAddr: doctorForm.patientShieldAddr.trim(),
      visitDate: doctorForm.visitDate,
      diagnosis: doctorForm.diagnosis.trim(),
      prescription: doctorForm.prescription.trim(),
      notes: doctorForm.notes.trim(),
    };

    try {
      const res = await fetch("http://localhost:4000/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        setDoctorStatus("❌ Backend error while preparing record.");
        return;
      }

      const data = await res.json();
      console.log("Backend response:", data);

      setDoctorStatus(
        `✅ Record hashed.\npatient_hash = ${data.patient_hash}\nencrypted_hash = ${data.encrypted_hash}`
      );
    } catch (err) {
      console.error(err);
      setDoctorStatus("❌ Network error talking to backend.");
    }
  };

  const handleFetchPatientRecords = async () => {
    setPatientStatus(null);

    if (!shieldAddr || shieldAddr === "—") {
      setPatientStatus("❗ Connect your Midnight wallet first.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/records/${encodeURIComponent(shieldAddr)}`
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error fetching records:", text);
        setPatientStatus("❌ Backend error while fetching your records.");
        return;
      }

      const data = await res.json();
      console.log("Patient records response:", data);

      const list: MedicalRecord[] = data.records || [];
      setPatientRecords(list);

      if (list.length === 0) {
        setPatientStatus("ℹ️ No records found for your shield address yet.");
      } else {
        setPatientStatus(`✅ Loaded ${list.length} record(s).`);
      }
    } catch (err) {
      console.error(err);
      setPatientStatus("❌ Network error talking to backend.");
    }
  };

  // --- Sign consent & get share token (patient → doctor) ---
  const handleSignConsentForDoctor = async () => {
    setConsentStatus(null);
    setShareToken(null);

    if (!shieldAddr || shieldAddr === "—") {
      setConsentStatus("❗ Connect your Midnight wallet first.");
      return;
    }
    if (!doctorToAuthorize.trim()) {
      setConsentStatus("❗ Enter the doctor's shield address to authorize.");
      return;
    }

    try {
      // 1) Build consent payload
      const expiryIso = new Date(
        Date.now() + 7 * 24 * 3600_000 // 7 days
      ).toISOString();
      const nonce =
        (window as any).crypto?.randomUUID?.() ?? String(Date.now());

      const messagePayload = {
        type: "MEDICAL_RECORD_VIEW_CONSENT",
        patientShieldAddr: shieldAddr,
        doctorShieldAddr: doctorToAuthorize.trim(),
        expiry: expiryIso,
        nonce,
      };
      const message = JSON.stringify(messagePayload);

      // 2) Get provider/api
      const provider = getMidnightProvider();
      const api: any = apiRef.current ?? provider ?? (window as any).cardano?.midnight;

      if (!api) {
        setConsentStatus("❌ No Midnight provider available to sign.");
        return;
      }

      // 3) Try wallet signing (pseudocode – depends on Lace Midnight API)
      let sig: any = null;

      if (typeof api.signData === "function") {
        sig = await api.signData({
          address: shieldAddr,
          payload: message,
        });
      } else if (typeof api.signMessage === "function") {
        sig = await api.signMessage(message);
      } else if (api.experimental?.signMessage) {
        sig = await api.experimental.signMessage({ message });
      } else {
        console.error("No signing method found on Midnight provider", api);
        setConsentStatus("❌ Signing not supported by this wallet build.");
        return;
      }

      console.log("Signature result:", sig);

      // 4) Send to backend for verification & share token creation
      const res = await fetch("http://localhost:4000/api/records/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientShieldAddr: shieldAddr,
          doctorShieldAddr: doctorToAuthorize.trim(),
          message: messagePayload,
          signature: sig,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Consent backend error:", txt);
        setConsentStatus("❌ Failed to create share link (backend error).");
        return;
      }

      const data = await res.json();
      console.log("Share token response:", data);

      setShareToken(data.shareToken);
      setConsentStatus("✅ Consent signed and share QR generated.");
    } catch (err) {
      console.error(err);
      setConsentStatus("❌ Failed to sign consent or contact backend.");
    }
  };

  // --- QR payload logic ---

  // If shareToken exists: QR encodes only the token (no URL, no shield address)
  // Otherwise: fallback demo QR with inline record data
  const qrPayload = shareToken
    ? JSON.stringify({
        type: "myMedical_share_v1",
        shareToken,
      })
    : JSON.stringify({
        type: "myMedical_v1_demo",
        records: (patientRecords ?? []).map((r) => ({
          visitDate: r.visitDate,
          diagnosis: r.diagnosis,
          prescription: r.prescription,
          notes: r.notes,
          doctorShieldAddr: r.doctorShieldAddr,
          createdAt: r.createdAt,
        })),
      });

  // For UI only: quick summary of the latest record
  const latestRecord =
    patientRecords && patientRecords.length > 0
      ? patientRecords[patientRecords.length - 1]
      : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <main style={{ paddingTop: "5rem", paddingBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.5rem", color: "#0f172a" }}>
          Welcome to zkMedical
        </h1>
        <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
          Secure healthcare access with your Midnight Lace wallet.
        </p>

        {/* Wallet summary cards */}
        <Card
          title="Wallet Summary"
          onRefresh={() => loadWalletInfoNonInteractive()}
          loading={loading}
        >
          <Row label="Provider" value={providerName} />
          <Row label="Wallet" value={walletName} />
          <Row label="API version" value={apiVersion} />
          <Row label="Address (heuristic)" value={addr} />
          <Row label="tDUST Balance" value={tDustBalance} />
          <Row
            label="Capabilities"
            value={`walletTransfer=${String(capWalletTransfer)} · coinEnum=${String(
              capCoinEnum
            )}`}
          />
        </Card>

        <Card title="Wallet Keys & Addresses" style={{ marginTop: 16 }}>
          <Row label="Shield Address" value={shieldAddr} />
          <Row label="Shield CPK" value={shieldCPK} />
          <Row label="Shield EPK" value={shieldEPK} />
          <Row label="Legacy Address" value={legacyAddr} />
          <Row label="Legacy CPK" value={legacyCPK} />
          <Row label="Legacy EPK" value={legacyEPK} />
        </Card>

        {/* Role selection */}
        <Card title="Continue as" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["patient", "doctor", "pharmacy", "insurance"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: role === r ? "2px solid #0f172a" : "1px solid #0f172a",
                  background: role === r ? "#0f172a" : "#ffffff",
                  color: role === r ? "#ffffff" : "#0f172a",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {role && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#475569" }}>
              Current role: <strong>{roleLabel(role)}</strong>
            </p>
          )}
        </Card>

        {/* Doctor – create record */}
        {role === "doctor" && (
          <Card title="Doctor: Create Medical Record" style={{ marginTop: 16 }}>
            <form
              onSubmit={handleDoctorSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>
                Signed in as doctor (shield address):
                <div style={{ marginTop: 4 }}>
                  <code
                    style={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 6,
                      padding: "6px 8px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                    title={shieldAddr}
                  >
                    {shieldAddr}
                  </code>
                </div>
              </div>

              <Field label="Patient Shield Address" required>
                <input
                  type="text"
                  value={doctorForm.patientShieldAddr}
                  onChange={(e) => handleDoctorChange("patientShieldAddr", e.target.value)}
                  placeholder="mn_shield-addr_test1..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Visit Date">
                <input
                  type="date"
                  value={doctorForm.visitDate}
                  onChange={(e) => handleDoctorChange("visitDate", e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Diagnosis">
                <textarea
                  value={doctorForm.diagnosis}
                  onChange={(e) => handleDoctorChange("diagnosis", e.target.value)}
                  rows={2}
                  placeholder="e.g. Type 2 Diabetes, mild..."
                  style={textAreaStyle}
                />
              </Field>

              <Field label="Prescription">
                <textarea
                  value={doctorForm.prescription}
                  onChange={(e) => handleDoctorChange("prescription", e.target.value)}
                  rows={2}
                  placeholder="e.g. Metformin 500mg, take twice daily..."
                  style={textAreaStyle}
                />
              </Field>

              <Field label="Additional Notes">
                <textarea
                  value={doctorForm.notes}
                  onChange={(e) => handleDoctorChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Lifestyle recommendations, follow-up schedule, etc."
                  style={textAreaStyle}
                />
              </Field>

              <button
                type="submit"
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                Save & Hash Record
              </button>

              {doctorStatus && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    whiteSpace: "pre-line",
                    color: doctorStatus.startsWith("✅") ? "#16a34a" : "#b91c1c",
                  }}
                >
                  {doctorStatus}
                </p>
              )}
            </form>
          </Card>
        )}

        {/* Patient – QR + records + signed consent */}
        {role === "patient" && (
          <Card title="Patient: Share & View My Medical Records" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
              Connected shield address:
              <div style={{ marginTop: 4 }}>
                <code
                  style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 6,
                    padding: "6px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#e5e7eb",
                    fontSize: 12,
                  }}
                  title={shieldAddr}
                >
                  {shieldAddr}
                </code>
              </div>
            </div>

            {/* Consent: choose doctor + sign */}
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              <div style={{ marginBottom: 6, color: "#0f172a", fontWeight: 600 }}>
                Grant view consent to a doctor
              </div>
              <label style={{ display: "block", marginBottom: 8 }}>
                <span style={{ display: "inline-block", marginBottom: 4 }}>
                  Doctor shield address
                </span>
                <input
                  type="text"
                  value={doctorToAuthorize}
                  onChange={(e) => {
                    setDoctorToAuthorize(e.target.value);
                    setConsentStatus(null);
                    setShareToken(null);
                  }}
                  placeholder="mn_shield-addr_test1doctor..."
                  style={{
                    ...inputStyle,
                    fontSize: 12,
                  }}
                />
              </label>
              <button
                type="button"
                onClick={handleSignConsentForDoctor}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Sign consent & generate QR
              </button>
              {consentStatus && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: consentStatus.startsWith("✅") ? "#16a34a" : "#b91c1c",
                  }}
                >
                  {consentStatus}
                </p>
              )}
            </div>

            {/* QR + metadata preview */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, marginBottom: 8, color: "#0f172a" }}>
                  Show this QR code to the authorized doctor or service.
                </p>
                <div
                  style={{
                    background: "#ffffff",
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    display: "inline-block",
                  }}
                >
                  <QRCode value={qrPayload} size={180} includeMargin />
                </div>
                <p style={{ fontSize: 11, marginTop: 6, color: "#64748b" }}>
                  Encodes a signed consent token (no wallet address, no backend URL).
                </p>
                {shareToken && (
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: "#94a3b8",
                      wordBreak: "break-all",
                    }}
                  >
                    Token: {shareToken.slice(0, 12)}… (short-lived)
                  </p>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  fontSize: 12,
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px dashed #cbd5e1",
                  padding: 10,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: "#0f172a" }}>
                  QR metadata preview
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Records loaded locally:</strong>{" "}
                  {patientRecords ? patientRecords.length : 0}
                </div>
                {latestRecord ? (
                  <>
                    <div style={{ marginTop: 6 }}>
                      <strong>Latest record (summary):</strong>
                    </div>
                    <div>Date: {latestRecord.visitDate}</div>
                    {latestRecord.diagnosis && (
                      <div>Diagnosis: {latestRecord.diagnosis}</div>
                    )}
                    {latestRecord.prescription && (
                      <div>Rx: {latestRecord.prescription}</div>
                    )}
                    {latestRecord.notes && <div>Notes: {latestRecord.notes}</div>}
                  </>
                ) : (
                  <div style={{ marginTop: 6, color: "#64748b" }}>
                    No records yet — once a doctor adds data and you fetch it, the QR
                    becomes meaningful.
                  </div>
                )}
                {!shareToken && (
                  <div style={{ marginTop: 8, color: "#64748b" }}>
                    <em>
                      Tip: sign consent to generate a tokenized QR instead of embedding
                      full data.
                    </em>
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 13, marginBottom: 6, color: "#0f172a" }}>
              Your Records
            </div>

            <button
              type="button"
              onClick={handleFetchPatientRecords}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: "#0f172a",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Fetch from backend
            </button>

            {patientStatus && (
              <p
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: patientStatus.startsWith("✅")
                    ? "#16a34a"
                    : patientStatus.startsWith("ℹ️")
                    ? "#0369a1"
                    : "#b91c1c",
                }}
              >
                {patientStatus}
              </p>
            )}

            {patientRecords && patientRecords.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {patientRecords.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 10,
                      background: "#f8fafc",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong>Date:</strong> {rec.visitDate}
                    </div>
                    {rec.diagnosis && (
                      <div>
                        <strong>Diagnosis:</strong> {rec.diagnosis}
                      </div>
                    )}
                    {rec.prescription && (
                      <div>
                        <strong>Prescription:</strong> {rec.prescription}
                      </div>
                    )}
                    {rec.notes && (
                      <div>
                        <strong>Notes:</strong> {rec.notes}
                      </div>
                    )}
                    <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                      <strong>Doctor shield address:</strong>{" "}
                      <span style={{ wordBreak: "break-all" }}>{rec.doctorShieldAddr}</span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 11 }}>
                      Created at: {new Date(rec.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Other roles */}
        {role && role !== "doctor" && role !== "patient" && (
          <Card title={`${roleLabel(role)} dashboard`} style={{ marginTop: 16 }}>
            <p style={{ fontSize: 14, color: "#475569" }}>
              Role-specific flows for <strong>{roleLabel(role)}</strong> are coming next. For now,
              you can connect your wallet and choose a role.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5f5",
  fontSize: 14,
  outline: "none",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

function Card({
  title,
  children,
  onRefresh,
  loading,
  style,
}: {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "#1e293b",
        padding: 16,
        borderRadius: 12,
        maxWidth: 960,
        margin: "0 auto",
        textAlign: "left",
        border: "2px solid #000",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>{title}</strong>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={!!loading}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #000",
              background: "#f1f5f9",
              color: "#000",
              cursor: "pointer",
              fontSize: 13,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 8,
        alignItems: "center",
        margin: "6px 0",
      }}
    >
      <div style={{ color: "#2563eb", fontSize: 13 }}>{label}</div>
      <code
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 6,
          padding: "6px 8px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#e5e7eb",
          fontSize: 12,
        }}
        title={value}
      >
        {value}
      </code>
    </div>
  );
}

function Field(props: { label: string; required?: boolean; children: React.ReactNode }) {
  const { label, required, children } = props;
  return (
    <label style={{ display: "block", textAlign: "left", fontSize: 13 }}>
      <span style={{ display: "inline-block", marginBottom: 4, color: "#0f172a" }}>
        {label}
        {required && <span style={{ color: "#b91c1c" }}> *</span>}
      </span>
      {children}
    </label>
  );
}