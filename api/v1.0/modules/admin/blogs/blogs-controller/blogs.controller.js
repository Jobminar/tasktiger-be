import Blogs from "../blogs-model/blogs.model.js";
import {  uploadImageToAzure, deleteImageFromAzure } from '../../../../middlewares/azure.images.js';
import { uploadVideoToAzure, deleteVideoFromAzure } from '../../../../middlewares/azure.video.js';
import multer from "multer";

// Set up multer for handling video uploads only, since image upload is handled separately
const upload = multer({storage: multer.memoryStorage()})
.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

const blogsController = {
  // Create a new blog post
  createBlog: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Error uploading files", details: err.message });
      }

      try {
        const { title, subject, text } = req.body;
        let imageUrl = null;
        let videoUrl = null;

        // If an image is provided, upload it to Azure
        if (req.files && req.files.image) {
          imageUrl = await uploadImageToAzure(req.files.image[0], 'blogs/images');
        }

        // If a video is provided, upload it to Azure
        if (req.files && req.files.video) {
          videoUrl = await uploadVideoToAzure(req.files.video[0], 'blogs/videos');
        }

        // Create new blog post
        const newBlog = new Blogs({
          title,
          subject,
          text,
          image: imageUrl,
          video: videoUrl,
        });

        // Save the blog post
        await newBlog.save();

        res.status(201).json({
          message: 'Blog created successfully',
          blog: newBlog,
        });

      } catch (error) {
        res.status(500).json({ error: 'Error creating blog', details: error.message });
      }
    });
  },
  // Update a blog post by ID
  updateBlog: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(500).json({ error: "Error uploading image", details: err.message });

      uploadVideo(req, res, async (err) => {
        if (err) return res.status(500).json({ error: "Error uploading video", details: err.message });

        try {
          const { title, subject, text } = req.body;

          const blog = await Blogs.findById(req.params.id);
          if (!blog) return res.status(404).json({ message: "Blog not found" });

          // Update fields
          blog.title = title || blog.title;
          blog.subject = subject || blog.subject;
          blog.text = text || blog.text;

          // Handle image update
          if (req.files?.image?.length > 0) {
            if (blog.image) {
              const imageKey = blog.image.split("/").pop();
              await deleteImageFromAzure(imageKey);
            }
            blog.image = await uploadImageToAzure(req.files.image[0], 'blogs/images');
          }

          // Handle video update
          if (req.files?.video?.length > 0) {
            if (blog.video) {
              const videoKey = blog.video.split("/").pop();
              await deleteVideoFromAzure(videoKey);
            }
            blog.video = await uploadVideoToAzure(req.files.video[0], 'blogs/videos');
          }

          await blog.save();
          res.status(200).json({ message: "Blog updated successfully", blog });
        } catch (error) {
          res.status(500).json({ message: "Error updating blog", details: error.message });
        }
      });
    });
  },

  // Get all blog posts
  getAllBlogs: async (req, res) => {
    try {
      const blogs = await Blogs.find();
      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching blogs", details: error.message });
    }
  },

  // Delete a blog post by ID
  deleteBlog: async (req, res) => {
    try {
      const blog = await Blogs.findById(req.params.id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      if (blog.image) {
        const imageKey = blog.image.split("/").pop();
        await deleteImageFromAzure(imageKey);
      }

      if (blog.video) {
        const videoKey = blog.video.split("/").pop();
        await deleteVideoFromAzure(videoKey);
      }

      await Blogs.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting blog", details: error.message });
    }
  },
};

export default blogsController;
