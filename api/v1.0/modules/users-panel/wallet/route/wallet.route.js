import express from "express";
import walletController from "../controller/wallet.controller.js";

const router = express.Router();

router.post("/", walletController.createWallet);
router.get("/wallet/:id", walletController.getBalance);
router.patch("/", walletController.updateBalance);

export default router;
