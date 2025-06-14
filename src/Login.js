import React, { useState, useEffect } from "react";
import Papa from "papaparse";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // URL to your credentials CSV (should be different from your data CSV)
  const credentialsUrl = process.env.REACT_APP_CREDENTIALS_URL;

  // Function to fetch fresh credentials
  const fetchCredentials = async () => {
    return new Promise((resolve, reject) => {
      if (!credentialsUrl) {
        console.error("Credentials URL is not set in environment variables");
        reject("Credentials URL not set");
        return;
      }

      console.log("Fetching credentials from:", credentialsUrl);
      
      // Use Papa.parse directly with download option
      Papa.parse(credentialsUrl, {
        download: true,
        header: true,
        complete: (results) => {
          const validCredentials = results.data.filter(item => item.user && item.password);
          console.log(`Found ${validCredentials.length} valid credentials`);
          resolve(validCredentials);
        },
        error: (error) => {
          console.error("Error parsing credentials:", error);
          reject("Failed to parse authentication data");
        }
      });
    });
  };

  // Initial load of credentials to check if the URL is valid
  useEffect(() => {
    if (!credentialsUrl) {
      setError("Credentials URL not set. Please check your environment variables.");
      return;
    }
    
    setIsLoading(true);
    fetchCredentials()
      .then(() => {
        console.log("Initial credentials check successful");
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Initial credentials check failed:", err);
        setError(err);
        setIsLoading(false);
      });
  }, [credentialsUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch fresh credentials every time user tries to log in
      const credentials = await fetchCredentials();
      
      // Check credentials against loaded data
      const user = credentials.find(
        cred => cred.user === username && cred.password === password
      );

      if (user) {
        console.log("Login successful");
        onLoginSuccess();
      } else {
        console.log("Invalid credentials");
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(typeof err === 'string' ? err : "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Kshitij Makwana App Login
        </h2>
        
        {isLoading ? (
          <div className="text-center py-4">Loading authentication data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm py-1">{error}</div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Log In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
