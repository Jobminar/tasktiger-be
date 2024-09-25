import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import ProviderCertificate from "../model/provider.certificate.model.js";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

// Function to upload a file to S3
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

// Controller for provider certificates
const providerCertificate = {
  // Create a new certificate
  uploadCertificate: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Error uploading file", details: err.message });
        }

        const { providerId, message, isVerified } = req.body;

        if (!req.file) {
          return res.status(400).json({ error: "Image file is required" });
        }

        const imageUrl = await uploadFileToS3(req.file, "provider-certificates");

        const newCertificate = new ProviderCertificate({
          providerId,
          message:message || "admin not verified",
          isVerified: isVerified || false,
          image: imageUrl,
        });

        const savedCertificate = await newCertificate.save();
        res.status(201).json(savedCertificate);
      });
    } catch (error) {
      console.error("Error saving certificate:", error);
      res.status(500).json({ error: "Error saving certificate", details: error.message });
    }
  },

  // Delete a certificate
  deleteCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const certificate = await ProviderCertificate.findById(id);

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // Extract the image key from the URL
      const imageKey = certificate.image.split("/").pop();

      await deleteFileFromS3(`provider-certificates/${imageKey}`);
      await ProviderCertificate.findByIdAndDelete(id);

      res.status(200).json({ message: "Certificate deleted successfully" });
    } catch (error) {
      console.error("Error deleting certificate:", error);
      res.status(500).json({ error: "Error deleting certificate", details: error.message });
    }
  },

  // Get certificates by providerId
  getCertificatesByproviderId: async (req, res) => {
    try {
      const { providerId } = req.params;
      const certificates = await ProviderCertificate.find({ providerId });

      if (certificates.length === 0) {
        return res.status(404).json({ error: "No certificates found for this provider" });
      }

      res.status(200).json(certificates);
    } catch (error) {
      console.error("Error retrieving certificates:", error);
      res.status(500).json({ error: "Error retrieving certificates", details: error.message });
    }
  },

  updateCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const { message, isVerified } = req.body;
  
      const certificate = await ProviderCertificate.findById(id);
  
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
  
      // Handle file upload first
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Error uploading file", details: err.message });
        }
  
        // If a new file is uploaded, update the image field
        if (req.file) {
          // Delete the old image from S3
          const oldImageKey = certificate.image.split("/").pop();
          await deleteFileFromS3(`provider-certificates/${oldImageKey}`);
  
          // Upload the new image to S3
          const newImageUrl = await uploadFileToS3(req.file, "provider-certificates");
          certificate.image = newImageUrl;
        }
  
        // Update other fields only if they are provided in the request body
        if (message !== undefined) {
          certificate.message = message;
        }
        if (isVerified !== undefined) {
          certificate.isVerified = isVerified;
        }
  
        // Save the updated certificate
        const updatedCertificate = await certificate.save();
        res.status(200).json(updatedCertificate);
      });
    } catch (error) {
      console.error("Error updating certificate:", error);
      res.status(500).json({ error: "Error updating certificate", details: error.message });
    }
  },
  
  getAllCertificates: async (req, res) => {
    try {
      const certificates = await ProviderCertificate.find();

      if (certificates.length === 0) {
        return res.status(404).json({ error: "No certificates found" });
      }

      res.status(200).json(certificates);
    } catch (error) {
      console.error("Error retrieving certificates:", error);
      res.status(500).json({ error: "Error retrieving certificates", details: error.message });
    }
  },
};

export default providerCertificate;
