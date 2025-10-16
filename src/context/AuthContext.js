import { createContext, useState, useEffect } from "react";
 
export const AuthContext = createContext();
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // ✅ Helper function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error("Invalid token format:", error);
      return true; // treat invalid token as expired
    }
  };
 
  // ✅ Load user & token from sessionStorage on first render
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("authToken");
 
      if (storedUser && storedUser !== "undefined" && storedToken) {
        if (isTokenExpired(storedToken)) {
          console.warn("Session expired. Logging out...");
          logout();
          window.location.href = "/login";
        } else {
          const parsedUser = JSON.parse(storedUser);
          setUser({ ...parsedUser, token: storedToken });
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("authToken");
      }
    } catch (err) {
      console.error("Failed to load user:", err);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
 
  // ✅ Automatically logout when token expires during session
  useEffect(() => {
    if (!user?.token) return;
 
    const checkInterval = setInterval(() => {
      if (isTokenExpired(user.token)) {
        console.warn("Token expired — auto logout triggered");
        logout();
        window.location.href = "/login";
      }
    }, 60 * 1000); // check every 60 seconds
 
    return () => clearInterval(checkInterval);
  }, [user]);
 
  // ✅ Login: save user + token to state & sessionStorage
  const login = (userData) => {
    if (!userData) return;
 
    const normalizedUser = {
      token: userData.token,
      id: userData.id,
      name: userData.name || "Guest",
      email: userData.email || "",
      isAdmin: Boolean(userData.isAdmin),
      role: userData.role
        ? userData.role
        : Boolean(userData.isAdmin)
        ? "admin"
        : "user",
    };
 
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("authToken", userData.token);
    setUser(normalizedUser);
  };
 
  // ✅ Logout: clear sessionStorage & reset state + redirect to login
  const logout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    setUser(null);
    window.location.href = "/login";
  };
 
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
 