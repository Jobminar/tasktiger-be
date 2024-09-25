import express from "express";
import financeController from "../controllers/provider-finance.controller.js";

const router = express.Router();


router.post("/", financeController.createServiceProviderFinance);


router.get("/", financeController.getAllServiceProviderFinances);


router.get("/:id", financeController.getServiceProviderFinanceByProviderId);


router.patch("/:id", financeController.updateServiceProviderFinance);


router.delete("/:id", financeController.deleteServiceProviderFinance);

export default router;
