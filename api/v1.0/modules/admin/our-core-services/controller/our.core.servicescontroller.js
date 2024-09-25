import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import OurCore from "../model/our.core.services.model.js";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `our-core-services/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location; // Return the S3 object URL
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const ourCoreServicesController = {
  createOurCoreService: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading image:", err);
          return res.status(500).json({ error: "Error uploading image", details: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { serviceName, description,price } = req.body;

        if(!serviceName || !description || !price) {
          return res.status(400).json({message:"Required fields is missing !!"})
        }
        const image = await uploadImageToS3(req.file);

        const newService = new OurCore({
          image,
          video,
          serviceName,
          description,
          price
        });

        const savedService = await newService.save();
        res.status(201).json(savedService);
      });
    } catch (error) {
      console.error("Error saving service:", error);
      res.status(500).json({ error: "Error saving service", details: error.message });
    }
  },

  getAllOurCoreServices: async (req, res) => {
    try {
      const services = await OurCore.find();
      res.status(200).json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Error fetching services", details: error.message });
    }
  },

  getOurCoreServiceById: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await OurCore.findById(id);

      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      } 

      res.status(200).json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ error: "Error fetching service", details: error.message });
    }
  },

  deleteOurCoreService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await OurCore.findById(id);

      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      const imageKey = service.image.split("/").slice(-2).join("/"); // Extract the key from the URL
      await deleteImageFromS3(imageKey);

      await OurCore.findByIdAndDelete(id);

      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Error deleting service", details: error.message });
    }
  },

  updateOurCoreService: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading image:", err);
          return res.status(500).json({ error: "Error uploading image", details: err.message });
        }

        const { id } = req.params;
        const { serviceName, description } = req.body;

        const service = await OurCore.findById(id);

        if (!service) {
          return res.status(404).json({ error: "Service not found" });
        }

        if (req.file) {
          // Delete the old image from S3
          const oldImageKey = service.image.split("/").slice(-2).join("/"); // Extract the key from the URL
          await deleteImageFromS3(oldImageKey);

          // Upload the new image to S3
          const newImage = await uploadImageToS3(req.file);
          service.image = newImage;
        }

        service.serviceName = serviceName;
        service.description = description;

        const updatedService = await service.save();
        res.status(200).json(updatedService);
      });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Error updating service", details: error.message });
    }
  }
};

export default ourCoreServicesController;
