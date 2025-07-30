import {
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Pause,
} from "lucide-react";

const ComplaintCard = ({ complaint, isDarkMode }) => {
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
      'Housekeeping': isDarkMode
        ? "bg-green-900/30 text-green-300 border-green-700"
        : "bg-green-100 text-green-800 border-green-200",
      'Carpentry': isDarkMode
        ? "bg-orange-900/30 text-orange-300 border-orange-700"
        : "bg-orange-100 text-orange-800 border-orange-200",
      'Telephone': isDarkMode
        ? "bg-pink-900/30 text-pink-300 border-pink-700"
        : "bg-pink-100 text-pink-800 border-pink-200",
      'Electrical': isDarkMode
        ? "bg-purple-900/30 text-purple-300 border-purple-700"
        : "bg-purple-100 text-purple-800 border-purple-200",
      'Technical': isDarkMode
        ? "bg-blue-900/30 text-blue-300 border-blue-700"
        : "bg-blue-100 text-blue-800 border-blue-200",
      "Unsafe Condition": isDarkMode
        ? "bg-red-900/30 text-red-300 border-red-700"
        : "bg-red-100 text-red-800 border-red-200",
      "Air Conditioning": isDarkMode
        ? "bg-cyan-900/30 text-cyan-300 border-cyan-700"
        : "bg-cyan-100 text-cyan-800 border-cyan-200",
      'Others': isDarkMode
        ? "bg-yellow-900/30 text-yellow-300 border-yellow-700"
        : "bg-yellow-100 text-yellow-800 border-yellow-200",
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

  const theme = getThemeClasses();
  return (
    <div
      className={`${theme.cardBackground} rounded-lg border ${theme.borderLight} ${theme.hoverBackground} ${theme.hoverBorder} cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${theme.focusRing}`}
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
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(complaint.sector)}`}
              >
                {complaint.sector}
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
              className={`text-base sm:text-lg font-medium ${theme.textPrimary} leading-relaxed`}
            >
              {complaint.description}
            </h3>
          </div>

          <div
            className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm ${theme.textSecondary}`}
          >
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{complaint.location.name}</span>
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
                {`Assigned To : ${complaint.assignStatus == "assigned" ? complaint.assignedWorker?.userName : complaint.assignStatus} `}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
