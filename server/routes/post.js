import express from "express";
import auth from "../middleware/auth.js";
import { createPost, getFeed, likePost, commentPost, sharePost, getPostLimitInfo } from "../controller/postController.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/limit-info", auth, getPostLimitInfo);
router.post("/create", auth, upload.single("media"), createPost);
router.get("/feed", getFeed);
router.post("/like", auth, likePost);
router.post("/comment", auth, commentPost);
router.post("/share", auth, sharePost);

export default router;
