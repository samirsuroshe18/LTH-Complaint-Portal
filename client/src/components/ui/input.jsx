"use client"

import React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const inputStyles = {
    display: "flex",
    height: "2.5rem",
    width: "100%",
    borderRadius: "0.375rem",
    border: "1px solid var(--input)",
    backgroundColor: "var(--background)",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    transition: "all 0.15s ease-in-out",
    outline: "none",
  }

  return (
    <input
      type={type}
      style={inputStyles}
      className={cn("input", className)}
      ref={ref}
      onFocus={(e) => {
        e.target.style.boxShadow = "0 0 0 2px var(--ring)"
        e.target.style.borderColor = "var(--ring)"
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = "none"
        e.target.style.borderColor = "var(--input)"
      }}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
