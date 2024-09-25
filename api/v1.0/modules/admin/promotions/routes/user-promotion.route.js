
import express from "express";
import userPromotionController from "../controllers/user-promotion.controller.js";

const router = express.Router();

router.post("/", userPromotionController.createUserPromotion);

router.get("/", userPromotionController.getUserPromotions);

router.delete("/:id", userPromotionController.deleteUserPromotion);

router.patch("/:id",userPromotionController.updateUserPromotion)

export default router;
