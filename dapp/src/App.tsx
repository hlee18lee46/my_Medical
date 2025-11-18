import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { getMidnightProvider } from "./midnight-provider";

type WalletState = {
  address?: string; addressLegacy?: string;
  coinPublicKey?: string; coinPublicKeyLegacy?: string;
  encryptionPublicKey?: string; encryptionPublicKeyLegacy?: string;
  balances?: any; [k: string]: any;
};

type UserRole = "patient" | "doctor" | "pharmacy" | "insurance" | null;

type DoctorFormState = {
  patientShieldAddr: string;
  visitDate: string;
  diagnosis: string;
  prescription: string;
  notes: string;
};

function deriveTDustBalanceFromState(s:any): string {
  if (!s) return "—";
  if (s?.balances?.tDUST != null) return String(s.balances.tDUST);
  if (s?.balances?.tdust != null) return String(s.balances.tdust);
  const arrays:any[]=[]; if (Array.isArray(s?.assets)) arrays.push(s.assets);
  if (Array.isArray(s?.balances)) arrays.push(s.balances);
  if (Array.isArray(s?.coins)) arrays.push(s.coins);
  for (const arr of arrays) {
    const hit = arr.find((x:any)=>x?.asset==="tDUST"||x?.ticker==="tDUST"||x?.symbol==="tDUST"||x?.denom==="tDUST");
    if (hit?.amount!=null) return String(hit.amount);
    if (hit?.balance!=null) return String(hit.balance);
    if (hit?.quantity!=null) return String(hit.quantity);
  }
  return "—";
}

function detectProviderLabel(api:any, provider:any): string {
  const m:any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    for (const k of Object.keys(m)) if (m[k]===provider||m[k]===api) return k;
  }
  const c = (window as any)?.cardano?.midnight;
  if (c && (provider===c || api===c)) return "cardano.midnight";
  return api?.providerName ?? provider?.providerName ?? "(auto-detected)";
}
function detectWalletLabel(api:any, provider:any): string {
  return api?.walletName ?? provider?.walletName ?? api?.wallet?.name ?? provider?.wallet?.name ??
         api?.name ?? provider?.name ?? provider?.constructor?.name ?? "—";
}
async function detectApiVersion(api:any, provider:any): Promise<string> {
  const vals = [api?.apiVersion, api?.version, provider?.apiVersion, provider?.version];
  for (const v of vals) if (typeof v === "string" && v) return v;
  const fns = [api?.getVersion, provider?.getVersion, api?.info, provider?.info];
  for (const fn of fns) try { if (typeof fn==="function") { const v = await fn.call(api ?? provider); if (v) return v; } } catch {}
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
  const [capWalletTransfer, setCapWalletTransfer] = useState<boolean|null>(null);
  const [capCoinEnum, setCapCoinEnum] = useState<boolean|null>(null);

  const [shieldAddr, setShieldAddr] = useState("—");
  const [shieldCPK, setShieldCPK] = useState("—");
  const [shieldEPK, setShieldEPK] = useState("—");
  const [legacyAddr, setLegacyAddr] = useState("—");
  const [legacyCPK, setLegacyCPK] = useState("—");
  const [legacyEPK, setLegacyEPK] = useState("—");

  const [role, setRole] = useState<UserRole>(null);

  const [doctorForm, setDoctorForm] = useState<DoctorFormState>({
    patientShieldAddr: "",
    visitDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    diagnosis: "",
    prescription: "",
    notes: "",
  });
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);

  const readState = async (src:any) => {
    if (!src) return null;
    if (typeof src.serializeState === "function") {
      const s = await src.serializeState();
      try { const parsed = typeof s === "string" ? JSON.parse(s) : s; return parsed?.state ?? parsed ?? null; } catch { return null; }
    }
    if (typeof src.state === "function") { const st = await src.state(); return st?.state ?? st ?? null; }
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

      const state: WalletState | null = (await readState(api)) ?? (await readState(provider)) ?? null;
      const address = state?.address ?? state?.addresses?.[0] ?? state?.account?.address ?? "—";
      setAddr(address);
      setTDustBalance(deriveTDustBalanceFromState(state));

      const w = api ?? provider;
      setCapWalletTransfer(
        typeof w?.balanceAndProveTransaction==="function" &&
        typeof w?.submitTransaction==="function"
      );
      setCapCoinEnum(
        typeof w?.listCoins==="function" ||
        typeof w?.getUtxos==="function" ||
        typeof w?.coins==="function" ||
        typeof w?.serializeState==="function" ||
        typeof w?.state==="function"
      );

      setShieldAddr(state?.address ?? "—");
      setShieldCPK(state?.coinPublicKey ?? "—");
      setShieldEPK(state?.encryptionPublicKey ?? "—");
      setLegacyAddr(state?.addressLegacy ?? "—");
      setLegacyCPK(state?.coinPublicKeyLegacy ?? "—");
      setLegacyEPK(state?.encryptionPublicKeyLegacy ?? "—");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    loadWalletInfoNonInteractive();
    const onConnected = (e:Event) => {
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
    setDoctorForm(prev => ({ ...prev, [field]: value }));
    setDoctorStatus(null);
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
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

    console.log("Doctor record payload (MVP, not yet on-chain):", payload);

    // This is where we'll later:
    // 1) Encrypt `payload` to ciphertext
    // 2) Call the Compact contract's add_record(patient, ciphertext)
    setDoctorStatus("✅ Record prepared locally. Next step: send to Midnight contract (coming soon).");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <main style={{ paddingTop:"5rem", paddingBottom:"3rem", textAlign:"center" }}>
        <h1 style={{ fontSize:"2.25rem", marginBottom:"0.5rem", color:"#0f172a" }}>
          Welcome to my_Medical
        </h1>
        <p style={{ color:"#475569", marginBottom:"1.5rem" }}>
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
            value={`walletTransfer=${String(capWalletTransfer)} · coinEnum=${String(capCoinEnum)}`}
          />
        </Card>

        <Card title="Wallet Keys & Addresses" style={{ marginTop:16 }}>
          <Row label="Shield Address" value={shieldAddr} />
          <Row label="Shield CPK" value={shieldCPK} />
          <Row label="Shield EPK" value={shieldEPK} />
          <Row label="Legacy Address" value={legacyAddr} />
          <Row label="Legacy CPK" value={legacyCPK} />
          <Row label="Legacy EPK" value={legacyEPK} />
        </Card>

        {/* Role selection */}
        <Card title="Continue as" style={{ marginTop:16 }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {["patient","doctor","pharmacy","insurance"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                style={{
                  padding:"8px 14px",
                  borderRadius:999,
                  border: role === r ? "2px solid #0f172a" : "1px solid #0f172a",
                  background: role === r ? "#0f172a" : "#ffffff",
                  color: role === r ? "#ffffff" : "#0f172a",
                  fontSize:14,
                  fontWeight:600,
                  cursor:"pointer",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {role && (
            <p style={{ marginTop:12, fontSize:13, color:"#475569" }}>
              Current role: <strong>{roleLabel(role)}</strong>
            </p>
          )}
        </Card>

        {/* Role-specific section: Doctor – create record */}
        {role === "doctor" && (
          <Card title="Doctor: Create Medical Record" style={{ marginTop:16 }}>
            <form onSubmit={handleDoctorSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:13, color:"#475569", marginBottom:4 }}>
                Signed in as doctor (shield address):
                <div style={{ marginTop:4 }}>
                  <code
                    style={{
                      background:"#0f172a",
                      border:"1px solid #1e293b",
                      borderRadius:6,
                      padding:"6px 8px",
                      whiteSpace:"nowrap",
                      overflow:"hidden",
                      textOverflow:"ellipsis",
                      color:"#e5e7eb",
                      fontSize:12
                    }}
                    title={shieldAddr}
                  >
                    {shieldAddr}
                  </code>
                </div>
              </div>

              <Field
                label="Patient Shield Address"
                required
              >
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
                  alignSelf:"flex-start",
                  padding:"8px 16px",
                  borderRadius:999,
                  border:"none",
                  background:"#0f172a",
                  color:"#ffffff",
                  fontWeight:600,
                  fontSize:14,
                  cursor:"pointer",
                  marginTop:4,
                }}
              >
                Save Record (MVP, local only)
              </button>

              {doctorStatus && (
                <p style={{ marginTop:8, fontSize:13, color: doctorStatus.startsWith("✅") ? "#16a34a" : "#b91c1c" }}>
                  {doctorStatus}
                </p>
              )}
            </form>
          </Card>
        )}

        {/* Placeholder for other roles */}
        {role && role !== "doctor" && (
          <Card title={`${roleLabel(role)} dashboard`} style={{ marginTop:16 }}>
            <p style={{ fontSize:14, color:"#475569" }}>
              Role-specific flows for <strong>{roleLabel(role)}</strong> are coming next.
              For now, you can connect your wallet and choose a role.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:"100%",
  padding:"8px 10px",
  borderRadius:8,
  border:"1px solid #cbd5f5",
  fontSize:14,
  outline:"none",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  resize:"vertical",
};

function Card({ title, children, onRefresh, loading, style }:{
  title:string; children:React.ReactNode; onRefresh?:()=>void; loading?:boolean; style?:React.CSSProperties;
}) {
  return (
    <div style={{
      background:"#ffffff",
      color:"#1e293b",
      padding:16,
      borderRadius:12,
      maxWidth:960,
      margin:"0 auto",
      textAlign:"left",
      border:"2px solid #000",
      ...style
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <strong>{title}</strong>
        {onRefresh && (
          <button onClick={onRefresh} disabled={!!loading} style={{
            padding:"6px 12px",
            borderRadius:8,
            border:"1px solid #000",
            background:"#f1f5f9",
            color:"#000",
            cursor:"pointer",
            fontSize:13,
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }:{ label:string; value:string }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"180px 1fr",
      gap:8,
      alignItems:"center",
      margin:"6px 0"
    }}>
      <div style={{ color:"#2563eb", fontSize:13 }}>{label}</div>
      <code
        style={{
          background:"#0f172a",
          border:"1px solid #1e293b",
          borderRadius:6,
          padding:"6px 8px",
          whiteSpace:"nowrap",
          overflow:"hidden",
          textOverflow:"ellipsis",
          color:"#e5e7eb",
          fontSize:12
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
    <label style={{ display:"block", textAlign:"left", fontSize:13 }}>
      <span style={{ display:"inline-block", marginBottom:4, color:"#0f172a" }}>
        {label}{required && <span style={{ color:"#b91c1c" }}> *</span>}
      </span>
      {children}
    </label>
  );
}