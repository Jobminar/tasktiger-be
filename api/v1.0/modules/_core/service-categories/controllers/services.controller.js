import Service from "../models/services.model.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `services/${uuidv4()}${fileExtension}`;

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

        const image = await uploadImageToS3(req.file);

        const {
          name,
          description,
          categoryId,
          subCategoryId,
          variantName,
          isMostBooked,
        } = req.body;

        const newService = new Service({
          image,
          name,
          description,
          categoryId,
          subCategoryId,
          variantName,
          isMostBooked:isMostBooked || false
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
            const imageKey = service.image.split('/').pop();
            await deleteImageFromS3(imageKey);
          }

          updateData.image = await uploadImageToS3(req.file);
        }

        updateData.updatedAt = Date.now();

        const updatedService = await Service.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!updatedService) {
          return res.status(404).json({ message: "Service not found" });
        }

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
      const service = await Service.findByIdAndDelete(id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.image) {
        const imageKey = service.image.split('/').pop();
        await deleteImageFromS3(imageKey);
      }

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
