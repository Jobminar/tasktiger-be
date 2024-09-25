import express from "express";
import trainingController from "../controllers/training.controller.js";

const router = express.Router();

router.post("/", trainingController.createTraining);

router.get("/", trainingController.getAllTrainings);

router.get("/:id", trainingController.getTrainingById);

router.delete("/:id", trainingController.deleteTraining);

router.patch("/:id",trainingController.updateTraining)

export default router;
