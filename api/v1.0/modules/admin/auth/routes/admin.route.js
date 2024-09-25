import express from "express";
import adminController from "../controllers/admin.controller.js";

const router = express.Router();


router.post("/signup", adminController.signup);

router.post("/login", adminController.login);

router.post("/send-otp", adminController.sendForgotPasswordOtp);

router.post("/change-password", adminController.changePassword);

export default router;
