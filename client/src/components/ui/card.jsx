import React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card", className)}
    style={{
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)",
      backgroundColor: "var(--card)",
      color: "var(--card-foreground)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-header", className)}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
      padding: "1.5rem",
    }}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("card-title", className)}
    style={{
      fontSize: "1.5rem",
      fontWeight: "600",
      lineHeight: "1",
      letterSpacing: "-0.025em",
    }}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-content", className)}
    style={{
      padding: "1.5rem",
      paddingTop: "0",
    }}
    {...props}
  />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
