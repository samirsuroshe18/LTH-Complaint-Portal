"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import { PanelLeft } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const SidebarContext = createContext(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef(
  ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const [openMobile, setOpenMobile] = useState(false)
    const [_open, _setOpen] = useState(defaultOpen)
    const open = openProp ?? _open

    const setOpen = useCallback(
      (value) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open],
    )

    const toggleSidebar = useCallback(() => {
      return setOpenMobile((open) => !open)
    }, [setOpenMobile])

    useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile: true,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn("sidebar-wrapper", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { openMobile, setOpenMobile } = useSidebar()

    const sidebarStyles = {
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      display: "flex",
      height: "100%",
      width: "var(--sidebar-width-mobile)",
      flexDirection: "column",
      backgroundColor: "var(--sidebar-background)",
      color: "var(--sidebar-foreground)",
      transform: openMobile ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.2s ease-in-out",
    }

    const desktopStyles = {
      position: "relative",
      transform: "translateX(0)",
      width: SIDEBAR_WIDTH,
    }

    return (
      <>
        {openMobile && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
            className="mobile-hidden"
            onClick={() => setOpenMobile(false)}
          />
        )}
        <div
          ref={ref}
          style={{
            ...sidebarStyles,
            ...(window.innerWidth >= 768 ? desktopStyles : {}),
          }}
          className={cn("sidebar", className)}
          {...props}
        >
          {children}
        </div>
      </>
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("sidebar-header", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.5rem",
      }}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("sidebar-content", className)}
      style={{
        display: "flex",
        minHeight: 0,
        flex: "1 1 0%",
        flexDirection: "column",
        gap: "0.5rem",
        overflow: "auto",
      }}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("sidebar-group", className)}
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        minWidth: 0,
        flexDirection: "column",
        padding: "0.5rem",
      }}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("sidebar-group-content", className)}
    style={{
      width: "100%",
      fontSize: "0.875rem",
    }}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("sidebar-menu", className)}
    style={{
      display: "flex",
      width: "100%",
      minWidth: 0,
      flexDirection: "column",
      gap: "0.25rem",
    }}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("sidebar-menu-item", className)}
    style={{
      position: "relative",
    }}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef(
  ({ asChild = false, isActive = false, className, children, ...props }, ref) => {
    const Comp = asChild ? "div" : "button"

    const buttonStyles = {
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: "0.5rem",
      overflow: "hidden",
      borderRadius: "0.375rem",
      padding: "0.5rem",
      textAlign: "left",
      fontSize: "0.875rem",
      outline: "none",
      transition: "background-color 0.15s ease-in-out, color 0.15s ease-in-out",
      backgroundColor: isActive ? "var(--sidebar-accent)" : "transparent",
      color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
      fontWeight: isActive ? "500" : "normal",
      border: "none",
      cursor: "pointer",
    }

    return (
      <Comp
        ref={ref}
        style={buttonStyles}
        className={cn("sidebar-menu-button", className)}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.target.style.backgroundColor = "var(--sidebar-accent)"
            e.target.style.color = "var(--sidebar-accent-foreground)"
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.target.style.backgroundColor = "transparent"
            e.target.style.color = "var(--sidebar-foreground)"
          }
        }}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
