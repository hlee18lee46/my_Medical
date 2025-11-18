import { useState } from "react";
import { getMidnightProvider } from "../midnight-provider";
import midnightLogo from "../assets/midnight.jpg"; // ← add this

export default function Navbar() {
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    try {
      const provider = getMidnightProvider();
      if (!provider)
        throw new Error(
          "Midnight provider not injected. Open Lace (Midnight testnet profile) and reload."
        );

      const api =
        typeof provider.enable === "function"
          ? await provider.enable()
          : provider;

      setConnected(true);

      window.dispatchEvent(
        new CustomEvent("midnight:connected", { detail: { api, provider } })
      );
    } catch (err: any) {
      alert(err?.message || String(err));
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <nav
      style={{
        backgroundColor: "#0A0A0B",
        color: "white",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        boxShadow: "0px 1px 4px rgba(0,0,0,0.4)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img
          src={midnightLogo}
          alt="Midnight"
          style={{ height: "42px", borderRadius: "6px" }}
        />
        <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Midnight immutableMedical
        </span>
      </div>

      {/* Wallet Button */}
      <button
        onClick={connectWallet}
        style={{
          padding: "0.55rem 1rem",
          borderRadius: "8px",
          border: "1px solid #333",
          backgroundColor: connected ? "#4f46e5" : "#1f2937",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {connected ? "Connected" : "Connect Wallet"}
      </button>
    </nav>
  );
}