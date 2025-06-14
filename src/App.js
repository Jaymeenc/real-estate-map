import React, { useState, useEffect } from "react";
import MapWithFilters from "./MapWithFilters";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const loggedInStatus = localStorage.getItem("isLoggedIn");
    if (loggedInStatus === "true") {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isLoggedIn ? (
    <MapWithFilters onLogout={() => {
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    }} />
  ) : (
    <Login onLoginSuccess={() => {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    }} />
  );
}

export default App;
