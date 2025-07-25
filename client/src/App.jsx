import { useState, useEffect } from "react";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { Outlet } from "react-router";
import HomeIcon from "@mui/icons-material/Home";
import HistoryIcon from "@mui/icons-material/History";
import { BellIcon } from "lucide-react";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  });

  const NAVIGATION = [
    {
      title: "Home",
      segment: "",
      icon: <HomeIcon />,
    },
    {
      title: "History",
      segment: "history",
      icon: <HistoryIcon />,
    },
    {
      title: "Notice",
      segment: "notice-board",
      icon: <BellIcon />,
    },
  ];

  const BRANDING = {
    title: "LTH Complaint Portal",
    logo: <img src="/lt-logo.svg" alt="L&T Logo" style={{ height: "24px" }} />,
  };

  return (
    <div className={`${getThemeClasses().background} min-h-screen`}>
      <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING}>
        <Outlet />
      </ReactRouterAppProvider>
    </div>
  );
}

export default App;
