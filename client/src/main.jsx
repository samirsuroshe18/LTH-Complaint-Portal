import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { ComplaintProvider } from "./contexts/ComplaintContext";
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <ComplaintProvider>
    <App />
  </ComplaintProvider>,
)
