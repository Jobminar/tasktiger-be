import express from "express";
import inductionController from '../controllers/induction.controller.js'

const router = express.Router();

// router.post("/", inductionController.createInduction);

router.post('/', inductionController.upload.single('video'), inductionController.createInduction);

router.get("/", inductionController.getAllInductions);

router.get("/:categoryId", inductionController.getInductionById);

router.delete("/:id", inductionController.deleteInduction);

router.patch("/:id",inductionController.updateInduction)

export default router;
