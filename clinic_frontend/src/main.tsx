import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.tsx";
import "./index.css";

// In production, move your client ID to environment variables (.env)
// For local testing, you can use the environment variable if available, or just a placeholder 
// Note: Google Sign-in won't work perfectly until you put a real Client ID here.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "742054700211-20p4r8ka4qj1n79fm52fbsip8nojrhn3.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
);
