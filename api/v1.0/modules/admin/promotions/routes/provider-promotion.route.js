// routes/provider-promotion.route.js
import express from "express";
import providerPromotions from "../controllers/provider-promotion.controller.js";

const router = express.Router();

router.post("/", providerPromotions.createProviderPromotion);

router.get("/", providerPromotions.getProviderPromotions);

router.delete("/:id", providerPromotions.deleteProviderPromotion);

router.patch("/:id",providerPromotions.updateProviderPromotion)

export default router;
