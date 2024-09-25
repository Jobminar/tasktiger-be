import express from "express";
import userController from "../user-auth-controllers/user.auth.controller.js";

const router = express.Router();


router.post("/send-otp",userController.sendOtp)

router.post("/login",userController.login)

router.get("/:id",userController.getUser)  

router.get("/",userController.getAllUsers)

router.put("/:id",userController.updateUser)

router.delete("/:id",userController.deleteUser)

export default router;
