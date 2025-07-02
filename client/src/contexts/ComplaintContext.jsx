"use client"

import { createContext, useContext, useState, useEffect } from "react"

const ComplaintContext = createContext()

export const useComplaints = () => {
  const context = useContext(ComplaintContext)
  if (!context) {
    throw new Error("useComplaints must be used within a ComplaintProvider")
  }
  return context
}

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([])

  // Load complaints from localStorage on mount
  useEffect(() => {
    const savedComplaints = localStorage.getItem("complaints")
    if (savedComplaints) {
      try {
        setComplaints(JSON.parse(savedComplaints))
      } catch (error) {
        console.error("Error loading complaints from localStorage:", error)
        setComplaints([])
      }
    }
  }, [])

  // Save complaints to localStorage whenever complaints change
  useEffect(() => {
    try {
      localStorage.setItem("complaints", JSON.stringify(complaints))
    } catch (error) {
      console.error("Error saving complaints to localStorage:", error)
    }
  }, [complaints])

  const addComplaint = (complaint) => {
    const newComplaint = {
      id: Date.now().toString(),
      ...complaint,
      status: "pending",
      submittedAt: new Date().toISOString(),
      resolvedAt: null,
    }
    setComplaints((prev) => [...prev, newComplaint])
    return newComplaint
  }

  const resolveComplaint = (id) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === id ? { ...complaint, status: "resolved", resolvedAt: new Date().toISOString() } : complaint,
      ),
    )
  }

  const hasPendingComplaint = (category) => {
    return complaints.some((complaint) => complaint.category === category && complaint.status === "pending")
  }

  const getPendingComplaints = () => {
    return complaints.filter((complaint) => complaint.status === "pending")
  }

  const getResolvedComplaints = () => {
    return complaints.filter((complaint) => complaint.status === "resolved")
  }

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        addComplaint,
        resolveComplaint,
        hasPendingComplaint,
        getPendingComplaints,
        getResolvedComplaints,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  )
}
