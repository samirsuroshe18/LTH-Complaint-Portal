"use client"

import { Home, Hammer, Phone, Zap, Monitor, AlertTriangle, Wind, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { useComplaints } from "../contexts/ComplaintContext"

const categories = [
  { name: "Housekeeping", icon: Home, color: "bg-blue-500" },
  { name: "Carpentry", icon: Hammer, color: "bg-amber-500" },
  { name: "Telephone", icon: Phone, color: "bg-cyan-500" },
  { name: "Electrical", icon: Zap, color: "bg-yellow-500" },
  { name: "IT Support", icon: Monitor, color: "bg-purple-500" },
  { name: "Unsafe Condition", icon:AlertTriangle , color: "bg-orange-500" },
  { name: "Air Conditioning", icon: Wind, color: "bg-green-500" },
  { name: "Others", icon: MoreHorizontal, color: "bg-gray-500" },
]

export default function HomePage({ onCategorySelect }) {
  const { hasPendingComplaint } = useComplaints()

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <img src="/logo-lt.png" alt="LTH Logo" className="mx-auto mb-4" style={{ width: '100px', height: '100px' }} />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">LTH COMPLAINT PORTAL</h1>
        <p className="text-muted-foreground">Select a category to report your issue</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const isPending = hasPendingComplaint(category.name)
          const Icon = category.icon

          return (
            <Card
              key={category.name}
              className={`category-card cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => !isPending && onCategorySelect(category.name)}
            >
              <CardContent className="p-4 text-center relative">
                {isPending && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                    Pending
                  </Badge>
                )}
                <div
                  className={`category-icon-sm md:category-icon-md ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}
                >
                  <Icon className="icon-sm-mobile md:icon-md-desktop text-white" />
                </div>
                <h3 className="font-medium text-sm md:text-base text-foreground">{category.name}</h3>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          <strong>Note:</strong> You can only submit one complaint per category at a time. Please wait for your current
          complaint to be resolved before submitting a new one.
        </p>
      </div>
    </div>
  )
}
