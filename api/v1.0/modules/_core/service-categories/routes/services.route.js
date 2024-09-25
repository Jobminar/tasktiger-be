import express from "express";
import serviceController from "../controllers/services.controller.js";

const router = express.Router();

router.post("/", serviceController.createService);

router.get("/", serviceController.getServices);

router.get("/filter/:categoryId/:subCategoryId",serviceController.getServicesByCategoryAndSubcategory);

router.get("/:id", serviceController.getServiceById);

router.put("/:id", serviceController.updateService);

router.delete("/:id", serviceController.deleteService);

export default router;
