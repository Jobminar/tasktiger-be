import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

// Function to upload image to S3

// Function to upload image to Azure Blob Storage
const uploadImageToAzure = async (file, folderName) => {
  await containerClient.createIfNotExists({
    access: 'container',
    metadata: { createdBy: 'tasktiger' },
  });

  const fileExtension = path.extname(file.originalname);
  const blobName = `${folderName}/${uuidv4()}${fileExtension}`; // Use folderName parameter
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url; // Return the URL of the uploaded blob
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  try {
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageKey,
    };

    await s3.deleteObject(s3Params).promise();
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw new Error("Error deleting image from S3");
  }
};

export { upload, uploadImageToS3, deleteImageFromS3 };
