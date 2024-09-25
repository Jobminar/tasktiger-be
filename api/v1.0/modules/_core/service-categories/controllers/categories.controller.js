import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Category from "../models/categories.model.js";
import Subcategory from '../models/sub.categories.model.js'
import Service from '../models/services.model.js'

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([{ name: 'image', maxCount: 1 }]);

const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `categories/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location;
};

const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const categoriesController = {
  createCategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading image" });
      }

      try {
        const { name, uiVariant } = req.body;

        if (!name || !uiVariant || !req.files.image) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        const imageKey = await uploadImageToS3(req.files.image[0]);

        const category = new Category({
          name,
          uiVariant: Array.isArray(uiVariant) ? uiVariant : [uiVariant],
          imageKey,
        });

        await category.save();
        res.status(201).json(category);
      } catch (error) {
        console.error("Error creating category:", error);
        res.status(400).json({ message: error.message });
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

  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      console.log("Deleting category with ID:", req.params.id);
      console.log("Image Key:", category.imageKey);

      if (category.imageKey) {
        await deleteImageFromS3(category.imageKey);
      }

      await Category.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateCategory: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading image", error: err.message });
      }
  
      try {
        const { id } = req.params;
        const { name, uiVariant } = req.body;
  
        const category = await Category.findById(id);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
  
        let imageKey = category.imageKey;
  
        // Check if file exists in the request
        if (req.files && req.files.image) {
          // Upload new image to S3 and update the image key
          imageKey = await uploadImageToS3(req.files.image[0]);
          // Delete old image from S3
          if (category.imageKey) {
            await deleteImageFromS3(category.imageKey);
          }
        }
  
        // Create an update object containing only the fields that need updating
        const updateData = {};
        if (name) updateData.name = name;
        if (uiVariant) updateData.uiVariant = Array.isArray(uiVariant) ? uiVariant : [uiVariant];
        if (req.files && req.files.image) updateData.imageKey = imageKey;
  
        updateData.updatedAt = Date.now();
  
        const updatedCategory = await Category.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
  
        res.status(200).json(updatedCategory);
      } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
      }
    });
  },  
  deleteCategorySubcategoryService: async (req, res) => {
    try {
      
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      // Delete image from S3 if exists
      if (category.imageKey) {
        await deleteImageFromS3(category.imageKey);
      }
  
      // Find and delete all subcategories related to this category
      const subcategories = await Subcategory.find({ categoryId: req.params.id });
  
      for (const subcategory of subcategories) {
        // Delete services associated with this subcategory
        await Service.deleteMany({ subCategoryId: subcategory._id });
  
        // Optionally delete subcategory images from S3 if you have imageKey for subcategories
        if (subcategory.imageKey) {
          await deleteImageFromS3(subcategory.imageKey);
        }
      }
  
      // Delete subcategories related to this category
      await Subcategory.deleteMany({ categoryId: req.params.id });
  
      // Finally, delete the category itself
      await Category.findByIdAndDelete(req.params.id);
  
      res.status(200).json({ message: "Category and related subcategories and services deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default categoriesController;
