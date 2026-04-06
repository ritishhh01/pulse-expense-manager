import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply theme immediately before React renders to prevent flash
try {
  const stored = localStorage.getItem("pulse-theme");
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
} catch {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
