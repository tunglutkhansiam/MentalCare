import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error boundary for debugging
const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

console.log("App starting...");

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

try {
  createRoot(root).render(<App />);
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
  root.innerHTML = `<div style="padding: 20px; color: red;">Error loading app: ${error}</div>`;
}
