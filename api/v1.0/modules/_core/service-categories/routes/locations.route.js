import express from "express";
import multer from "multer";
import locationController from "../controllers/locations.controller.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), locationController.uploadCSV); 

router.get("/", locationController.getAllLocations); 

router.get("/district/:district", locationController.getAllLocationsByDistrict); 

router.get("/custom/:pincode", locationController.getCustomLocationsByPincode); 

router.post("/post", locationController.createLocation); 

router.delete("/delete/:id", locationController.deleteLocation); 

router.delete("/delete", locationController.deleteAllLocations); 

router.patch("/:id", locationController.updateLocation); 

router.get('/custom-locations',locationController.getCustomLocations);

export default router;
