import express from 'express'
import blogsController from '../blogs-controller/blogs.controller.js'

const router=express.Router()

router.post("/",blogsController.createBlog)

router.get("/",blogsController.getAllBlogs)

router.delete("/:id",blogsController.deleteBlog)

router.patch("/:id",blogsController.updateBlog)

export default router  