import { createContext, useContext, useEffect, useState } from "react"; 
import axios from "axios";
import API_BASE_URL from "../config";
import { AuthContext } from "./AuthContext";
import { Buffer } from "buffer"; // ✅ for handling MongoDB Buffer objects

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [allCarts, setAllCarts] = useState([]); // For admin

  const getAuthConfig = () => {
    if (!user?.token) return null;
    return { headers: { Authorization: `Bearer ${user.token}` } };
  };

  // ✅ Robust getImageUrl helper
  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";

    // If it's already a usable URL or data string
    if (typeof img === "string" && (img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:"))) {
      return img;
    }

    // If it's a relative path
    if (typeof img === "string" && img.startsWith("/")) {
      return `${API_BASE_URL}${img}`;
    }

    // If it's a MongoDB buffer object
    if (typeof img === "object" && img.data && img.contentType) {
      try {
        const base64 = Buffer.from(img.data).toString("base64");
        return `data:${img.contentType};base64,${base64}`;
      } catch {
        return "/placeholder.png";
      }
    }

    // Default fallback
    return "/placeholder.png";
  };

  useEffect(() => {
    const fetchCart = async () => {
      if (!user?.token) return setCart([]);
      try {
        const config = getAuthConfig();
        const res = await axios.get(`${API_BASE_URL}/api/cart`, config);
        const validProducts = res.data.products
          .filter(p => p.product)
          .map(p => ({
            ...p.product,
            qty: p.qty,
            selectedSize: p.selectedSize || "",
            image: getImageUrl(p.product.image),
          }));
        setCart(validProducts);
      } catch (err) {
        console.error("Failed to fetch cart:", err.response?.data || err.message);
      }
    };
    fetchCart();
  }, [user]);

  // ===== Existing Operations (unchanged) =====
  const addToCart = async (product) => {
    if (!user?.token) return alert("Login to add to cart");
    try {
      const config = getAuthConfig();
      await axios.post(
        `${API_BASE_URL}/api/cart/add`,
        { productId: product._id, qty: product.qty || 1, selectedSize: product.selectedSize || "" },
        config
      );

      const existing = cart.find(p => p._id === product._id && p.selectedSize === product.selectedSize);
      if (existing) {
        setCart(cart.map(p => 
          p._id === product._id && p.selectedSize === product.selectedSize 
            ? { ...p, qty: p.qty + (product.qty || 1) } 
            : p
        ));
      } else {
        const productWithImage = {
          ...product,
          qty: product.qty || 1,
          selectedSize: product.selectedSize || "",
          image: getImageUrl(product.image),
        };
        setCart([...cart, productWithImage]);
      }
    } catch (err) {
      console.error("Add to cart failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Add to cart failed");
    }
  };

  const removeFromCart = async (id, size = "") => {
    if (!user?.token) return;
    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE_URL}/api/cart/remove`, {
        ...config,
        data: { productId: id, selectedSize: size },
      });
      setCart(cart.filter(p => !(p._id === id && p.selectedSize === size)));
    } catch (err) {
      console.error("Remove from cart failed:", err.response?.data || err.message);
    }
  };

  const updateQty = async (id, qty, size = "") => {
    if (!user?.token) return;
    try {
      const config = getAuthConfig();
      await axios.put(`${API_BASE_URL}/api/cart/update`, 
        { productId: id, qty, selectedSize: size }, 
        config
      );
      setCart(cart.map(p => 
        p._id === id && p.selectedSize === size 
          ? { ...p, qty } 
          : p
      ));
    } catch (err) {
      console.error("Update quantity failed:", err.response?.data || err.message);
    }
  };

  const clearCart = async () => {
    if (!user?.token) return;
    try {
      const config = getAuthConfig();
      for (let item of cart) {
        await axios.delete(`${API_BASE_URL}/api/cart/remove`, {
          ...config,
          data: { productId: item._id, selectedSize: item.selectedSize },
        });
      }
      setCart([]);
    } catch (err) {
      console.error("Clear cart failed:", err.response?.data || err.message);
    }
  };

  const fetchAllCartsForAdmin = async () => {
    if (!user?.token || !user.isAdmin) return [];
    try {
      const config = getAuthConfig();
      const res = await axios.get(`${API_BASE_URL}/api/cart/admin/all`, config);

      const carts = res.data
        .filter(item => item.product)
        .map(item => ({
          ...item,
          product: {
            ...item.product,
            selectedSize: item.selectedSize || "",
            image: getImageUrl(item.product.image),
          },
        }));

      setAllCarts(carts);
      return carts;
    } catch (err) {
      console.error("Failed to fetch all carts:", err.response?.data || err.message);
      return [];
    }
  };

  const refreshUserCart = async () => {
    if (!user?.token) return;
    try {
      const config = getAuthConfig();
      const res = await axios.get(`${API_BASE_URL}/api/cart`, config);
      const validProducts = res.data.products
        .filter(p => p.product)
        .map(p => ({
          ...p.product,
          qty: p.qty,
          selectedSize: p.selectedSize || "",
          image: getImageUrl(p.product.image), 
        }));
      setCart(validProducts);
    } catch (err) {
      console.error("Failed to refresh user cart:", err.response?.data || err.message);
    }
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty, clearCart, refreshUserCart,
      allCarts, fetchAllCartsForAdmin
    }}>
      {children}
    </CartContext.Provider>
  );
};
