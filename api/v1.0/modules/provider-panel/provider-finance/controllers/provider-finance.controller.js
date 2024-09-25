import AWS from "aws-sdk";
import Finance from "../models/provider-finance.model.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array("documents", 10);

// Function to upload document to S3
const uploadDocumentToS3 = async (file) => {
  try {
    const fileExtension = path.extname(file.originalname);
    const documentKey = `provider-finance/${uuidv4()}${fileExtension}`;

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: documentKey,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(s3Params).promise();
    return uploadResult.Key;
  } catch (error) {
    console.error("Error uploading document to S3:", error);
    throw new Error("Error uploading document to S3");
  }
};

// Function to delete document from S3
const deleteDocumentFromS3 = async (documentKey) => {
  try {
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: documentKey,
    };

    await s3.deleteObject(s3Params).promise();
  } catch (error) {
    console.error("Error deleting document from S3:", error);
    throw new Error("Error deleting document from S3");
  }
};

const financeController = {
 
  createServiceProviderFinance: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }
  
      try {
        const { providerId, pan, gst, accountName, bankName, ifscCode, branch, accountNumber,aadhaarNumber } = req.body;
  
        if (!providerId || !pan || !accountName || !bankName || !ifscCode || !accountNumber || !branch || !aadhaarNumber) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }
  
        let documentKeys = [];
        if (req.files && req.files.length > 0) {
          // Upload the documents to AWS S3
          documentKeys = await Promise.all(req.files.map(file => uploadDocumentToS3(file)));
        }
  
        // Create a new finance object with the document keys
        const serviceProviderFinance = new Finance({
          providerId,
          aadhaarNumber,
          pan,
          gst,
          accountName,
          bankName,
          ifscCode,
          branch,
          accountNumber,
          documents: documentKeys
        });
  
        // Save the finance object to the database
        const savedFinance = await serviceProviderFinance.save();
  
        // Respond with the created finance object
        res.status(201).json(savedFinance);
      } catch (error) {
        console.error("Error creating service provider finance:", error);
        res.status(500).json({ error: error.message });
      }
    });
  },
  
  updateServiceProviderFinance: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { id } = req.params;
        const updates = req.body;

        if (req.files && req.files.length > 0) {
          // Upload the new documents to AWS S3
          const newDocumentKeys = await Promise.all(req.files.map(file => uploadDocumentToS3(file)));
          updates.documents = newDocumentKeys;

          // Delete the old documents from S3
          const serviceProviderFinance = await Finance.findById(id);
          if (serviceProviderFinance && serviceProviderFinance.documents.length > 0) {
            await Promise.all(serviceProviderFinance.documents.map(key => deleteDocumentFromS3(key)));
          }
        }

        const updatedFinance = await Finance.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedFinance) {
          return res.status(404).json({ error: "Service provider finance details not found" });
        }

        res.status(200).json(updatedFinance);
      } catch (error) {
        console.error("Error updating service provider finance:", error);
        res.status(500).json({ error: error.message });
      }
    });
  },

  getAllServiceProviderFinances: async (req, res) => {
    try {
      const serviceProviderFinances = await Finance.find();
      res.status(200).json(serviceProviderFinances);
    } catch (err) {
      console.error("Error retrieving service provider finances:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getServiceProviderFinanceByProviderId: async (req, res) => {
    try {
      const { id:providerId } = req.params;
  
      if (!providerId) {
        return res.status(400).json({ message: 'Missing required field: providerId' });
      }
  
      const financeData = await Finance.findOne({ providerId });
  
      if (!financeData) {
        return res.status(404).json({ message: 'No finance data found for this user' });
      }
  
      res.status(200).json(financeData);
    } catch (error) {
      console.error('Failed to get finance data:', error);
      res.status(500).json({ message: 'Failed to get finance data', error: error.message });
    }
  },
  

  deleteServiceProviderFinance: async (req, res) => {
    try {
      const { id } = req.params;
      const serviceProviderFinance = await Finance.findByIdAndDelete(id);
      if (!serviceProviderFinance) {
        return res.status(404).json({ error: "Service provider finance details not found" });
      }

      // Delete the documents from S3
      if (serviceProviderFinance.documents && serviceProviderFinance.documents.length > 0) {
        await Promise.all(serviceProviderFinance.documents.map(key => deleteDocumentFromS3(key)));
      }

      res.status(200).json({ message: "Service provider finance details deleted successfully" });
    } catch (err) {
      console.error("Error deleting service provider finance:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default financeController;
