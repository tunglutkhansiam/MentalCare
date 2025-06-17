import { createRoot } from "react-dom/client";
import "./index.css";

// Create a simple test component first
function TestApp() {
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "lightblue", 
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1>MentalCare Test</h1>
      <p>If you can see this, the basic React setup is working.</p>
      <button onClick={() => alert("Button works!")}>Test Button</button>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

console.log("Starting test app...");

// Add global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  root.innerHTML = `<div style="padding: 20px; color: red; background: white;">
    <h2>JavaScript Error Detected:</h2>
    <p><strong>Message:</strong> ${e.message}</p>
    <p><strong>File:</strong> ${e.filename}</p>
    <p><strong>Line:</strong> ${e.lineno}</p>
    <pre style="background: #f0f0f0; padding: 10px; margin: 10px 0;">${e.error && e.error.stack}</pre>
  </div>`;
});

try {
  createRoot(root).render(<TestApp />);
  console.log("Test app rendered successfully");
} catch (error) {
  console.error("Error rendering test app:", error);
  root.innerHTML = `<div style="padding: 20px; color: red; background: white;">
    <h2>React Render Error:</h2>
    <p>${error}</p>
    <pre style="background: #f0f0f0; padding: 10px;">${error.stack}</pre>
  </div>`;
}
