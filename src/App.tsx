import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "@/pages/Home"
import Found from "@/pages/Found"
import NotFound from "@/pages/NotFound"
import Success from "@/pages/Success"
import Admin from "@/pages/Admin"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/found" element={<Found />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
