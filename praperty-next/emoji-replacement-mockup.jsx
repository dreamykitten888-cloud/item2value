import { useState } from "react"

// Category color system - replaces emojis entirely
const CATEGORY_COLORS = {
  Sneakers: { bg: "#E8634A", text: "#fff", letter: "S" },
  Fashion: { bg: "#E8634A", text: "#fff", letter: "F" },
  Electronics: { bg: "#2BA8A0", text: "#fff", letter: "E" },
  Watches: { bg: "#5B7FB5", text: "#fff", letter: "W" },
  "Trading Cards": { bg: "#9B6DD7", text: "#fff", letter: "T" },
  Automotive: { bg: "#7A8891", text: "#fff", letter: "A" },
  Collectibles: { bg: "#D4943A", text: "#fff", letter: "C" },
  Jewelry: { bg: "#C47A8A", text: "#fff", letter: "J" },
  Art: { bg: "#5B5FC7", text: "#fff", letter: "A" },
  LEGO: { bg: "#D4943A", text: "#fff", letter: "L" },
  Gaming: { bg: "#2BA8A0", text: "#fff", letter: "G" },
  Other: { bg: "#6B7A5E", text: "#fff", letter: "O" },
}

const getColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other

// Fake photo URLs (colored gradients to simulate real photos)
const fakePhoto = (hue) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue},40%,35%)"/><stop offset="100%" stop-color="hsl(${hue+30},50%,25%)"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><text x="40" y="48" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="20" font-family="sans-serif">📷</text></svg>`)}`

export default function MockupComparison() {
  const [view, setView] = useState("new") // "old" or "new"
  const [section, setSection] = useState("all") // "movers", "sold", "watchlist", "additem", "all"

  const movers = [
    { name: "Air Jordan 1 Retro", cat: "Sneakers", brand: "Nike", change: 15.3, photo: null },
    { name: "Pokemon Charizard", cat: "Trading Cards", brand: "Pokemon", change: -6.5, photo: fakePhoto(40) },
    { name: "Rolex Submariner", cat: "Watches", brand: "Rolex", change: 7.5, photo: fakePhoto(210) },
    { name: "MacBook Pro 14\"", cat: "Electronics", brand: "Apple", change: -6.8, photo: null },
    { name: "Supreme Box Logo", cat: "Fashion", brand: "Supreme", change: 7.1, photo: null },
  ]

  const sold = [
    { name: "Air Jordan 4 Retro", cat: "Sneakers", brand: "Nike", price: 385, days: 2, platform: "StockX", photo: fakePhoto(15) },
    { name: "Omega Speedmaster", cat: "Watches", brand: "Omega", price: 6200, days: 1, platform: "eBay", photo: null },
    { name: "iPad Pro M4", cat: "Electronics", brand: "Apple", price: 950, days: 3, platform: "Mercari", photo: fakePhoto(190) },
  ]

  const watchlist = [
    { name: "Toyota Supra MK4", cat: "Automotive", brand: "Toyota", price: 45000, change: 2.3, photo: null },
    { name: "Brembo GT Brake Kit", cat: "Automotive", brand: "Brembo", price: 3200, change: -1.1, photo: null },
    { name: "Nike Dunk Low Panda", cat: "Sneakers", brand: "Nike", price: 115, change: 4.2, photo: fakePhoto(0) },
    { name: "PS5 Pro", cat: "Electronics", brand: "Sony", price: 699, change: -0.5, photo: fakePhoto(220) },
  ]

  const suggestions = [
    { name: "Toyota Supra MK4 Turbo", cat: "Automotive", brand: "Toyota", photo: null },
    { name: "Toyota Supra MK5 GR", cat: "Automotive", brand: "Toyota", photo: null },
    { name: "Toyota Supra MKIII", cat: "Automotive", brand: "Toyota", photo: null },
  ]

  const emojis = { Sneakers: "👟", Electronics: "📱", Watches: "⌚", "Trading Cards": "🃏", Automotive: "🚗", Fashion: "👕", Collectibles: "🏆", LEGO: "🧱" }
  const getEmoji = (cat) => emojis[cat] || "📦"

  // Category indicator component (the replacement)
  const CatDot = ({ cat, photo, size = 32 }) => {
    const c = getColor(cat)
    const s = { width: size, height: size, minWidth: size, borderRadius: size / 2 }
    if (photo) {
      return <img src={photo} alt="" style={{ ...s, objectFit: "cover" }} />
    }
    return (
      <div style={{
        ...s,
        background: c.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: "rgba(255,255,255,0.9)",
        fontFamily: "'Sora', sans-serif",
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}>
        {c.letter}
      </div>
    )
  }

  const isNew = view === "new"

  return (
    <div style={{
      background: "#0a0b08",
      color: "#fff",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
    }}>
      {/* Toggle bar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "16px 20px 12px",
        background: "linear-gradient(to bottom, #0a0b08 70%, transparent)",
      }}>
        <p style={{ fontSize: 11, color: "#6b7a5e", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6, fontWeight: 600 }}>
          PrÄperty Visual System
        </p>
        <div style={{ display: "flex", gap: 4, background: "rgba(78,113,69,0.1)", borderRadius: 12, padding: 3 }}>
          {[
            { id: "old", label: "Current (Emojis)" },
            { id: "new", label: "Proposed (Category System)" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Sora', sans-serif",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: view === t.id ? "#EB9C35" : "transparent",
                color: view === t.id ? "#0a0b08" : "#6b7a5e",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Color legend (only in new view) */}
        {isNew && (
          <div style={{
            marginTop: 10,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}>
            {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, c]) => (
              <div key={cat} style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px 3px 4px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: c.bg,
                  fontSize: 7,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.9)",
                }}>{c.letter}</div>
                <span style={{ fontSize: 9, color: "#6b7a5e", fontWeight: 500 }}>{cat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MARKET MOVERS */}
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>Market Movers</h2>
          <span style={{ fontSize: 11, color: "#EB9C35", fontWeight: 600 }}>All Alerts</span>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {movers.map((m, i) => {
            const isUp = m.change >= 0
            return (
              <div key={i} style={{
                background: "rgba(78,113,69,0.06)",
                border: "1px solid rgba(78,113,69,0.12)",
                borderTop: `3px solid ${isUp ? "#4ade80" : "#f87171"}`,
                borderRadius: 16,
                padding: 14,
                minWidth: 148,
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {isNew ? (
                    <CatDot cat={m.cat} photo={m.photo} size={28} />
                  ) : (
                    <span style={{ fontSize: 18 }}>{getEmoji(m.cat)}</span>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 95 }}>{m.name}</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: isUp ? "#4ade80" : "#f87171" }}>
                  {isUp ? "+" : ""}{m.change.toFixed(1)}%
                </p>
                <p style={{ fontSize: 9, color: "#6b7a5e", marginTop: 2 }}>
                  {isUp ? "+" : "-"}${Math.abs(Math.round(m.change * 22)).toLocaleString()} since last update
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* SIMILAR ITEMS SOLD */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>Similar Items Sold</h2>
          <span style={{ fontSize: 9, color: "#6b7a5e", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 }}>Based on your inventory</span>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {sold.map((s, i) => (
            <div key={i} style={{
              background: "rgba(78,113,69,0.06)",
              border: "1px solid rgba(78,113,69,0.12)",
              borderTop: "3px solid #a855f7",
              borderRadius: 16,
              padding: 14,
              minWidth: 170,
              maxWidth: 195,
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {isNew ? (
                  <CatDot cat={s.cat} photo={s.photo} size={28} />
                ) : (
                  <span style={{ fontSize: 18 }}>{getEmoji(s.cat)}</span>
                )}
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{s.name}</p>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "#a855f7" }}>${s.price.toLocaleString()}</p>
              <p style={{ fontSize: 9, color: "#6b7a5e", marginTop: 4 }}>Sold {s.days}d ago on {s.platform}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WATCHLIST */}
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>Watchlist</h2>
          <span style={{ fontSize: 9, color: "#6b7a5e", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 }}>4</span>
        </div>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, padding: "0 4px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 9, color: "#6b7a5e", textTransform: "uppercase", letterSpacing: "0.08em" }}>Item</span>
          <span style={{ fontSize: 9, color: "#6b7a5e", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", minWidth: 60 }}>Mkt Value</span>
          <span style={{ fontSize: 9, color: "#6b7a5e", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", minWidth: 65 }}>Daily Chg</span>
        </div>

        {watchlist.map((w, i) => {
          const isUp = w.change >= 0
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 8,
              alignItems: "center",
              padding: "10px 4px",
              borderBottom: i < watchlist.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {isNew ? (
                  <CatDot cat={w.cat} photo={w.photo} size={26} />
                ) : (
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{getEmoji(w.cat)}</span>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</p>
                  <p style={{ fontSize: 9, color: "#6b7a5e" }}>{w.brand}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "right", minWidth: 60 }}>
                ${w.price >= 1000 ? (w.price / 1000).toFixed(1) + "k" : w.price}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, textAlign: "right", minWidth: 65, color: isUp ? "#4ade80" : "#f87171" }}>
                {isUp ? "+" : ""}{w.change.toFixed(1)}%
              </p>
            </div>
          )
        })}
      </div>

      {/* ADD ITEM SUGGESTIONS */}
      <div style={{ padding: "8px 20px 40px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Sora', sans-serif", marginBottom: 10 }}>Add Item Search</h2>
        <div style={{
          background: "rgba(78,113,69,0.08)",
          border: "1px solid rgba(78,113,69,0.15)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 6,
        }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>supra</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 15 }}> |</span>
        </div>

        <div style={{
          background: "rgba(78,113,69,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              {isNew ? (
                <CatDot cat={s.cat} photo={s.photo} size={30} />
              ) : (
                <span style={{ fontSize: 18 }}>{getEmoji(s.cat)}</span>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</p>
                <p style={{ fontSize: 9, color: "#6b7a5e" }}>{s.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key differences callout */}
      {isNew && (
        <div style={{
          margin: "0 20px 40px",
          padding: 16,
          borderRadius: 14,
          background: "rgba(235,156,53,0.06)",
          border: "1px solid rgba(235,156,53,0.15)",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#EB9C35", fontFamily: "'Sora', sans-serif", marginBottom: 8 }}>
            What changed
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Category color circles replace all emojis",
              "Letter inside = category at a glance",
              "Photo thumbnail replaces circle when photo exists",
              "Colors are consistent per category across the entire app",
              "Zero external assets needed, pure CSS",
              "Scales infinitely as you add categories",
            ].map((point, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, background: "#EB9C35", marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: "#6b7a5e", lineHeight: 1.4 }}>{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
