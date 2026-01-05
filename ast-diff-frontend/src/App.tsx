import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./App.css"
import ViewOriginalPage from "./pages/ViewOriginalPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ViewOriginalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
