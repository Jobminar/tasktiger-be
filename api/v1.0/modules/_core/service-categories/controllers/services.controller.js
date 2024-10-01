import Service from "../models/services.model.js";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

// Function to upload image to Azure Blob Storage
const uploadImageToAzure = async (file) => {
  const blobName = `services/${uuidv4()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
    },
  });

  return blockBlobClient.url; // Return the URL to the uploaded image
};

// Function to delete image from Azure Blob Storage
const deleteImageFromAzure = async (imageUrl) => {
  const blobName = imageUrl.split("/").pop();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
};

// Service Controller
const serviceController = {
  createService: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        return res.status(500).json({ error: "Error uploading image", details: err.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const image = await uploadImageToAzure(req.file);

        const { name, description, categoryId, subCategoryId, variantName, isMostBooked } = req.body;

        const newService = new Service({
          image,
          name,
          description,
          categoryId,
          subCategoryId,
          variantName,
          isMostBooked: isMostBooked || false,
        });

        const service = await newService.save();
        res.status(201).json(service);
      } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  updateService: async (req, res) => {
    const { id } = req.params;

    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        return res.status(400).json({ error: "Error uploading image", details: err.message });
      }

      try {
        const service = await Service.findById(id);
        if (!service) {
          return res.status(404).json({ message: "Service not found" });
        }

        const updateData = { ...req.body };

        if (req.file) {
          if (service.image) {
            await deleteImageFromAzure(service.image); // Use service.image to delete
          }
          updateData.image = await uploadImageToAzure(req.file); // Use Azure upload function
        }

        const updatedService = await Service.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        res.status(200).json(updatedService);
      } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  deleteService: async (req, res) => {
    const { id } = req.params;

    try {
      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      await deleteImageFromAzure(service.image); // Delete associated image

      await Service.findByIdAndDelete(id);
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getServicesByCategoryAndSubcategory: async (req, res) => {
    const { categoryId, subCategoryId } = req.params;

    try {
      const query = {};
      if (categoryId) query.categoryId = categoryId;
      if (subCategoryId) query.subCategoryId = subCategoryId;

      const services = await Service.find(query).populate("categoryId subCategoryId");

      if (!services.length) {
        return res.status(404).json({ message: "No services found for the provided category and subcategory" });
      }

      res.json(services);
    } catch (error) {
      console.error("Error retrieving services:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getServices: async (req, res) => {
    try {
      const services = await Service.find();
      res.json(services);
    } catch (error) {
      console.error("Error retrieving services:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getServiceById: async (req, res) => {
    const { id } = req.params;

    try {
      const service = await Service.findById(id).populate("categoryId subCategoryId");

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      console.error("Error retrieving service by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

export default serviceController;
