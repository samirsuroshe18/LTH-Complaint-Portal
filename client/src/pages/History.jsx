import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Pause,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const History = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Debounce search term with 300ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Ref to store abort controller for request cancellation
  const abortControllerRef = useRef(null);

  // Actual API call with request cancellation
  const fetchComplaints = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      // Add optional parameters
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (selectedStatus) queryParams.append("status", selectedStatus);
      if (debouncedSearchTerm) queryParams.append("search", debouncedSearchTerm);

      // Make API call with abort signal
      const response = await fetch(
        `/api/v1/complaint/get-complaints?${queryParams}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Filter by category on frontend since API doesn't seem to support it
        let filteredComplaints = data.data.complaints;
        if (selectedCategory) {
          filteredComplaints = filteredComplaints.filter(
            (complaint) => complaint.category === selectedCategory
          );
        }

        setComplaints(filteredComplaints);
        setPagination(data.data.pagination);
      } else {
        console.error("API Error:", data.message);
        setComplaints([]);
        setPagination({});
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Fetch error:", error);
        setComplaints([]);
        setPagination({});
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedStatus, selectedCategory, debouncedSearchTerm]);

  // Effect for debounced search term and other filters
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Reset to page 1 when filters change (except pagination)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedCategory, startDate, endDate]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "In Progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "Pending":
        return <Pause className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return isDarkMode
          ? "bg-green-900/30 text-green-300 border-green-700"
          : "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return isDarkMode
          ? "bg-yellow-900/30 text-yellow-300 border-yellow-700"
          : "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending":
        return isDarkMode
          ? "bg-red-900/30 text-red-300 border-red-700"
          : "bg-red-100 text-red-800 border-red-200";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Technical: isDarkMode
        ? "bg-blue-900/30 text-blue-300 border-blue-700"
        : "bg-blue-100 text-blue-800 border-blue-200",
      Carpentry: isDarkMode
        ? "bg-orange-900/30 text-orange-300 border-orange-700"
        : "bg-orange-100 text-orange-800 border-orange-200",
      Electrical: isDarkMode
        ? "bg-purple-900/30 text-purple-300 border-purple-700"
        : "bg-purple-100 text-purple-800 border-purple-200",
      Plumbing: isDarkMode
        ? "bg-cyan-900/30 text-cyan-300 border-cyan-700"
        : "bg-cyan-100 text-cyan-800 border-cyan-200",
      Maintenance: isDarkMode
        ? "bg-indigo-900/30 text-indigo-300 border-indigo-700"
        : "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return (
      colors[category] ||
      (isDarkMode
        ? "bg-gray-700 text-gray-300 border-gray-600"
        : "bg-gray-100 text-gray-800 border-gray-200")
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedCategory("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    selectedStatus,
    selectedCategory,
    startDate,
    endDate,
  ].filter(Boolean).length;

  // Theme detection
  useEffect(() => {
    const checkTheme = () => {
      const colorScheme = document.documentElement.getAttribute(
        "data-toolpad-color-scheme"
      );
      setIsDarkMode(colorScheme === "dark");
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-toolpad-color-scheme"
        ) {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-toolpad-color-scheme"],
    });

    return () => observer.disconnect();
  }, []);

  const getThemeClasses = () => ({
    background: isDarkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-blue-50 to-indigo-100",
    cardBackground: isDarkMode ? "bg-gray-800" : "bg-white",
    headerBackground: isDarkMode ? "bg-gray-900" : "bg-white",
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textTertiary: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-600" : "border-gray-300",
    borderLight: isDarkMode ? "border-gray-700" : "border-gray-200",
    inputBackground: isDarkMode ? "bg-gray-700" : "bg-white",
    inputText: isDarkMode ? "text-white" : "text-gray-700",
    inputPlaceholder: isDarkMode
      ? "placeholder-gray-400"
      : "placeholder-gray-500",
    hoverBackground: isDarkMode ? "hover:bg-gray-700" : "hover:bg-indigo-50",
    hoverBorder: isDarkMode
      ? "hover:border-indigo-400"
      : "hover:border-indigo-400",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-gray-100 hover:bg-gray-200",
    buttonSecondaryText: isDarkMode ? "text-gray-300" : "text-gray-700",
    badgeBackground: isDarkMode ? "bg-gray-700" : "bg-gray-100",
    badgeText: isDarkMode ? "text-gray-300" : "text-gray-700",
    statusBlue: isDarkMode
      ? "bg-blue-900/30 text-blue-300 border-blue-700"
      : "bg-blue-100 text-blue-800 border-blue-200",
    statusGreen: isDarkMode
      ? "bg-green-900/30 text-green-300 border-green-700"
      : "bg-green-100 text-green-800 border-green-200",
    statusOrange: isDarkMode
      ? "bg-orange-900/30 text-orange-300 border-orange-700"
      : "bg-orange-100 text-orange-800 border-orange-200",
    statusPurple: isDarkMode
      ? "bg-purple-900/30 text-purple-300 border-purple-700"
      : "bg-purple-100 text-purple-800 border-purple-200",
    statusRed: isDarkMode
      ? "bg-red-900/30 text-red-300 border-red-700"
      : "bg-red-100 text-red-800 border-red-200",
    statusYellow: isDarkMode
      ? "bg-yellow-900/30 text-yellow-300 border-yellow-700"
      : "bg-yellow-100 text-yellow-800 border-yellow-200",
    footerBackground: isDarkMode ? "bg-gray-700" : "bg-gray-50",
    errorBackground: isDarkMode ? "bg-red-900/20" : "bg-red-50",
    errorBorder: isDarkMode ? "border-red-800" : "border-red-200",
    errorText: isDarkMode ? "text-red-300" : "text-red-800",
    successBackground: isDarkMode ? "bg-green-900/20" : "bg-green-50",
    successBorder: isDarkMode ? "border-green-800" : "border-green-200",
    successText: isDarkMode ? "text-green-300" : "text-green-800",
    spinnerColor: isDarkMode ? "border-blue-400" : "border-blue-600",
    focusRing: "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  });

  return (
    <div className={`${getThemeClasses().background} min-h-screen`}>
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col space-y-4 sm:space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className={`flex-1 min-w-0`}>
                <h1
                  className={`text-xl sm:text-2xl md:text-3xl font-bold ${getThemeClasses().textPrimary} truncate`}
                >
                  Complaint History
                </h1>
                <p
                  className={`text-sm sm:text-base ${getThemeClasses().textSecondary} mt-1 line-clamp-2 sm:line-clamp-none`}
                >
                  Track and manage your submitted complaints
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end md:justify-start">
                <div
                  className={`flex items-center space-x-2 text-xs sm:text-sm ${getThemeClasses().textTertiary} ${getThemeClasses().badgeBackground} px-3 py-1.5 sm:py-1 rounded-full flex-shrink-0`}
                >
                  <span className="whitespace-nowrap">
                    <span className="sm:hidden">
                      {pagination.totalEntries || 0} total
                    </span>
                    <span className="hidden sm:inline">
                      Total: {pagination.totalEntries || 0} complaints
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div
          className={`${getThemeClasses().cardBackground} rounded-lg shadow-sm ${getThemeClasses().borderLight} border p-4 sm:p-6 mb-6`}
        >
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${getThemeClasses().textTertiary} w-5 h-5`}
              />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2.5 sm:py-2 w-full ${getThemeClasses().inputBackground} ${getThemeClasses().inputText} ${getThemeClasses().inputPlaceholder} border ${getThemeClasses().border} rounded-lg ${getThemeClasses().focusRing} text-base sm:text-sm`}
              />
              {/* Show loading indicator when search is active */}
              {loading && searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between sm:justify-start space-x-3 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2.5 sm:py-2 ${getThemeClasses().buttonSecondary} ${getThemeClasses().buttonSecondaryText} rounded-lg transition-colors flex-1 sm:flex-none justify-center sm:justify-start`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-base sm:text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div
              className={`mt-6 pt-6 border-t ${getThemeClasses().borderLight}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${getThemeClasses().textSecondary} mb-2`}
                  >
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`w-full px-3 py-2.5 sm:py-2 ${getThemeClasses().inputBackground} ${getThemeClasses().inputText} border ${getThemeClasses().border} rounded-lg ${getThemeClasses().focusRing} text-base sm:text-sm`}
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label
                    className={`block text-sm font-medium ${getThemeClasses().textSecondary} mb-2`}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2.5 sm:py-2 ${getThemeClasses().inputBackground} ${getThemeClasses().inputText} border ${getThemeClasses().border} rounded-lg ${getThemeClasses().focusRing} text-base sm:text-sm`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${getThemeClasses().textSecondary} mb-2`}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2.5 sm:py-2 ${getThemeClasses().inputBackground} ${getThemeClasses().inputText} border ${getThemeClasses().border} rounded-lg ${getThemeClasses().focusRing} text-base sm:text-sm`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {selectedStatus && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getThemeClasses().statusBlue}`}
                >
                  <span className="hidden sm:inline">Status: </span>
                  {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus("")}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getThemeClasses().statusGreen}`}
                >
                  <span className="hidden sm:inline">Category: </span>
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {startDate && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getThemeClasses().statusPurple}`}
                >
                  <span className="hidden sm:inline">From: </span>
                  {startDate}
                  <button
                    onClick={() => setStartDate("")}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {endDate && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getThemeClasses().statusOrange}`}
                >
                  <span className="hidden sm:inline">To: </span>
                  {endDate}
                  <button
                    onClick={() => setEndDate("")}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Complaints List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div
                className={`animate-spin rounded-full h-12 w-12 border-b-2 ${getThemeClasses().spinnerColor}`}
              ></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <div className={`${getThemeClasses().textTertiary} mb-2`}>
                <Search className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3
                className={`text-lg font-medium ${getThemeClasses().textPrimary} mb-2`}
              >
                No complaints found
              </h3>
              <p className={getThemeClasses().textSecondary}>
                No complaints to display right now. Please refresh the page or
                try again later.
              </p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <div
                key={complaint._id}
                className={`${getThemeClasses().cardBackground} rounded-lg shadow-sm border ${getThemeClasses().borderLight} hover:shadow-md transition-shadow`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-base sm:text-lg font-mono font-semibold text-blue-600">
                          #{complaint.complaintId}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(complaint.category)}`}
                        >
                          {complaint.category}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}
                        >
                          {getStatusIcon(complaint.status)}
                          <span className="ml-1">{complaint.status}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`text-base sm:text-lg font-medium ${getThemeClasses().textPrimary} leading-relaxed`}
                      >
                        {complaint.description}
                      </h3>
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm ${getThemeClasses().textSecondary}`}
                    >
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{complaint.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="capitalize truncate">
                          {complaint.assignStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.max(1, currentPage - 1));
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {(() => {
                  const pages = [];
                  const totalPages = pagination.totalPages;

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i);
                            }}
                            isActive={currentPage === i}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  } else {
                    pages.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                          isActive={currentPage === 1}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );

                    if (currentPage > 3) {
                      pages.push(
                        <PaginationItem key="start-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i);
                            }}
                            isActive={currentPage === i}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (currentPage < totalPages - 2) {
                      pages.push(
                        <PaginationItem key="end-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  return pages;
                })()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(
                        Math.min(pagination.totalPages, currentPage + 1)
                      );
                    }}
                    className={
                      currentPage === pagination.totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;