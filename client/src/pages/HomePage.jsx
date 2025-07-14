import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Home,
  Hammer,
  Phone,
  Zap,
  Monitor,
  AlertTriangle,
  Wind,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Memoize location ID extraction
  const locationId = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("locationId");
    // Store in sessionStorage if present
    if (id) {
      sessionStorage.setItem("locationId", id);
    }
    return id;
  }, [location.search]);

  // Memoize categories array
  const categories = useMemo(() => [
    {
      icon: Home,
      title: "Housekeeping",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      icon: Hammer,
      title: "Carpentry",
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
    },
    {
      icon: Phone,
      title: "Telephone",
      color: "bg-cyan-500",
      hoverColor: "hover:bg-cyan-600",
    },
    {
      icon: Zap,
      title: "Electrical",
      color: "bg-yellow-500",
      hoverColor: "hover:bg-yellow-600",
    },
    {
      icon: Monitor,
      title: "Technical",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      icon: AlertTriangle,
      title: "Unsafe Condition",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
    },
    {
      icon: Wind,
      title: "Air Conditioning",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
    },
    {
      icon: MoreHorizontal,
      title: "Others",
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
    },
  ], []);

  // Memoize theme classes
  const themeClasses = useMemo(() => ({
    background: isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100',
    cardBackground: isDarkMode ? 'bg-gray-800' : 'bg-white',
    textPrimary: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    borderLight: isDarkMode ? 'border-gray-700' : 'border-gray-200',
  }), [isDarkMode]);

  // Memoize category click handler
  const handleCategoryClick = useCallback((category) => {
    navigate("/submit", { state: { selectedCategory: category, locationId } });
  }, [navigate, locationId]);

  // Theme detection effect
  useEffect(() => {
    const checkTheme = () => {
      const colorScheme = document.documentElement.getAttribute('data-toolpad-color-scheme');
      setIsDarkMode(colorScheme === 'dark');
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-toolpad-color-scheme') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-toolpad-color-scheme']
    });

    return () => observer.disconnect();
  }, []);

  // Memoize info icon SVG
  const InfoIcon = useMemo(() => (
    <svg
      className="w-5 h-5 text-blue-400 mt-0.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ), []);

  return (
    <div className={`min-h-screen ${themeClasses.background} py-8 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-6">
            <img
              src="/lt-logo.svg"
              alt="LTH Logo"
              className="mx-auto h-12 w-auto"
            />
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
            LTH COMPLAINT PORTAL
          </h1>
          <p className={`mt-1 ${themeClasses.textSecondary}`}>
            Select a category to report your issue
          </p>
        </header>

        {/* Categories Grid */}
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.title}
                onClick={() => handleCategoryClick(category.title)}
                className={`
                  ${themeClasses.cardBackground} rounded-lg shadow-md border ${themeClasses.border} p-6 
                  transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  min-h-[140px] flex flex-col items-center justify-center
                `}
                aria-label={`Submit complaint for ${category.title}`}
              >
                <div
                  className={`
                    ${category.color} ${category.hoverColor}
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    transition-colors duration-200
                  `}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className={`${themeClasses.textPrimary} font-semibold text-center leading-tight`}>
                  {category.title}
                </h3>
              </button>
            );
          })}
        </main>

        {/* Note */}
        <aside className={`${themeClasses.cardBackground} ${themeClasses.border} ${themeClasses.borderLight} p-4 rounded-r-lg`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {InfoIcon}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${themeClasses.textPrimary}`}>
                <span className="font-semibold">Note:</span> You can only submit
                one complaint per category at a time. Please wait for your
                current complaint to be resolved before submitting a new one.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;