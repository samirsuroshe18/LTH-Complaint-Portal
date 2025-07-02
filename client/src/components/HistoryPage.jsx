"use client"

import { ArrowLeft, Clock, CheckCircle, Calendar, Camera, Filter, Search, X } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { useComplaints } from "../contexts/ComplaintContext"
import { useState, useRef } from "react"

export default function HistoryPage({ onBack }) {
  const { getPendingComplaints, getResolvedComplaints, resolveComplaint } = useComplaints()

  const allComplaints = [
    ...getPendingComplaints(),
    ...getResolvedComplaints(),
  ]

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef(null)

  // Filter and sort complaints
  const filteredComplaints = allComplaints
    .filter((complaint) => {
      const matchesDescription = complaint.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
      let matchesDate = true
      if (dateFilter) {
        const complaintDate = new Date(complaint.submittedAt)
        const selectedDate = new Date(dateFilter)
        matchesDate =
          complaintDate.getFullYear() === selectedDate.getFullYear() &&
          complaintDate.getMonth() === selectedDate.getMonth() &&
          complaintDate.getDate() === selectedDate.getDate()
      }
      return matchesDescription && matchesStatus && matchesDate
    })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResolutionTime = (submittedAt, resolvedAt) => {
    const submitted = new Date(submittedAt)
    const resolved = new Date(resolvedAt)
    const diffInHours = Math.round((resolved - submitted) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Less than 1 hour"
    if (diffInHours === 1) return "1 hour"
    if (diffInHours < 24) return `${diffInHours} hours`

    const days = Math.round(diffInHours / 24)
    return days === 1 ? "1 day" : `${days} days`
  }

  const ComplaintCard = ({ complaint }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{complaint.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{complaint.category}</Badge>
              <Badge
                variant={complaint.status === "pending" ? "destructive" : "default"}
                className={complaint.status === "resolved" ? "bg-green-100 text-green-800" : ""}
              >
                {complaint.status === "pending" ? (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {complaint.photo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="w-4 h-4" />
            <span>Photo attached</span>
          </div>
        )}
        <p className="text-muted-foreground">{complaint.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Submitted: {formatDate(complaint.submittedAt)}</span>
          </div>
        </div>

        {complaint.status === "resolved" && (
          <div className="flex items-center gap-4 text-sm text-green-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>Resolved in {getResolutionTime(complaint.submittedAt, complaint.resolvedAt)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Complaint History</h1>
          <p className="text-muted-foreground text-sm">Track your submitted complaints</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2 mb-2 relative">
        <div className="relative flex items-center" style={{ width: '100%', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 shadow focus:outline-none focus:ring focus:border-blue-400 bg-white"
          />
          <span style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'}}>
            <Search className="text-gray-400 w-5 h-5" />
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="p-2 border rounded-full bg-white hover:bg-gray-100 shadow"
          ref={filterRef}
        >
          <Filter className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {showFilters && (
        <div className="w-full bg-gradient-to-br from-white to-blue-50 border rounded-xl shadow-xl p-4 mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="mb-4">
            <span className="font-semibold text-lg text-blue-900 tracking-tight">Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="font-medium text-sm text-blue-900">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg mt-1 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="font-medium text-sm text-blue-900">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg mt-1 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="px-4 py-1 rounded-full border border-blue-400 text-blue-700 bg-white hover:bg-blue-50 font-medium text-xs shadow-sm transition"
              onClick={() => { setStatusFilter('all'); setDateFilter(''); setShowFilters(false); }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* All Complaints List */}
      <div className="mt-6">
        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="font-medium text-foreground mb-2">No Complaints Found</h3>
              <p className="text-muted-foreground">No complaints match your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {filteredComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
