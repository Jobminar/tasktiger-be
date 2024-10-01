import express from "express";
import goldController from '../controller/gold.controller.js'
const router = express.Router();

// Use the upload middleware for the createGold route
router.post("/", goldController.createGold);
router.get("/", goldController.getAllGold);
router.delete("/:id", goldController.deleteGold);  

export default router;
