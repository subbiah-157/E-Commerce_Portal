import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const CurrencyContext = createContext();

const CurrencyProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [currency, setCurrency] = useState("GBP"); // default

  // Load currency from DB on login
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!user) return;

      try {
        const res = await axios.get(`http://localhost:5000/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setCurrency(res.data.currency || "GBP");
      } catch (err) {
        console.error("Failed to fetch currency:", err);
      }
    };

    fetchCurrency();
  }, [user]);

  // Change currency and save to DB
  const changeCurrency = async (newCurrency) => {
    setCurrency(newCurrency);

    if (!user) return; // only save for logged-in users
    try {
      await axios.put(
        "http://localhost:5000/api/users/currency",
        { currency: newCurrency },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.error("Failed to update currency:", err);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyProvider;
