// backend/routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { protect } = require("../middleware/authMiddleware");

// POST new review
router.post("/:productId", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = new Review({
      productId: req.params.productId,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Error saving review", error: err.message });
  }
});

// GET all reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
});

// ✅ UPDATE review
router.put("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only review owner can edit
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    review.comment = req.body.comment || review.comment;
    review.rating = req.body.rating || review.rating;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ message: "Error updating review", error: err.message });
  }
});

// ✅ DELETE review
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only review owner can delete
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting review", error: err.message });
  }
});

module.exports = router;
