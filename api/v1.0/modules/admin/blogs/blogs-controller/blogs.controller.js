import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Blogs from "../blogs-model/blogs.model.js";

dotenv.config();

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Multer storage setup for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);

// Function to upload files to S3 (handles both images and videos)
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

// Function to delete files from S3
const deleteFileFromS3 = async (fileKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };

  await s3.deleteObject(s3Params).promise();
};

// Blog controller object
const blogsController = {
  // Create a new blog post
  createBlog: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Error uploading the files" });
      }

      try {
        const { title, subject, text } = req.body;

        // Validate required fields
        if (!title || !subject || !text) {
          return res.status(400).json({ message: "Title, subject, and text are required" });
        }

        let imageUrl = null;
        let videoUrl = null;

        // Upload image if provided
        if (req.files.image) {
          imageUrl = await uploadFileToS3(req.files.image[0], 'blogs/images');
        }

        // Upload video if provided
        if (req.files.video) {
          videoUrl = await uploadFileToS3(req.files.video[0], 'blogs/videos');
        }

        // Create the blog entry
        const newBlog = new Blogs({
          title,
          subject,
          text,
          image: imageUrl,
          video: videoUrl,
        });

        // Save the blog to the database
        await newBlog.save();

        res.status(201).json({
          message: "Blog created successfully",
          blog: newBlog,
        });
      } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
  },

  // Update a blog post by ID
  updateBlog: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Error uploading the files" });
      }

      try {
        const { title, subject, text } = req.body;

        // Find the blog by ID
        const blog = await Blogs.findById(req.params.id);
        if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        // Update fields
        blog.title = title || blog.title;
        blog.subject = subject || blog.subject;
        blog.text = text || blog.text;

        // If a new image is provided, delete the old one and upload the new one
        if (req.files.image) {
          if (blog.image) {
            const imageKey = blog.image.split("/").slice(-2).join("/");
            await deleteFileFromS3(imageKey);
          }

          blog.image = await uploadFileToS3(req.files.image[0], 'blogs/images');
        }

        // If a new video is provided, delete the old one and upload the new one
        if (req.files.video) {
          if (blog.video) {
            const videoKey = blog.video.split("/").slice(-2).join("/");
            await deleteFileFromS3(videoKey);
          }

          blog.video = await uploadFileToS3(req.files.video[0], 'blogs/videos');
        }

        // Save the updated blog
        await blog.save();

        res.status(200).json({
          message: "Blog updated successfully",
          blog,
        });
      } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
  },

  getAllBlogs: async (req, res) => {
    try {
      const blogs = await Blogs.find();
      res.status(200).json(blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  deleteBlog: async (req, res) => {
    try {
      // Find the blog by ID
      const blog = await Blogs.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Delete image from S3 if exists
      if (blog.image) {
        const imageKey = blog.image.split("/").slice(-2).join("/");  // Extract the file key from the URL
        await deleteFileFromS3(imageKey);
      }

      // Delete video from S3 if exists
      if (blog.video) {
        const videoKey = blog.video.split("/").slice(-2).join("/");  // Extract the file key from the URL
        await deleteFileFromS3(videoKey);
      }

      // Remove the blog from the database
      await Blogs.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

export default blogsController;
