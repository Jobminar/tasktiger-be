import { BlobServiceClient } from "@azure/storage-blob";
import Silver from '../model/silver.model.js'
import multer from "multer";
import path from "path";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Controller methods

export const createSilver = async (req, res) => {
  try {
      const { name, amount, points, minimumSpentValue, discount } = req.body;
      const image = req.file; // Assuming image is uploaded as file

      // Upload image to Azure Blob Storage
      const blobName = `silver/${Date.now()}_${image.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(image.buffer, image.size);

      // Generate public URL for the image
      const imageUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;

      const silverItem = new Silver({
          name,
          image: imageUrl, // Store the image URL
          amount,
          points,
          minimumSpentValue,
          discount,
      });

      await silverItem.save();
      res.status(201).json(silverItem);  
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

export const getSilver = async (req, res) => {
    try {
        const silverItems = await Silver.find();
        res.status(200).json(silverItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSilver = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (req.file) {
            const image = req.file;
            const blobName = `${Date.now()}_${image.originalname}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(image.buffer, image.size);
            updates.image = blobName; // Update image only if a new one is uploaded
        }

        const updatedSilver = await Silver.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json(updatedSilver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSilver = async (req, res) => {
    try {
        const { id } = req.params;
        await Silver.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Middleware for file upload
export const uploadImage = upload.single("image"); // Use this middleware in routes

