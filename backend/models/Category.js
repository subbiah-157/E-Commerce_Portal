const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    subCategories: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // explicit _id
        name: { type: String, required: true },
        subSubCategories: { type: [String], default: [] }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
