import axios from "axios";

export const fetchCurrencyRates = async () => {
  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/GBP");
    return response.data.rates; // rates relative to GBP
  } catch (err) {
    console.error("Failed to fetch currency rates:", err);
    return {}; // fallback to empty object
  }
};
