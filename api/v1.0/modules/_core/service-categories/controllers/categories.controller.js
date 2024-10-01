import Category from "../models/categories.model.js";
import Subcategory from '../models/sub.categories.model.js';
import Service from '../models/services.model.js';
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Ensure the container exists (optional)
await containerClient.createIfNotExists();

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

// Function to upload image to Azure Blob Storage
const uploadImageToAzure = async (file, folder = 'categories') => {
  const blobName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`; // Include folder in blob name
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

const categoriesController = {
  createCategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        return handleMulterError(err, res); // Use the error handler
      }

      try {
        const { name, uiVariant } = req.body;

        if (!name || !uiVariant || !req.file) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        const imageUrl = await uploadImageToAzure(req.file); // Using the folder structure

        const category = new Category({
          name,
          uiVariant: Array.isArray(uiVariant) ? uiVariant : [uiVariant],
          imageKey: imageUrl,
        });

        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
      } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  getCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error retrieving categories:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json(category);
    } catch (error) {
      console.error("Error retrieving category by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateCategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        return handleMulterError(err, res); // Use the error handler
      }

      try {
        const { id } = req.params;
        const { name, uiVariant } = req.body;

        const category = await Category.findById(id);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }

        let imageKey = category.imageKey;

        if (req.file) {
          imageKey = await uploadImageToAzure(req.file);
          if (category.imageKey) {
            await deleteImageFromAzure(category.imageKey);
          }
        }

        const updateData = {
          ...(name && { name }),
          ...(uiVariant && { uiVariant: Array.isArray(uiVariant) ? uiVariant : [uiVariant] }),
          ...(req.file && { imageKey }),
        };

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        res.status(200).json(updatedCategory);
      } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  deleteCategorySubcategoryService: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      if (category.imageKey) {
        await deleteImageFromAzure(category.imageKey);
      }

      const subcategories = await Subcategory.find({ categoryId: req.params.id });
      for (const subcategory of subcategories) {
        await Service.deleteMany({ subCategoryId: subcategory._id });
        if (subcategory.imageKey) {
          await deleteImageFromAzure(subcategory.imageKey);
        }
      }

      await Subcategory.deleteMany({ categoryId: req.params.id });
      await Category.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Category and related subcategories and services deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default categoriesController;
