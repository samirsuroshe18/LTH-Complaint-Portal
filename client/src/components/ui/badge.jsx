import { cn } from "../../lib/utils"

const Badge = ({ className, variant = "default", ...props }) => {
  const getVariantStyles = (variant) => {
    const styles = {
      default: {
        borderColor: "transparent",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
      },
      secondary: {
        borderColor: "transparent",
        backgroundColor: "var(--secondary)",
        color: "var(--secondary-foreground)",
      },
      destructive: {
        borderColor: "transparent",
        backgroundColor: "var(--destructive)",
        color: "var(--destructive-foreground)",
      },
      outline: {
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        backgroundColor: "transparent",
      },
    }
    return styles[variant] || styles.default
  }

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "9999px",
    border: "1px solid",
    padding: "0.125rem 0.625rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    transition: "all 0.15s ease-in-out",
    ...getVariantStyles(variant),
  }

  return <div style={baseStyles} className={cn("badge", className)} {...props} />
}

export { Badge }
