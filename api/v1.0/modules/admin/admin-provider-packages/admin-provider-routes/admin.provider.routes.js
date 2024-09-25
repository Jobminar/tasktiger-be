import express from "express";
import adminProviderPackageController from '../admin-provider-packages-controller/admin.provider.packages.controller.js'

const router = express.Router();

// Routes for admin provider packages
router.post("/", adminProviderPackageController.createAdminProviderPackage);
router.get("/", adminProviderPackageController.getAllAdminProviderPackages);
router.put("/:id", adminProviderPackageController.updateAdminProviderPackage);
router.delete("/:id", adminProviderPackageController.deleteAdminProviderPackage);

export default router;
