import express from "express";
import bannersController from "../banners-controller/banners.controller.js";


const router = express.Router();

router.post("/",bannersController.createBanners)

router.get("/",bannersController.getAllBanners)

router.delete("/:id",bannersController.deleteBanner)

router.patch("/:id",bannersController.updateBanner)

router.get("/:type",bannersController.getBannersByType)

export default router;
