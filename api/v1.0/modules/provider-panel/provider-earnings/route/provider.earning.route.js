// routes/earningsRoutes.js
import express from 'express';
import providerEarningController from '../controller/provider.earning.controller.js';


const router = express.Router();

router.post("/",providerEarningController.createEarnings)

router.get("/get-earnings/:id",providerEarningController.getByProviderId)


export default router;
