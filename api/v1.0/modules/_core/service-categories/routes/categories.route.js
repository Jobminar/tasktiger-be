import express from "express";
import categoriesController from "../controllers/categories.controller.js";

const router = express.Router();

router.post("/", categoriesController.createCategory);

router.get("/", categoriesController.getCategories);

router.get("/:id", categoriesController.getCategoryById);

router.put("/:id", categoriesController.updateCategory);

// router.delete("/:id", categoriesController.deleteCategory);

router.delete("/:id",categoriesController.deleteCategorySubcategoryService)

export default router;
