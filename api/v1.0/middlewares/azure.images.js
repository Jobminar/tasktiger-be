import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config(); // Load environment variables from .env file

if (!process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error('Azure Storage connection string or container name not defined in environment variables.');
}

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME); // Changed this line

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

// Function to upload image to Azure Blob Storage


const uploadImageToAzure = async (file, folderName) => {
  await containerClient.createIfNotExists({
    access: 'container',
    metadata: { createdBy: 'tasktiger' },
  });

  const fileExtension = path.extname(file.originalname);
  const blobName = `${folderName}/${uuidv4()}${fileExtension}`; 
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url; // Return the URL of the uploaded blob
};

const deleteImageFromAzure = async (blobName) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};
// Exporting the upload middleware and upload function
export { upload, uploadImageToAzure, deleteImageFromAzure };