"use client"

import { useState } from "react"
import { ComplaintProvider } from "./contexts/ComplaintContext"
import { SidebarProvider } from "./components/ui/sidebar"
import AppSidebar from "./components/AppSidebar"
import HomePage from "./components/HomePage"
import ComplaintForm from "./components/ComplaintForm"
import HistoryPage from "./components/HistoryPage"
import "./App.css"

function App() {
  const [currentPage, setCurrentPage] = useState("home")
  const [selectedCategory, setSelectedCategory] = useState(null)

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setCurrentPage("complaint-form")
  }

  const handleBackToHome = () => {
    setCurrentPage("home")
    setSelectedCategory(null)
  }

  const handleNavigateToHistory = () => {
    setCurrentPage("history")
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onCategorySelect={handleCategorySelect} />
      case "complaint-form":
        return <ComplaintForm category={selectedCategory} onBack={handleBackToHome} onSuccess={handleBackToHome} />
      case "history":
        return <HistoryPage onBack={handleBackToHome} />
      default:
        return <HomePage onCategorySelect={handleCategorySelect} />
    }
  }

  return (
    <div className="App">
      <ComplaintProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar
              onNavigateHome={handleBackToHome}
              onNavigateHistory={handleNavigateToHistory}
              currentPage={currentPage}
            />
            <main className="flex-1">{renderCurrentPage()}</main>
          </div>
        </SidebarProvider>
      </ComplaintProvider>
    </div>
  )
}

export default App
