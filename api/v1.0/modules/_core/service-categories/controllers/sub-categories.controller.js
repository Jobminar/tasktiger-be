import Subcategory from '../models/sub.categories.model.js';
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
  const blobName = `sub-categories/${uuidv4()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file buffer to Azure Blob
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype, // Set the content type to the file's mimetype
    },
  });

  return blockBlobClient.url; // Return the URL to the uploaded image
};

// Function to delete image from Azure Blob Storage
const deleteImageFromAzure = async (imageUrl) => {
  const blobName = imageUrl.split("/").pop(); // Extract the blob name from the URL
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists(); // Delete the image if it exists
};

// Error handling for multer
const handleMulterError = (err, res) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: "Server error during file upload" });
  }
};

const subcategoriesController = {
  createSubcategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return handleMulterError(err, res);
      }

      try {
        const { name, categoryId, variantName } = req.body;

        if (!name || !variantName || !categoryId) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        const imageKey = req.file ? await uploadImageToAzure(req.file) : null;

        const subcategory = new Subcategory({
          name,
          variantName,
          imageKey,
          categoryId,
        });

        const savedSubcategory = await subcategory.save();
        res.status(201).json(savedSubcategory);
      } catch (error) {
        console.error("Error creating subcategory:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  getSubcategories: async (req, res) => {
    try {
      const subcategories = await Subcategory.find();
      res.json(subcategories);
    } catch (error) {
      console.error("Error retrieving subcategories:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getSubcategoryById: async (req, res) => {
    try {
      const subcategory = await Subcategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error retrieving subcategory by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteSubcategory: async (req, res) => {
    try {
      const subcategory = await Subcategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      if (subcategory.imageKey) {
        await deleteImageFromAzure(subcategory.imageKey);
      }

      await Subcategory.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Subcategory deleted successfully" });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getSubcategoriesByCategoryId: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const subcategories = await Subcategory.find({ categoryId });

      if (!subcategories.length) {
        return res.status(404).json({ message: "No subcategories found for this category" });
      }

      res.json(subcategories);
    } catch (error) {
      console.error("Error retrieving subcategories by category ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateSubcategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return handleMulterError(err, res);
      }

      try {
        const { id } = req.params;
        const updates = req.body;

        const existingSubcategory = await Subcategory.findById(id);
        if (!existingSubcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }

        // Prepare data for updating
        let updatedSubcategoryData = { ...updates };

        if (req.file) {
          const newImageKey = await uploadImageToAzure(req.file);
          
          if (existingSubcategory.imageKey) {
            await deleteImageFromAzure(existingSubcategory.imageKey);
          }

          updatedSubcategoryData.imageKey = newImageKey;
        }

        const updatedSubcategory = await Subcategory.findByIdAndUpdate(id, updatedSubcategoryData, { new: true });
        res.json(updatedSubcategory);
      } catch (error) {
        console.error("Error updating subcategory:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },
};

export default subcategoriesController;
