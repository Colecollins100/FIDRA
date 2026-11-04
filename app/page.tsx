"use client";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 42 }}>FIDRA 🛡️</h1>
      <p>Check if that message, link or investment is a scam — before you send money.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the WhatsApp message, link or investment promise here..."
        style={{ width: "100%", height: 140, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1" }}
      />
      <button onClick={check} style={{ marginTop: 12, padding: "12px 20px", borderRadius: 12, background: "#0f172a", color: "white", border: 0, fontWeight: 700 }}>
        {loading ? "Checking..." : "Check Now"}
      </button>
      {result && (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e2e8f0" }}>
          <h2>Score: {result.score}/100 — {result.verdict}</h2>
          <p>{result.reason}</p>
          <ul>{result.flags?.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
        </div>
      )}
      <p style={{ marginTop: 30, fontSize: 13, color: "#64748b" }}>FIDRA does not give financial advice. If it looks too good to be true, do not send money.</p>
    </main>
  );
}
