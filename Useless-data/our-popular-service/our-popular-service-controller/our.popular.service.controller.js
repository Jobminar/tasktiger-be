import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import OurPopularService from '../our-popular-service-model/our.popular.service.model.js'

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

/// Function to upload a file to S3
const uploadFileToS3 = async (file, folder) => {
  const fileExtension = path.extname(file.originalname);
  const fileKey = `${folder}/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location; // Return the S3 object URL
};

// Function to delete a file from S3
const deleteFileFromS3 = async (fileKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const popularServiceController = {
  createPopularService: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Error uploading file", details: err.message });
        }

        const { name, price } = req.body;

        if (!req.file) {
          return res.status(400).json({ error: "Image file is required" });
        }

        const imageUrl = await uploadFileToS3(req.file, "popular-services");

        const newPopularService = new OurPopularService({
          name,
          price,
          image: imageUrl,
        });

        const savedPopularService = await newPopularService.save();
        res.status(201).json(savedPopularService);
      });
    } catch (error) {
      console.error("Error saving popular service:", error);
      res.status(500).json({ error: "Error saving popular service", details: error.message });
    }
  },

  getAllPopularServices: async (req, res) => {
    try {
      const popularServices = await OurPopularService.find();

      if(popularServices.length===0){
        return res.status(401).json({message:"No data in this popular services"})
      }
      res.status(200).json(popularServices);
    } catch (error) {
      console.error("Error fetching popular services:", error);
      res.status(500).json({ error: "Error fetching popular services", details: error.message });
    }
  },

  getPopularServiceById: async (req, res) => {
    try {
      const { id } = req.params;
      const popularService = await OurPopularService.findById(id);

      if (!popularService) {
        return res.status(404).json({ error: "Popular service not found" });
      }

      res.status(200).json(popularService);
    } catch (error) {
      console.error("Error fetching popular service:", error);
      res.status(500).json({ error: "Error fetching popular service", details: error.message });
    }
  },

  updatePopularService: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Error uploading file", details: err.message });
        }

        const { id } = req.params;
        const popularService = await OurPopularService.findById(id);

        if (!popularService) {
          return res.status(404).json({ error: "Popular service not found" });
        }

        const { name, price } = req.body;

        if (req.file) {
          const oldImageKey = popularService.image.split("/").slice(-2).join("/");
          await deleteFileFromS3(oldImageKey);

          const newImageUrl = await uploadFileToS3(req.file, "popular-services/images");
          popularService.image = newImageUrl;
        }

        popularService.name = name || popularService.name;
        popularService.price = price || popularService.price;

        const updatedPopularService = await popularService.save();
        res.status(200).json(updatedPopularService);
      });
    } catch (error) {
      console.error("Error updating popular service:", error);
      res.status(500).json({ error: "Error updating popular service", details: error.message });
    }
  },

  deletePopularService: async (req, res) => {
    try {
      const { id } = req.params;
      const popularService = await OurPopularService.findById(id);

      if (!popularService) {
        return res.status(404).json({ error: "Popular service not found" });
      }

      const imageKey = popularService.image.split("/").slice(-2).join("/");
      await deleteFileFromS3(imageKey);

      await OurPopularService.findByIdAndDelete(id);

      res.status(200).json({ message: "Popular service deleted successfully" });
    } catch (error) {
      console.error("Error deleting popular service:", error);
      res.status(500).json({ error: "Error deleting popular service", details: error.message });
    }
  },
};

export default popularServiceController;
