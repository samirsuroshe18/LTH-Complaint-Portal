import { ArrowLeft, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const NoticeDetails = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const notice = location.state?.notice;

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
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600"
      : "bg-gray-100 hover:bg-gray-200",
    buttonSecondaryText: isDarkMode ? "text-gray-300" : "text-gray-700",
    focusRing: "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  });

  const theme = getThemeClasses();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`min-h-screen ${theme.background}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center space-x-2 mb-4 sm:mb-6 px-3 py-2 sm:px-4 rounded-lg ${theme.buttonSecondary} ${theme.buttonSecondaryText} transition-colors ${theme.focusRing} text-sm sm:text-base`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notices</span>
        </button>

        <div
          className={`${theme.cardBackground} rounded-lg border ${theme.borderLight} overflow-hidden`}
        >
          {notice?.image && (
            <div className="w-full">
              <img
                src={notice.image}
                alt={notice.title}
                className="w-full object-contain"
                onError={(e) => {
                  e.target.parentElement.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="p-4 sm:p-6 md:p-8">
            <h1
              className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.textPrimary} mb-4 sm:mb-6`}
            >
              {notice.title}
            </h1>

            {/* Mobile: Stack metadata vertically, Desktop: Side by side */}
            <div
              className={`flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b ${theme.borderLight}`}
            >
              <div className="flex items-center space-x-2">
                <User
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textTertiary}`}
                />
                <div>
                  <p className={`text-xs sm:text-sm ${theme.textTertiary}`}>
                    Created by
                  </p>
                  <p
                    className={`font-medium text-sm sm:text-base ${theme.textSecondary}`}
                  >
                    {notice?.createdBy?.userName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textTertiary}`}
                />
                <div>
                  <p className={`text-xs sm:text-sm ${theme.textTertiary}`}>
                    Created on
                  </p>
                  <p
                    className={`font-medium text-sm sm:text-base ${theme.textSecondary}`}
                  >
                    {formatDate(notice.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`prose max-w-none ${theme.textSecondary}`}>
              <h2
                className={`text-lg sm:text-xl font-semibold ${theme.textPrimary} mb-3 sm:mb-4`}
              >
                Description
              </h2>
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {notice?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetails;