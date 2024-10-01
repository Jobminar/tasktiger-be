import { BlobServiceClient } from '@azure/storage-blob';
import Gold from "../model/gold.model.js";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();  

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

const storage = multer.memoryStorage();     
const upload = multer({ storage: storage }).single('image');

// Function to upload image to Azure Blob Storage
const uploadImageToAzure = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const blobName = `gold/${uuidv4()}${fileExtension}`; // Unique name for the blob
  
  // Ensure the container exists or create it if it doesn't
  await containerClient.createIfNotExists({
    access: 'container', // or 'blob' for private access
    metadata: { createdBy: 'tasktiger' }, // optional metadata
  });

  // Get a blockBlobClient for the file
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

  // Construct and return the correct full URL
  return `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;
};


// Function to delete image from Azure Blob Storage
const deleteImageFromAzure = async (blobName) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

// Controller object with CRUD functions
const goldController = {
  createGold: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { name, amount, points, minimumSpentValue, discount } = req.body;

        // Validate required fields
        if (!name || !amount || !points || !req.file || !minimumSpentValue || !discount) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Upload the image to Azure Blob Storage
        const imageUrl = await uploadImageToAzure(req.file);

        // Create a new gold object with the full image URL
        const gold = new Gold({
          name,
          image: imageUrl, // Store the full URL in the database
          amount,
          points: Number(points),
          minimumSpentValue,
          discount,
        });

        // Save the gold object to the database
        const savedGold = await gold.save();

        // Respond with the created gold object
        res.status(201).json(savedGold);
      } catch (error) {
        console.error("Error creating gold:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  getAllGold: async (req, res) => {
    try {
      const goldItems = await Gold.find();
      res.json(goldItems);
    } catch (error) {
      console.error("Error retrieving gold items:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getGoldById: async (req, res) => {
    try {
      const gold = await Gold.findById(req.params.id);
      if (!gold) {
        return res.status(404).json({ message: "Gold item not found" });
      }
      res.json(gold);
    } catch (error) {
      console.error("Error retrieving gold by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteGold: async (req, res) => {
    try {
      const gold = await Gold.findById(req.params.id);
      if (!gold) {
        return res.status(404).json({ message: "Gold item not found" });
      }

      // Delete the image from Azure Blob Storage
      await deleteImageFromAzure(gold.image);

      // Delete the gold item from the database
      await Gold.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Gold item deleted successfully" });
    } catch (error) {
      console.error("Error deleting gold item:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default goldController;
