import Category from "../models/categories.model.js";

export const createCategory = async (data) => {
  try {
    const category = new Category(data);
    await category.save();
    return category;
  } catch (error) {
    throw new Error("Failed to create category");
  }
};

export const getCategories = async () => {
  try {
    const categories = await Category.find();
    return categories;
  } catch (error) {
    throw new Error("Failed to get categories");
  }
};

export const getCategoryById = async (id) => {
  try {
    const category = await Category.findById(id);
    return category;
  } catch (error) {
    throw new Error("Failed to get category by id");
  }
};
