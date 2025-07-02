import React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("label", className)}
    style={{
      fontSize: "0.875rem",
      fontWeight: "500",
      lineHeight: "1",
      cursor: "pointer",
    }}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
