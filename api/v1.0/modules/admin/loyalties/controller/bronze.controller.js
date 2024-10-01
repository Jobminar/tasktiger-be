import { BlobServiceClient } from '@azure/storage-blob';
import Bronze from "../model/bronze.model.js";
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
  const blobName = `bronze/${uuidv4()}${fileExtension}`; // Unique name for the blob

  // Ensure the container exists or create it if it doesn't
  await containerClient.createIfNotExists({
    access: 'container', // 'container' for public access, 'blob' for private access
    metadata: { createdBy: 'tasktiger' }, // optional metadata
  });

  // Get a blockBlobClient for the file
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

  // Construct and return the full URL of the uploaded blob
  return `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;
};

// Function to delete image from Azure Blob Storage
const deleteImageFromAzure = async (blobName) => { 
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};

// Controller object with CRUD functions for Bronze
const bronzeController = {
  createBronze: (req, res) => {
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

        // Create a new bronze object with the image URL
        const bronze = new Bronze({
          name,
          image: imageUrl, // Store the full image URL in the database
          amount,
          points: Number(points),
          minimumSpentValue,
          discount,
        });

        // Save the bronze object to the database
        const savedBronze = await bronze.save();

        // Respond with the created bronze object
        res.status(201).json(savedBronze);
      } catch (error) {
        console.error("Error creating bronze:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  getAllBronze: async (req, res) => {
    try {
      const bronzeItems = await Bronze.find();
      res.json(bronzeItems);
    } catch (error) {
      console.error("Error retrieving bronze items:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default bronzeController;
