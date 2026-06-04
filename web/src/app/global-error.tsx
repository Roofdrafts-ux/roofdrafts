"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>roofdrafts</div>
            <h1 style={{ fontSize: 26 }}>Something went wrong</h1>
            <p style={{ color: "#777", marginBottom: 20 }}>A critical error occurred. Please try again.</p>
            <button onClick={reset} style={{ background: "#BE5630", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
            {error?.digest && <p style={{ color: "#aaa", fontSize: 12, marginTop: 16 }}>Ref: {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}
