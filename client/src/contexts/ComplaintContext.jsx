"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const ComplaintContext = createContext()

export const useComplaints = () => {
  const context = useContext(ComplaintContext)
  if (!context) {
    throw new Error("useComplaints must be used within a ComplaintProvider")
  }
  return context
}

export const ComplaintProvider = ({ children }) => {
  console.log("ComplaintProvider mounted");
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasMore: false, totalEntries: 0, entriesPerPage: 10 })

  // Fetch complaints from backend API using axios
  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/v1/complaint/get-complaints?ts=${Date.now()}`, {
        withCredentials: true, // if using cookies/session
      });
      let complaintsArr = [];
      if (res.data.data && Array.isArray(res.data.data.complaints)) {
        complaintsArr = res.data.data.complaints;
      }
      setComplaints(complaintsArr);
      if (res.data.data && res.data.data.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      setComplaints([])
      setPagination({ currentPage: 1, totalPages: 1, hasMore: false, totalEntries: 0, entriesPerPage: 10 })
    } finally {
      setLoading(false)
    }
  }

  // Fetch complaints with filters
  const fetchFilteredComplaints = async ({ search = '', status = '', startDate = '', endDate = '', page = 1, limit = 10 } = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page);
      params.append('limit', limit);
      params.append('ts', Date.now());
      const res = await axios.get(`/api/v1/complaint/get-complaints?${params.toString()}`, {
        withCredentials: true,
      });
      let complaintsArr = [];
      if (res.data.data && Array.isArray(res.data.data.complaints)) {
        complaintsArr = res.data.data.complaints;
      }
      setComplaints(complaintsArr);
      if (res.data.data && res.data.data.pagination) {
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      setComplaints([])
      setPagination({ currentPage: 1, totalPages: 1, hasMore: false, totalEntries: 0, entriesPerPage: 10 })
    } finally {
      setLoading(false)
    }
  }

  // Load complaints from backend on mount
  useEffect(() => {
    fetchComplaints()
  }, [])

  // Add a function to refresh complaints
  const refreshComplaints = fetchComplaints

  const addComplaint = (complaint) => {
    // Optionally, you can POST to backend here and then refresh
    // For now, just refresh after submission elsewhere
  }

  const resolveComplaint = (id) => {
    // Optionally, you can PATCH/PUT to backend here and then refresh
    // For now, just refresh after resolution elsewhere
  }

  const hasPendingComplaint = (category) => {
    if (!Array.isArray(complaints)) return false;
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
        loading,
        refreshComplaints: fetchComplaints,
        fetchFilteredComplaints,
        pagination,
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
