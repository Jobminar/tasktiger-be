import express from 'express'
import jobsController from '../controller/jobs.controller.js'

const router=express.Router()

router.post("/",jobsController.createJob)
router.get("/",jobsController.getAllJobs)
router.delete("/:id",jobsController.deleteJob)
router.get("/:id",jobsController.getAdminById)

export default router