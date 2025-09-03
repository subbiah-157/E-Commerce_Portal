const Category = require("../models/Category");

// GET all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD a new category
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD subcategory
exports.addSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryName } = req.body;
    if (!subCategoryName) return res.status(400).json({ message: "Subcategory name is required" });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (category.subCategories.some(sub => sub.name === subCategoryName)) {
      return res.status(400).json({ message: "Subcategory already exists" });
    }

    category.subCategories.push({ name: subCategoryName, subSubCategories: [] });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE subcategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { name } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

    subCategory.name = name;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE subcategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.subCategories.id(subCategoryId).deleteOne();
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD sub-subcategory
exports.addSubSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { subSubCategoryName } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

    if (subCategory.subSubCategories.includes(subSubCategoryName)) {
      return res.status(400).json({ message: "Sub-subcategory already exists" });
    }

    subCategory.subSubCategories.push(subSubCategoryName);
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE sub-subcategory
exports.updateSubSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId, subSubIndex } = req.params;
    const { name } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

    if (subSubIndex < 0 || subSubIndex >= subCategory.subSubCategories.length) {
      return res.status(404).json({ message: "Sub-subcategory not found" });
    }

    subCategory.subSubCategories[subSubIndex] = name;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE sub-subcategory
exports.deleteSubSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId, subSubIndex } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ message: "Subcategory not found" });

    if (subSubIndex < 0 || subSubIndex >= subCategory.subSubCategories.length) {
      return res.status(404).json({ message: "Sub-subcategory not found" });
    }

    subCategory.subSubCategories.splice(subSubIndex, 1);
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
