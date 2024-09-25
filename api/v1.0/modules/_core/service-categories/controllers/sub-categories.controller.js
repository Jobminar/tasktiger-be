import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Subcategory from '../models/sub.categories.model.js';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([{ name: 'image', maxCount: 1 }]);

const uploadImageToS3 = async (file) => {
  try {
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
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw new Error("Error uploading image to S3");
  }
};

const deleteImageFromS3 = async (imageKey) => {
  try {
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageKey,
    };

    await s3.deleteObject(s3Params).promise();
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw new Error("Error deleting image from S3");
  }
};

const subcategoriesController = {
  createSubcategory: (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading image" });
      }

      try {
        const { name, categoryId,variantName } = req.body;

        if (!name || !variantName || !categoryId ) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        const imageKey = req.files && req.files.image ? await uploadImageToS3(req.files.image[0]) : null;

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
        await deleteImageFromS3(subcategory.imageKey);
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
  
  updateSubcategory: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { id } = req.params;
        const updates = req.body;

        const existingSubcategory = await Subcategory.findById(id);
        if (!existingSubcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }

        let updatedSubcategoryData = updates;

        if (req.files && req.files.image) {
          const newImageKey = await uploadImageToS3(req.files.image[0]);

          if (existingSubcategory.imageKey) {
            await deleteImageFromS3(existingSubcategory.imageKey);
          }

          updatedSubcategoryData = { ...updates, imageKey: newImageKey };
        }

        const updatedSubcategory = await Subcategory.findByIdAndUpdate(
          id,
          updatedSubcategoryData,
          { new: true }
        );

        res.json(updatedSubcategory);
      } catch (error) {
        console.error("Error updating subcategory:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },
};

export default subcategoriesController;
