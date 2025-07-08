"use client"

import { Home, History, Menu } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

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

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
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
    <>
      {/* Hamburger Button */}
      <div className="fixed top-4 left-4 z-[1200]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-full bg-[#FFC107] border border-black shadow-md hover:scale-105 transition"
          aria-label="Open menu"
        >
          <Menu className="h-7 w-7 text-black" />
        </button>
      </div>
      {/* MUI Drawer Sidebar */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: 200, sm: 260 },
            boxShadow: 6,
            background: '#fff',
            borderRight: '1px solid #e5e7eb',
          },
        }}
      >
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    handleMenuClick(item.key)
                    setOpen(false)
                  }}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    '&.Mui-selected': {
                      background: '#f3f4f6',
                      color: '#111',
                      fontWeight: 700,
                    },
                  }}
                >
                  <ListItemIcon>
                    <Icon style={{ color: isActive ? '#111' : '#757575' }} />
                  </ListItemIcon>
                  <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: 17, fontWeight: isActive ? 700 : 500 }} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Drawer>
    </>
  )
}
