import express from "express";
import { createSilver, getSilver, updateSilver, deleteSilver, uploadImage } from '../controller/silver.controller.js'

const router = express.Router();

router.post("/", uploadImage, createSilver); // Use the upload middleware
router.get("/", getSilver);
router.put("/:id", uploadImage, updateSilver); // Use the upload middleware
router.delete("/:id", deleteSilver);

export default router;
