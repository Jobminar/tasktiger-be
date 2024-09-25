import express from "express";
import providerController from "../controllers/provider-auth.controller.js";

const router = express.Router();

router.post("/signup", providerController.signup);

router.post("/login", providerController.login);

router.post("/verify-otp", providerController.verifyOtp);

router.get("/:id", providerController.getProviderByproviderId);

export default router;
