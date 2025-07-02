"use client"

import { Home, History, Menu } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const menuItems = [
  {
    title: "Home",
    icon: Home,
    key: "home",
  },
  {
    title: "History",
    icon: History,
    key: "history",
  },
]

export default function AppSidebar({ onNavigateHome, onNavigateHistory, currentPage }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Animate menu open/close
  useEffect(() => {
    if (menuRef.current) {
      if (open) {
        menuRef.current.style.opacity = 1
        menuRef.current.style.transform = "translateY(0)"
      } else {
        menuRef.current.style.opacity = 0
        menuRef.current.style.transform = "translateY(-10px)"
      }
    }
  }, [open])

  const handleMenuClick = (key) => {
    if (key === "home") {
      onNavigateHome()
      setOpen(false)
    } else if (key === "history") {
      onNavigateHistory()
      setOpen(false)
    }
  }

  return (
    <div>
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded bg-[#FFC107] border border-black shadow-md"
          aria-label="Open menu"
        >
          <Menu className="h-7 w-7 text-black" />
        </button>
        {open && (
          <div
            ref={menuRef}
            className="mt-2 w-40 rounded shadow-lg bg-[#FFC107] border border-black flex flex-col transition-all duration-300 ease-out"
            style={{
              opacity: 0,
              transform: "translateY(-10px)",
            }}
          >
            <button
              onClick={() => handleMenuClick("home")}
              className={`flex items-center gap-2 px-4 py-3 text-black hover:bg-yellow-300 text-left ${currentPage === "home" ? "font-bold" : ""}`}
            >
              <Home className="h-5 w-5 text-black" /> Home
            </button>
            <button
              onClick={() => handleMenuClick("history")}
              className={`flex items-center gap-2 px-4 py-3 text-black hover:bg-yellow-300 text-left ${currentPage === "history" ? "font-bold" : ""}`}
            >
              <History className="h-5 w-5 text-black" /> History
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
