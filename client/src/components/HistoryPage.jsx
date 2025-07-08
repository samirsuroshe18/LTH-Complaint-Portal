"use client"

import React, { useState, useRef, useEffect } from "react"
import { ArrowLeft, Clock, CheckCircle, Calendar, Camera, Filter, Search as LucideSearch, X } from "lucide-react"
import { useComplaints } from "../contexts/ComplaintContext"

// MUI imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import SvgIcon from '@mui/material/SvgIcon';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NumbersIcon from '@mui/icons-material/Numbers';
import DescriptionIcon from '@mui/icons-material/Description';

// Add category color mapping (same as HomePage.jsx)
const categoryColors = {
  "Housekeeping": "#3b82f6", // blue-500
  "Carpentry": "#f59e42",   // amber-500
  "Telephone": "#06b6d4",   // cyan-500
  "Electrical": "#fde047",  // yellow-500
  "IT Support": "#a78bfa",  // purple-500
  "Unsafe Condition": "#fb923c", // orange-500
  "Air Conditioning": "#22c55e", // green-500
  "Others": "#6b7280",      // gray-500
};

// Add MUI DatePicker imports
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function HistoryPage({ onBack }) {
  console.log("HistoryPage component mounted");
  const { complaints, fetchFilteredComplaints, loading, pagination } = useComplaints()

  console.log("Complaints from context:", complaints);

  const allComplaints = complaints; // Use directly, or filter as needed

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const filterRef = useRef(null)

  // Fetch filtered complaints from backend whenever filters or page change
  useEffect(() => {
    fetchFilteredComplaints({
      search,
      status: statusFilter,
      startDate,
      endDate,
      page,
      limit: 10,
    })
  }, [search, statusFilter, startDate, endDate, page])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, startDate, endDate])

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

  // MUI Complaint Card
  const ComplaintCard = ({ complaint }) => (
    <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 3 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">{complaint.title}</Typography>
            <Chip 
              label={complaint.category} 
              variant="filled" 
              size="small"
              sx={{ 
                backgroundColor: categoryColors[complaint.category] || '#e0e0e0', 
                color: '#fff', 
                fontWeight: 600 
              }}
            />
            <Chip
              label={complaint.status?.toLowerCase() === "resolved" ? "Resolved" : "Pending"}
              color={complaint.status?.toLowerCase() === "resolved" ? "success" : "warning"}
              size="small"
              icon={complaint.status?.toLowerCase() === "resolved"
                ? (
                    <SvgIcon fontSize="small" sx={{ mr: 0.2 }}>
                      <CheckCircle />
                    </SvgIcon>
                  )
                : (
                    <SvgIcon fontSize="small" sx={{ mr: 0.2 }}>
                      <Clock />
                    </SvgIcon>
                  )}
            />
          </Stack>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box component="span" sx={{
              display: 'flex', alignItems: 'center',
              fontWeight: 600,
              fontSize: '1rem',
              background: '#f3f4f6',
              color: 'text.primary',
              px: 1.2,
              py: 0.3,
              borderRadius: 1,
              letterSpacing: 0.5,
              mr: 1,
            }}>
              <NumbersIcon sx={{ color: '#2563eb', fontSize: 18, mr: 0.5 }} /> Complaint ID:
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 400,
                fontSize: '1rem',
                background: '#f3f4f6',
                color: 'text.primary',
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                letterSpacing: 0.5,
              }}
            >
              {complaint.complaintId}
            </Typography>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Stack spacing={1}>
          {complaint.photo && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Camera style={{ width: 18, height: 18 }} />
              <Typography variant="body2" color="text.secondary">Photo attached</Typography>
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Box component="span" sx={{
              display: 'flex', alignItems: 'center',
              fontWeight: 600,
              fontSize: '1rem',
              background: '#f3f4f6',
              color: 'text.primary',
              px: 1.2,
              py: 0.3,
              borderRadius: 1,
              letterSpacing: 0.5,
              mr: 1,
            }}>
              <DescriptionIcon sx={{ color: '#2563eb', fontSize: 18, mr: 0.5 }} /> Complaint:
            </Box>
            <Box component="span" sx={{
              fontWeight: 400,
              fontSize: '1.05rem',
              color: 'text.secondary',
              background: '#f9fafb',
              px: 1.2,
              py: 0.3,
              borderRadius: 2,
              display: 'inline-block',
              ml: 0.5,
            }}>{complaint.description}</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Box component="span" sx={{
              fontWeight: 600,
              fontSize: '1rem',
              background: '#f3f4f6',
              color: 'text.primary',
              px: 1.2,
              py: 0.3,
              borderRadius: 1,
              letterSpacing: 0.5,
              mr: 1,
              display: 'flex',
              alignItems: 'center',
            }}>
              <LocationOnIcon sx={{ color: '#2563eb', fontSize: 18, mr: 0.5 }} /> Location:
            </Box>
            <Box component="span" sx={{
              fontWeight: 400,
              fontSize: '1.05rem',
              color: 'text.secondary',
              background: '#f9fafb',
              px: 1.2,
              py: 0.3,
              borderRadius: 2,
              display: 'inline-block',
              ml: 0.5,
            }}>{complaint.location}</Box>
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Calendar style={{ width: 18, height: 18 }} />
            <Typography variant="body2" color="text.secondary">
              Submitted: {formatDate(complaint.createdAt)}
            </Typography>
          </Stack>
          {complaint.status === "resolved" && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircle style={{ width: 18, height: 18, color: '#388e3c' }} />
              <Typography variant="body2" color="success.main">
                Resolved in {getResolutionTime(complaint.createdAt, complaint.resolvedAt)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )

  console.log("All Complaints in HistoryPage:", allComplaints);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        {/* Add fixed left padding to ensure heading is never behind the hamburger icon */}
        <Box sx={{ pl: { xs: 7, sm: 8, md: 10 } }}>
          <Typography variant="h4" fontWeight={700}>Complaint History</Typography>
          <Typography variant="subtitle2" color="text.secondary">Track your submitted complaints</Typography>
        </Box>
      </Stack>

      {/* MUI Search and Filter Bar */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search complaints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              '::placeholder': {
                color: '#6b7280', // darker placeholder
                opacity: 1,
                fontWeight: 500,
              },
            },
          }}
          sx={{
            maxWidth: 600,
            borderRadius: 3,
            boxShadow: 2,
            background: '#f5f7fa',
            border: '1.5px solid #e0e7ef',
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              background: '#f5f7fa',
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
        />
        <Box
          sx={{
            background: '#f5f7fa',
            border: '1.5px solid #e0e7ef',
            borderRadius: 3,
            boxShadow: 2,
            ml: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Tooltip title="Show Filters">
            <IconButton onClick={() => setShowFilters(v => !v)} ref={filterRef}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      {showFilters && (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div className="w-full bg-gradient-to-br from-white to-blue-50 border rounded-xl shadow-xl p-4 mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="mb-4">
              <span className="font-semibold text-lg text-blue-900 tracking-tight">Filters</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <FormControl fullWidth size="small" sx={{ mt: 1, background: '#f5f7fa', borderRadius: 2, boxShadow: 1 }}>
                  <InputLabel id="status-filter-label" sx={{ fontWeight: 600, color: '#111' }}>Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={e => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      background: '#f5f7fa',
                      fontWeight: 500,
                      color: '#111',
                    }}
                  >
                    <MenuItem value="all" sx={{ color: '#111' }}>All Statuses</MenuItem>
                    <MenuItem value="Pending" sx={{ color: '#111' }}>Pending</MenuItem>
                    <MenuItem value="Resolved" sx={{ color: '#111' }}>Resolved</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex-1">
                <label className="font-medium text-sm text-blue-900">Start Date</label>
                <DatePicker
                  value={startDate ? new Date(startDate) : null}
                  onChange={date => setStartDate(date ? date.toISOString().slice(0, 10) : "")}
                  slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mt: 1, background: '#fff', borderRadius: 2 } } }}
                  format="yyyy-MM-dd"
                />
              </div>
              <div className="flex-1">
                <label className="font-medium text-sm text-blue-900">End Date</label>
                <DatePicker
                  value={endDate ? new Date(endDate) : null}
                  onChange={date => setEndDate(date ? date.toISOString().slice(0, 10) : "")}
                  slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mt: 1, background: '#fff', borderRadius: 2 } } }}
                  format="yyyy-MM-dd"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="px-4 py-1 rounded-full border border-blue-400 text-blue-700 bg-white hover:bg-blue-50 font-medium text-xs shadow-sm transition"
                onClick={() => { setStatusFilter('all'); setStartDate(''); setEndDate(''); setShowFilters(false); }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </LocalizationProvider>
      )}

      {/* All Complaints List */}
      <Box mt={4}>
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="font-medium text-foreground mb-2">Loading...</h3>
            </CardContent>
          </Card>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="font-medium text-foreground mb-2">No Complaints Found</h3>
              <p className="text-muted-foreground">No complaints match your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} />
            ))}
            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Box>
    </Box>
  )
}
