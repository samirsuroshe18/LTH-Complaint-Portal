"use client"

import React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "button"

    const getVariantStyles = (variant) => {
      const styles = {
        default: {
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        },
        destructive: {
          backgroundColor: "var(--destructive)",
          color: "var(--destructive-foreground)",
        },
        outline: {
          border: "1px solid var(--input)",
          backgroundColor: "var(--background)",
        },
        secondary: {
          backgroundColor: "var(--secondary)",
          color: "var(--secondary-foreground)",
        },
        ghost: {
          backgroundColor: "transparent",
        },
        link: {
          color: "var(--primary)",
          textDecoration: "underline",
          textUnderlineOffset: "4px",
        },
      }
      return styles[variant] || styles.default
    }

    const getSizeStyles = (size) => {
      const styles = {
        default: {
          height: "2.5rem",
          padding: "0.5rem 1rem",
        },
        sm: {
          height: "2.25rem",
          borderRadius: "0.375rem",
          padding: "0 0.75rem",
        },
        lg: {
          height: "2.75rem",
          borderRadius: "0.375rem",
          padding: "0 2rem",
        },
        icon: {
          height: "2.5rem",
          width: "2.5rem",
        },
      }
      return styles[size] || styles.default
    }

    const baseStyles = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      transition: "all 0.15s ease-in-out",
      border: "none",
      cursor: "pointer",
      outline: "none",
      ...getVariantStyles(variant),
      ...getSizeStyles(size),
    }

    const hoverStyles = {
      default: { backgroundColor: "var(--primary)", opacity: "0.9" },
      destructive: { backgroundColor: "var(--destructive)", opacity: "0.9" },
      outline: { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
      secondary: { backgroundColor: "var(--secondary)", opacity: "0.8" },
      ghost: { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
      link: { textDecoration: "underline" },
    }

    const disabledStyles = {
      pointerEvents: "none",
      opacity: "0.5",
    }

    return (
      <Comp
        style={{
          ...baseStyles,
          ...(props.disabled ? disabledStyles : {}),
        }}
        className={cn("button", className)}
        ref={ref}
        onMouseEnter={(e) => {
          if (!props.disabled) {
            Object.assign(e.target.style, hoverStyles[variant] || hoverStyles.default)
          }
        }}
        onMouseLeave={(e) => {
          if (!props.disabled) {
            Object.assign(e.target.style, baseStyles)
          }
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = "0 0 0 2px var(--ring)"
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none"
        }}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
