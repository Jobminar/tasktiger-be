import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import Location from "../models/locations.model.js";

// Set up multer for file handling
const upload = multer({ dest: "uploads/" });

const logError = (message, error) => {
  console.error(message, error);
};

const locationController = {
 
    uploadCSV: (req, res) => {
      const results = [];
  
      if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          try {
            const locationData = {
              district: data.district ? data.district.trim() : null,
              location: data.location ? data.location.trim() : "",
              pincode: data.pincode ? data.pincode.trim() : "",
              state: data.state ? data.state.trim() : "",
              category: data.category ? data.category.trim() : "",
              subcategory: data.subcategory ? data.subcategory.trim() : "",
              servicename: data.servicename ? data.servicename.trim() : "",
              price: data.price ? JSON.parse(data.price.trim()) : {},
              offerPrice: data.offerPrice ? JSON.parse(data.offerPrice.trim()) : {},
              min: data.min ? parseFloat(data.min.trim()) : null,
              max: data.max ? parseFloat(data.max.trim()) : null,
              metric: data.metric ? data.metric.trim() : "",
              creditEligibility:
                data.creditEligibility &&
                data.creditEligibility.trim().toLowerCase() === "true",
              taxPercentage: data.taxPercentage
                ? parseFloat(data.taxPercentage.replace("%", "").trim())
                : 0,
              miscFee: data.miscFee ? parseFloat(data.miscFee.trim()) : null,
              platformCommission: data.platformCommission
                ? parseFloat(data.platformCommission.trim())
                : 0,
              isCash: data.isCash && data.isCash.trim().toLowerCase() === "true",
              isCustom:
                data.isCustom && data.isCustom.trim().toLowerCase() === "true",
            
            };
  
            if (!locationData.district) {
              throw new Error("district is required");
            }
  
            results.push(locationData);
          } catch (error) {
            logError("Error processing CSV data", error);
          }
        })
        .on("end", async () => {
          if (results.length === 0) {
            return res
              .status(400)
              .json({ message: "No valid data found to upload" });
          }
  
          try {
            for (const locationData of results) {
              const filter = {};
  
              Object.keys(locationData).forEach((key) => {
                if (locationData[key] !== null && locationData[key] !== undefined) {
                  filter[key] = locationData[key];
                }
              });
  
              const updateData = {};
              Object.keys(locationData).forEach((key) => {
                if (locationData[key] !== null && locationData[key] !== undefined) {
                  updateData[key] = locationData[key];
                }
              });
  
              await Location.findOneAndUpdate(
                filter,
                { $set: updateData },
                { upsert: true, new: true }
              );
            }
  
            res.status(201).json({
              message: "Data successfully uploaded and updated in MongoDB",
            });
          } catch (error) {
            logError("Error inserting or updating data in MongoDB", error);
            res.status(500).json({
              message: "Error uploading data",
              error: error.message,
            });
          } finally {
            fs.unlink(req.file.path, (err) => {
              if (err) console.error("Error deleting uploaded file:", err.message);
            });
          }
        });
    },
    

  createLocation: async (req, res) => {
    try {
      const {
        district,
        location,
        pincode,
        state,
        category,
        subcategory,
        servicename,
        price,
        offerPrice,
        min,
        max,
        metric,
        creditEligibility,
        taxPercentage,
        miscFee,
        platformCommission,
        isCash,
        isCustom,
      } = req.body;

      if (!district) {
        console.error("District is required");
        return res.status(400).json({ message: "District is required" });
      }

      const newLocation = new Location({
        district,
        location: location || "",
        pincode: pincode || "",
        state: state || "",
        category: category || "",
        subcategory: subcategory || "",
        servicename: servicename || "",
        price: price || {},
        offerPrice:offerPrice || {},
        min: min || null,
        max: max || null,
        metric: metric || "",
        creditEligibility: creditEligibility || false,
        taxPercentage: taxPercentage || 0,
        miscFee: miscFee || null,
        platformCommission: platformCommission || 0,
        isCash: isCash || false,
        isCustom: isCustom || false,
      });

      await newLocation.save();
      res.status(201).json(newLocation);
    } catch (error) {
      logError("Error creating location", error);
      res.status(400).json({ error: error.message });
    }
  },

  // Get all locations
  getAllLocations: async (req, res) => {
    try {
      const locations = await Location.find();
        console.log(locations.length)
      if (locations.length === 0) {
       
        return res.status(404).json({ message: "No locations found" });
      }
  
      res.status(200).json(locations);
    } catch (error) {
      logError("Error retrieving locations", error);
      res.status(500).json({ message: "Error retrieving locations", error });
    }
  },
   getCustomLocations : async (req, res) => {
    try {
      const customLocations = await Location.find({ isCustom: true });
      res.status(200).json(customLocations);
    } catch (error) {
      console.error('Error fetching custom locations:', error);
      res.status(500).json({ message: 'Error fetching custom locations' });
    }
  },

  // Get locations by district
 
  getAllLocationsByDistrict: async (req, res) => {
    try {
      const { district } = req.params;
      
      // Use a regular expression with the 'i' flag for case-insensitive matching
      const locations = await Location.find({ district: new RegExp(`^${district}$`, 'i') });
  
      if (locations.length === 0) {
        return res.status(404).json({ message: "No locations found for the given district" });
      }
  
      res.status(200).json(locations);
    } catch (error) {
      logError("Error retrieving locations by district", error);
      res.status(500).json({ message: "Error retrieving locations by district", error });
    }
  },  

  // Get locations by pincode where isCustom is true
  getCustomLocationsByPincode: async (req, res) => {
    try {
      const { pincode } = req.params;
      const locations = await Location.find({ pincode, isCustom: true });

      if (locations.length === 0) {
        return res
          .status(404)
          .json({ message: "No custom locations found for this pincode" });
      }

      res.status(200).json(locations);
    } catch (error) {
      logError("Error retrieving custom locations by pincode", error);
      res
        .status(500)
        .json({ message: "Error retrieving custom locations", error });
    }
  },

  // Delete a location by ID
  deleteLocation: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedLocation = await Location.findByIdAndDelete(id);

      if (!deletedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.status(200).json({ message: "Location deleted successfully" });
    } catch (error) {
      logError("Error deleting location", error);
      res.status(500).json({ message: "Error deleting location", error });
    }
  },

  // Update a location by ID
  updateLocation: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedLocation = await Location.findByIdAndUpdate(id, updates, {
        new: true,
      });

      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.status(200).json(updatedLocation);
    } catch (error) {
      logError("Error updating location", error);
      res.status(500).json({ message: "Error updating location", error });
    }
  },

  // Delete all locations
  deleteAllLocations: async (req, res) => {
    try {
      const result = await Location.deleteMany({});
      res.status(200).json({
        message: `${result.deletedCount} locations deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting all locations", error });
    }
  },
};

export default locationController;
