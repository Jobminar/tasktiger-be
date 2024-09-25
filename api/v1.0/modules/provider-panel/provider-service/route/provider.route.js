// routes/provider.routes.js
import express from "express";
import providerController from "../controller/provider.controller.js";

const router = express.Router();

router.post("/", providerController.createServiceProvider);

router.get("/", providerController.getAllServiceProviders);

router.get("/:id", providerController.getServiceProviderById);

router.put("/:id", providerController.updateServiceProvider);

router.delete("/:id", providerController.deleteServiceProvider);

router.patch("/:id/credits", providerController.updateCredits);

export default router;
