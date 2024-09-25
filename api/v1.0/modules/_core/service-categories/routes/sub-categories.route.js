import express from "express";
import subcategoriesController from "../controllers/sub-categories.controller.js";

const router = express.Router();

router.post("/", subcategoriesController.createSubcategory);

router.get("/", subcategoriesController.getSubcategories);

router.get("/details/:id", subcategoriesController.getSubcategoryById);

router.get("/category/:categoryId",subcategoriesController.getSubcategoriesByCategoryId);

router.put("/:id", subcategoriesController.updateSubcategory);

router.delete("/:id", subcategoriesController.deleteSubcategory);

export default router;
