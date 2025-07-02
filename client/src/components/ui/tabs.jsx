"use client"

import React from "react"
import { cn } from "../../lib/utils"

const Tabs = ({ defaultValue, className, children, ...props }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)

  return (
    <div className={cn("tabs", className)} style={{ width: "100%" }} {...props}>
      {React.Children.map(children, (child) => React.cloneElement(child, { activeTab, setActiveTab }))}
    </div>
  )
}

const TabsList = ({ className, children, activeTab, setActiveTab, ...props }) => {
  const listStyles = {
    display: "inline-flex",
    height: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.375rem",
    backgroundColor: "var(--muted)",
    padding: "0.25rem",
    color: "var(--muted-foreground)",
  }

  return (
    <div style={listStyles} className={cn("tabs-list", className)} {...props}>
      {React.Children.map(children, (child) => React.cloneElement(child, { activeTab, setActiveTab }))}
    </div>
  )
}

const TabsTrigger = ({ className, value, children, activeTab, setActiveTab, ...props }) => {
  const isActive = activeTab === value

  const triggerStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    borderRadius: "0.125rem",
    padding: "0.375rem 0.75rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.15s ease-in-out",
    cursor: "pointer",
    border: "none",
    outline: "none",
    backgroundColor: isActive ? "var(--background)" : "transparent",
    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
    boxShadow: isActive ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none",
  }

  return (
    <button
      style={triggerStyles}
      className={cn("tabs-trigger", className)}
      onClick={() => setActiveTab(value)}
      onFocus={(e) => {
        e.target.style.boxShadow = "0 0 0 2px var(--ring)"
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = isActive ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none"
      }}
      {...props}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ className, value, children, activeTab, ...props }) => {
  if (activeTab !== value) return null

  const contentStyles = {
    marginTop: "0.5rem",
    outline: "none",
  }

  return (
    <div
      style={contentStyles}
      className={cn("tabs-content", className)}
      onFocus={(e) => {
        e.target.style.boxShadow = "0 0 0 2px var(--ring)"
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = "none"
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
