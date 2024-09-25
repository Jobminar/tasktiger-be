import express from "express";
import providerTargetController from "../controller/provider-target.controller.js";

const router = express.Router();


router.post("/", providerTargetController.createServiceProviderTarget);

router.get("/", providerTargetController.getAllServiceProviderTargets);

router.get("/:providerId", providerTargetController.getServiceByProviderId);

router.put("/:id", providerTargetController.updateServiceProviderTarget);

router.delete("/:id", providerTargetController.deleteServiceProviderTarget);

export default router;
