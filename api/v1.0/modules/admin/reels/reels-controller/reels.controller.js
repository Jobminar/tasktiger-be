import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Reel from '../reels-model/reels.model.js'

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);

// Function to upload a file (image or video) to S3
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

const reelController = {
  createReel: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading files:", err);
          return res.status(500).json({ error: "Error uploading files", details: err.message });
        }

        const { image, video } = req.files;

        if (!image || !video) {
          return res.status(400).json({ error: "Both image and video files are required" });
        }

        const imageUrl = await uploadFileToS3(image[0], "reels/images");
        const videoUrl = await uploadFileToS3(video[0], "reels/videos");

        const newReel = new Reel({
          image: imageUrl,
          video: videoUrl,
        });

        const savedReel = await newReel.save();
        res.status(201).json(savedReel);
      });
    } catch (error) {
      console.error("Error saving reel:", error);
      res.status(500).json({ error: "Error saving reel", details: error.message });
    }
  },

  getAllReels: async (req, res) => {
    try {
      const reels = await Reel.find();
      res.status(200).json(reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
      res.status(500).json({ error: "Error fetching reels", details: error.message });
    }
  },

  getReelById: async (req, res) => {
    try {
      const { id } = req.params;
      const reel = await Reel.findById(id);

      if (!reel) {
        return res.status(404).json({ error: "Reel not found" });
      }

      res.status(200).json(reel);
    } catch (error) {
      console.error("Error fetching reel:", error);
      res.status(500).json({ error: "Error fetching reel", details: error.message });
    }
  },

  deleteReel: async (req, res) => {
    try {
      const { id } = req.params;
      const reel = await Reel.findById(id);

      if (!reel) {
        return res.status(404).json({ error: "Reel not found" });
      }

      const imageKey = reel.image.split("/").slice(-2).join("/");
      const videoKey = reel.video.split("/").slice(-2).join("/");

      await deleteFileFromS3(imageKey);
      await deleteFileFromS3(videoKey);

      await Reel.findByIdAndDelete(id);

      res.status(200).json({ message: "Reel deleted successfully" });
    } catch (error) {
      console.error("Error deleting reel:", error);
      res.status(500).json({ error: "Error deleting reel", details: error.message });
    }
  },

  updateReel: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading files:", err);
          return res.status(500).json({ error: "Error uploading files", details: err.message });
        }

        const { id } = req.params;
        const reel = await Reel.findById(id);

        if (!reel) {
          return res.status(404).json({ error: "Reel not found" });
        }

        if (req.files.image) {
          const oldImageKey = reel.image.split("/").slice(-2).join("/");
          await deleteFileFromS3(oldImageKey);

          const newImageUrl = await uploadFileToS3(req.files.image[0], "reels/images");
          reel.image = newImageUrl;
        }

        if (req.files.video) {
          const oldVideoKey = reel.video.split("/").slice(-2).join("/");
          await deleteFileFromS3(oldVideoKey);

          const newVideoUrl = await uploadFileToS3(req.files.video[0], "reels/videos");
          reel.video = newVideoUrl;
        }

        const updatedReel = await reel.save();
        res.status(200).json(updatedReel);
      });
    } catch (error) {
      console.error("Error updating reel:", error);
      res.status(500).json({ error: "Error updating reel", details: error.message });
    }
  },
};

export default reelController;



// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import dotenv from "dotenv";
// import multer from "multer";
// import AWS from "aws-sdk";
// import Reel from "../model/reels.model.js";

// dotenv.config();

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage }).fields([
//   { name: "image", maxCount: 1 },
//   { name: "video", maxCount: 1 },
// ]);

// // Function to upload a file to S3
// const uploadFileToS3 = async (file, folder) => {
//   const fileExtension = path.extname(file.originalname);
//   const fileKey = `${folder}/${uuidv4()}${fileExtension}`;

//   const s3Params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileKey,
//     Body: file.buffer,
//     ACL: "public-read",
//     ContentType: file.mimetype,
//   };

//   const uploadResult = await s3.upload(s3Params).promise();
//   return uploadResult.Location; // Return the S3 object URL
// };

// // Function to delete a file from S3
// const deleteFileFromS3 = async (fileKey) => {
//   const s3Params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileKey,
//   };

//   await s3.deleteObject(s3Params).promise();
// };

// const reelsController = {
//   createReel: async (req, res) => {
//     try {
//       upload(req, res, async (err) => {
//         if (err) {
//           console.error("Error uploading files:", err);
//           return res.status(500).json({ error: "Error uploading files", details: err.message });
//         }

//         if (!req.files.image || !req.files.video) {
//           return res.status(400).json({ error: "Both image and video are required" });
//         }

//         const image = await uploadFileToS3(req.files.image[0], "reels/images");
//         const video = await uploadFileToS3(req.files.video[0], "reels/videos");

//         const newReel = new Reel({
//           image,
//           video,
//         });

//         const savedReel = await newReel.save();
//         res.status(201).json(savedReel);
//       });
//     } catch (error) {
//       console.error("Error saving reel:", error);
//       res.status(500).json({ error: "Error saving reel", details: error.message });
//     }
//   },

//   getAllReels: async (req, res) => {
//     try {
//       const reels = await Reel.find();
//       res.status(200).json(reels);
//     } catch (error) {
//       console.error("Error fetching reels:", error);
//       res.status(500).json({ error: "Error fetching reels", details: error.message });
//     }
//   },

//   getReelById: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const reel = await Reel.findById(id);

//       if (!reel) {
//         return res.status(404).json({ error: "Reel not found" });
//       }

//       res.status(200).json(reel);
//     } catch (error) {
//       console.error("Error fetching reel:", error);
//       res.status(500).json({ error: "Error fetching reel", details: error.message });
//     }
//   },

//   deleteReel: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const reel = await Reel.findById(id);

//       if (!reel) {
//         return res.status(404).json({ error: "Reel not found" });
//       }

//       const imageKey = reel.image.split("/").slice(-2).join("/");
//       const videoKey = reel.video.split("/").slice(-2).join("/");

//       await deleteFileFromS3(imageKey);
//       await deleteFileFromS3(videoKey);

//       await Reel.findByIdAndDelete(id);

//       res.status(200).json({ message: "Reel deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting reel:", error);
//       res.status(500).json({ error: "Error deleting reel", details: error.message });
//     }
//   },

//   updateReel: async (req, res) => {
//     try {
//       upload(req, res, async (err) => {
//         if (err) {
//           console.error("Error uploading files:", err);
//           return res.status(500).json({ error: "Error uploading files", details: err.message });
//         }

//         const { id } = req.params;
//         const reel = await Reel.findById(id);

//         if (!reel) {
//           return res.status(404).json({ error: "Reel not found" });
//         }

//         if (req.files.image) {
//           const oldImageKey = reel.image.split("/").slice(-2).join("/");
//           await deleteFileFromS3(oldImageKey);

//           const newImage = await uploadFileToS3(req.files.image[0], "reels/images");
//           reel.image = newImage;
//         }

//         if (req.files.video) {
//           const oldVideoKey = reel.video.split("/").slice(-2).join("/");
//           await deleteFileFromS3(oldVideoKey);

//           const newVideo = await uploadFileToS3(req.files.video[0], "reels/videos");
//           reel.video = newVideo;
//         }

//         const updatedReel = await reel.save();
//         res.status(200).json(updatedReel);
//       });
//     } catch (error) {
//       console.error("Error updating reel:", error);
//       res.status(500).json({ error: "Error updating reel", details: error.message });
//     }
//   },
// };

// export default reelsController;
