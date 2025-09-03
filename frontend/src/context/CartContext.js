import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [allCarts, setAllCarts] = useState([]); // For admin

  const getAuthConfig = () => {
    if (!user?.token) return null;
    return { headers: { Authorization: `Bearer ${user.token}` } };
  };

  // Fetch user cart on login or token change
  useEffect(() => {
    const fetchCart = async () => {
      if (!user?.token) return setCart([]);
      try {
        const config = getAuthConfig();
        const res = await axios.get("http://localhost:5000/api/cart", config);
        const validProducts = res.data.products
          .filter(p => p.product)
          .map(p => ({
            ...p.product,
            qty: p.qty,
            selectedSize: p.selectedSize || "",
            image: p.product.image
              ? p.product.image.startsWith("http")
                ? p.product.image
                : `http://localhost:5000${p.product.image}`
              : null,
          }));
        setCart(validProducts);
      } catch (err) {
        console.error("Failed to fetch cart:", err.response?.data || err.message);
      }
    };
    fetchCart();
  }, [user]);

  // ===== Existing Operations =====
  const addToCart = async (product) => {
    if (!user?.token) return alert("Login to add to cart");
    try {
      const config = getAuthConfig();
      await axios.post(
        "http://localhost:5000/api/cart/add",
        { 
          productId: product._id, 
          qty: product.qty || 1,
          selectedSize: product.selectedSize || ""
        },
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
          image: product.image
            ? product.image.startsWith("http")
              ? product.image
              : `http://localhost:5000${product.image}`
            : null,
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
      await axios.delete("http://localhost:5000/api/cart/remove", {
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
      await axios.put("http://localhost:5000/api/cart/update", 
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
        await axios.delete("http://localhost:5000/api/cart/remove", {
          ...config,
          data: { productId: item._id, selectedSize: item.selectedSize },
        });
      }
      setCart([]);
    } catch (err) {
      console.error("Clear cart failed:", err.response?.data || err.message);
    }
  };

  // ===== Admin Operations =====
  const fetchAllCartsForAdmin = async () => {
    if (!user?.token || !user.isAdmin) return [];
    try {
      const config = getAuthConfig();
      const res = await axios.get("http://localhost:5000/api/cart/admin/all", config);

      const carts = res.data
        .filter(item => item.product)
        .map(item => ({
          ...item,
          product: {
            ...item.product,
            selectedSize: item.selectedSize || "",
            image: item.product.image
              ? item.product.image.startsWith("http")
                ? item.product.image
                : `http://localhost:5000${item.product.image}`
              : null,
          },
        }));

      setAllCarts(carts);
      return carts;
    } catch (err) {
      console.error("Failed to fetch all carts:", err.response?.data || err.message);
      return [];
    }
  };

  // ===== Refresh user cart manually =====
  const refreshUserCart = async () => {
    if (!user?.token) return;
    try {
      const config = getAuthConfig();
      const res = await axios.get("http://localhost:5000/api/cart", config);
      const validProducts = res.data.products
        .filter(p => p.product)
        .map(p => ({
          ...p.product,
          qty: p.qty,
          selectedSize: p.selectedSize || "",
          image: p.product.image
            ? p.product.image.startsWith("http")
              ? p.product.image
              : `http://localhost:5000${p.product.image}`
            : null,
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