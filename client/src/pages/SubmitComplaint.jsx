import { useState, useEffect, useCallback, useMemo } from "react";
import { Camera, Upload, AlertCircle, CheckCircle, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SubmitComplaint() {
  const location = useLocation();
  const navigate = useNavigate();
  let { selectedCategory, locationId } = location.state || {};
  // Fallback to sessionStorage if locationId is missing
  if (!locationId) {
    locationId = sessionStorage.getItem("locationId") || "";
  }

  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection with cleanup
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

  // Memoized theme classes to prevent recalculation
  const themeClasses = useMemo(
    () => ({
      background: isDarkMode
        ? "bg-gray-900"
        : "bg-gradient-to-br from-blue-50 to-indigo-100",
      cardBackground: isDarkMode ? "bg-gray-800" : "bg-white",
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
      footerBackground: isDarkMode ? "bg-gray-700" : "bg-gray-50",
      errorBackground: isDarkMode ? "bg-red-900/20" : "bg-red-50",
      errorBorder: isDarkMode ? "border-red-800" : "border-red-200",
      errorText: isDarkMode ? "text-red-300" : "text-red-800",
      successBackground: isDarkMode ? "bg-green-900/20" : "bg-green-50",
      successBorder: isDarkMode ? "border-green-800" : "border-green-200",
      successText: isDarkMode ? "text-green-300" : "text-green-800",
    }),
    [isDarkMode]
  );

  // Memoized form validation
  const isFormValid = useMemo(
    () => description.trim().length > 0 && locationId?.trim().length > 0,
    [description, locationId]
  );

  // Optimized file upload handler
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size should be less than 2MB");
      return;
    }

    // File type validation
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    setError("");
  }, []);

  // Optimized submit handler
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("category", selectedCategory || "General");
      formData.append("locationId", locationId || "0");
      formData.append("description", description);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/complaint/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        const errorData = await response.json();

        switch (response.status) {
          case 400:
            errorMessage = errorData.message || "Invalid request data";
            break;
          case 401:
            errorMessage = "You are not authorized to submit complaints";
            break;
          case 413:
            errorMessage = "File size is too large";
            break;
          case 500:
            errorMessage = "Server error. Please try again later";
            break;
          default:
            errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      await response.json();
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/history");
      }, 2000);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setError(err.message || "Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    selectedCategory,
    locationId,
    description,
    selectedFile,
    navigate,
  ]);

  // Location validation effect
  useEffect(() => {
    if (locationId) {
      setError("");
    } else if (!locationId) {
      setError("Location ID is missing please scan again.");
    }
  }, [locationId]);

  // Optimized file removal
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError("");
  }, []);

  // Optimized error clearing
  const clearError = useCallback(() => setError(""), []);

  // Success screen - early return to avoid unnecessary renders
  if (showSuccess) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} flex items-center justify-center p-4`}
      >
        <div
          className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 max-w-md w-full text-center`}
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3
            className={`text-xl font-semibold ${themeClasses.textPrimary} mb-2`}
          >
            Complaint Submitted Successfully
          </h3>
          <p className={`${themeClasses.textSecondary} mb-4`}>
            Thank you for your feedback. Our {selectedCategory} team will
            address your concern shortly.
          </p>
          <p className="text-sm text-indigo-600">
            Redirecting to history page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <div className="max-w-2xl mx-auto p-2">
        {/* Header */}
        <div className="p-2 mb-3">
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
            {selectedCategory} Complaint
          </h1>
          <p className={`mt-1 ${themeClasses.textSecondary}`}>
            Help us improve our service quality
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className={`mb-6 p-4 ${themeClasses.errorBackground} border ${themeClasses.errorBorder} rounded-xl`}
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className={themeClasses.errorText}>{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
                aria-label="Clear error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div
          className={`${themeClasses.cardBackground} rounded-2xl shadow-xl overflow-hidden`}
        >
          <div className="p-2">
            <div className="space-y-6">
              {/* Description Section */}
              <div>
                <div className="flex items-center mb-3">
                  <AlertCircle className="w-5 h-5 text-indigo-600 mr-2" />
                  <label
                    htmlFor="description"
                    className={`text-lg font-semibold ${themeClasses.textPrimary}`}
                  >
                    Complaint Details
                  </label>
                  <span className="text-red-500 ml-1" aria-label="Required">
                    *
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe the issue in detail. Include time, and any specific concerns..."
                    rows={5}
                    maxLength={500}
                    className={`w-full px-4 py-3 border ${themeClasses.border} ${themeClasses.inputBackground} rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none ${themeClasses.inputText} ${themeClasses.inputPlaceholder}`}
                    required
                  />
                  <div
                    className={`absolute bottom-3 right-3 text-xs ${themeClasses.textTertiary}`}
                  >
                    {description.length}/500
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <div className="flex items-center mb-3">
                  <Camera className="w-5 h-5 text-indigo-600 mr-2" />
                  <label
                    className={`text-lg font-semibold ${themeClasses.textPrimary}`}
                  >
                    Photo Evidence
                  </label>
                  <span
                    className={`${themeClasses.textTertiary} ml-2 text-sm font-normal`}
                  >
                    (Optional)
                  </span>
                </div>

                {/* Upload Photo Button */}
                <label
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed ${themeClasses.border} rounded-xl ${themeClasses.hoverBorder} ${themeClasses.hoverBackground} transition-colors duration-200 group cursor-pointer`}
                >
                  <Upload
                    className={`w-8 h-8 ${themeClasses.textTertiary} group-hover:text-indigo-600 mb-2`}
                  />
                  <span
                    className={`text-sm font-medium ${themeClasses.textSecondary} group-hover:text-indigo-600`}
                  >
                    Upload Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload photo"
                  />
                </label>
                {selectedFile && (
                  <div
                    className={`mt-4 p-3 ${themeClasses.successBackground} border ${themeClasses.successBorder} rounded-lg`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Icon + Filename */}
                      <div className="flex items-center flex-1 min-w-0">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                        <span
                          className={`text-sm ${themeClasses.successText} truncate`}
                          title={selectedFile.name}
                        >
                          File selected: {selectedFile.name}
                        </span>
                      </div>
                      {/* Remove Button */}
                      <button
                        onClick={removeFile}
                        className="text-green-600 hover:text-green-800 flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                    isFormValid && !isSubmitting
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Complaint"
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className={`${themeClasses.footerBackground} px-8 py-4 border-t ${themeClasses.borderLight}`}>
            <p className={`text-xs ${themeClasses.textTertiary} text-center`}>
              Your complaint will be reviewed within 24 hours. For urgent matters, please contact the front desk directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}