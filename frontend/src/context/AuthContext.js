import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user & token from sessionStorage on first render
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("authToken");

      if (storedUser && storedUser !== "undefined" && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, token: storedToken });
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

  // ✅ Logout: clear sessionStorage & reset state
  const logout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
