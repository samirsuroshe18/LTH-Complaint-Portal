import { Calendar, User } from "lucide-react";

const NoticeCard = ({ notice, onClick, isDarkMode }) => {

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
    hoverBackground: isDarkMode ? "hover:bg-gray-700" : "hover:bg-indigo-50",
    hoverBorder: isDarkMode
      ? "hover:border-indigo-400"
      : "hover:border-indigo-400",
    focusRing: "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  });

  const theme = getThemeClasses();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      onClick={() => onClick(notice)}
      className={`${theme.cardBackground} rounded-lg border ${theme.borderLight} ${theme.hoverBackground} ${theme.hoverBorder} cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${theme.focusRing}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(notice);
        }
      }}
    >
      <div className="p-4 sm:p-6">
        
        {/* Mobile: Full width image on top, Desktop: Side by side layout */}
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          {notice.image && (
            <div className="flex-shrink-0 w-full sm:w-auto">
              <img
                src={notice.image}
                alt={notice.title}
                className={`w-full h-16 sm:w-20 sm:h-20 object-cover rounded-lg border ${theme.borderLight}`}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base sm:text-lg font-semibold ${theme.textPrimary} mb-2 line-clamp-2`}
            >
              {notice.title}
            </h3>
            <p className={`${theme.textSecondary} mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2 sm:line-clamp-3`}>
              {notice.description}
            </p>
            
            {/* Mobile: Stack metadata vertically, Desktop: Side by side */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-1">
                  <User className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textTertiary}`} />
                  <span className={`text-xs sm:text-sm ${theme.textTertiary} truncate`}>
                    {notice.createdBy.userName}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textTertiary}`} />
                  <span className={`text-xs sm:text-sm ${theme.textTertiary}`}>
                    {formatDate(notice.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeCard;