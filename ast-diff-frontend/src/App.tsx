import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom"
import "./App.css"
import AstDiffPage from "./pages/AstDiffPage"
import ViewOriginalPage from "./pages/ViewOriginalPage"

function Navigation() {
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path
  
  const navLinkStyle = (path: string) => ({
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    color: isActive(path) ? "white" : "#374151",
    background: isActive(path) 
      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      : "white",
    border: "2px solid #d1d5db",
    borderRadius: "8px",
    transition: "all 0.3s",
    display: "inline-block"
  })

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 1000,
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #e5e7eb",
      padding: "16px 0",
      marginBottom: "0"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 20px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {/* <Link to="/" style={navLinkStyle("/")}>
          🌲 AST Diff Analyzer
        </Link> */}
        <Link to="/view-original" style={navLinkStyle("/view-original")}>
          📝 AST Diff
        </Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<AstDiffPage />} />
        <Route path="/view-original" element={<ViewOriginalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
