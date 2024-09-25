import express from "express";
import getGeocodeController from "../map-controller/map.controller.js";

const router = express.Router();

// Use the same controller for both POST and GET requests
router.post('/geocode', getGeocodeController);
router.get('/geocode', getGeocodeController);

export default router;
