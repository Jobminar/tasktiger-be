import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Appliance from '../appliance-model/appliance.model.js'

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

// /Function to upload a file to S3
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

const applianceController = {
  createAppliance: async (req, res) => {
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

        const imageUrl = await uploadFileToS3(req.file, "appliances/images");

        const newAppliance = new Appliance({
          name,
          price,
          image: imageUrl,
        });

        const savedAppliance = await newAppliance.save();
        res.status(201).json(savedAppliance);
      });
    } catch (error) {
      console.error("Error saving appliance:", error);
      res.status(500).json({ error: "Error saving appliance", details: error.message });
    }
  },

  getAllAppliances: async (req, res) => {
    try {
      const appliances = await Appliance.find();
      res.status(200).json(appliances);
    } catch (error) {
      console.error("Error fetching appliances:", error);
      res.status(500).json({ error: "Error fetching appliances", details: error.message });
    }
  },

  getApplianceById: async (req, res) => {
    try {
      const { id } = req.params;
      const appliance = await Appliance.findById(id);

      if (!appliance) {
        return res.status(404).json({ error: "Appliance not found" });
      }

      res.status(200).json(appliance);
    } catch (error) {
      console.error("Error fetching appliance:", error);
      res.status(500).json({ error: "Error fetching appliance", details: error.message });
    }
  },

  updateAppliance: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Error uploading file", details: err.message });
        }

        const { id } = req.params;
        const appliance = await Appliance.findById(id);

        if (!appliance) {
          return res.status(404).json({ error: "Appliance not found" });
        }

        const { name, price } = req.body;

        if (req.file) {
          const oldImageKey = appliance.image.split("/").slice(-2).join("/");
          await deleteFileFromS3(oldImageKey);

          const newImageUrl = await uploadFileToS3(req.file, "appliances/images");
          appliance.image = newImageUrl;
        }

        appliance.name = name || appliance.name;
        appliance.price = price || appliance.price;

        const updatedAppliance = await appliance.save();
        res.status(200).json(updatedAppliance);
      });
    } catch (error) {
      console.error("Error updating appliance:", error);
      res.status(500).json({ error: "Error updating appliance", details: error.message });
    }
  },

  deleteAppliance: async (req, res) => {
    try {
      const { id } = req.params;
      const appliance = await Appliance.findById(id);

      if (!appliance) {
        return res.status(404).json({ error: "Appliance not found" });
      }

      const imageKey = appliance.image.split("/").slice(-2).join("/");
      await deleteFileFromS3(imageKey);

      await Appliance.findByIdAndDelete(id);

      res.status(200).json({ message: "Appliance deleted successfully" });
    } catch (error) {
      console.error("Error deleting appliance:", error);
      res.status(500).json({ error: "Error deleting appliance", details: error.message });
    }
  },
};

export default applianceController;
