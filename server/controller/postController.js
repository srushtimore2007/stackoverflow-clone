import mongoose from "mongoose";
import Post from "../models/Post.js";
import user from "../models/auth.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_VIDEO_TYPES = ["video/mp4"];

function getPostingLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount <= 2) return friendCount;
  if (friendCount <= 10) return 2;
  return Infinity;
}

/* ========================= GET POSTING LIMIT INFO ========================= */
export const getPostLimitInfo = async (req, res) => {
  const userId = req.userid;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const friendCount = existingUser.friends?.length ?? 0;
    const limit = getPostingLimit(friendCount);
    resetIfNewDay(existingUser);
    await existingUser.save();
    const postsToday = existingUser.postsCreatedToday ?? 0;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - postsToday);
    return res.status(200).json({
      success: true,
      data: {
        friendCount,
        limit: limit === Infinity ? "unlimited" : limit,
        postsToday,
        remaining,
        canPost: limit > 0 && postsToday < limit,
      },
    });
  } catch (error) {
    console.error("[getPostLimitInfo]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

function resetIfNewDay(userDoc) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastPost = userDoc.lastPostDate ? new Date(userDoc.lastPostDate) : null;
  if (!lastPost) return;
  lastPost.setHours(0, 0, 0, 0);
  if (today.getTime() > lastPost.getTime()) {
    userDoc.postsCreatedToday = 0;
    userDoc.lastPostDate = null;
  }
}

/* ========================= CREATE POST ========================= */
export const createPost = async (req, res) => {
  const userId = req.userid;

  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const friendCount = existingUser.friends?.length ?? 0;
    const limit = getPostingLimit(friendCount);

    if (limit === 0) {
      return res.status(403).json({
        success: false,
        message: "Add friends to post",
      });
    }

    resetIfNewDay(existingUser);
    await existingUser.save();

    if (existingUser.postsCreatedToday >= limit) {
      return res.status(403).json({
        success: false,
        message: "Daily post limit reached",
      });
    }

    const content = req.body.content || "";
    let mediaUrl = null;
    let mediaType = null;

    // if (req.file) {
    //   const baseUrl = process.env.BASE_URL;
    //   // || "http://localhost:5000";
    //   mediaUrl = `${baseUrl}/uploads/${req.file.filename}`;
    //   const mime = req.file.mimetype;
    //   mediaType = ALLOWED_IMAGE_TYPES.includes(mime) ? "image" : "video";
    // }

    if (req.file) {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    console.error("BASE_URL not set. Cannot generate media URL.");
    return res
      .status(500)
      .json({ success: false, message: "Server misconfiguration" });
  }

  mediaUrl = `${baseUrl}/uploads/${req.file.filename}`;
  const mime = req.file.mimetype;
  mediaType = ALLOWED_IMAGE_TYPES.includes(mime) ? "image" : "video";
  }
    const newPost = await Post.create({
      userId,
      content: content.trim(),
      mediaUrl,
      mediaType,
    });

    existingUser.postsCreatedToday = (existingUser.postsCreatedToday || 0) + 1;
    existingUser.lastPostDate = new Date();
    await existingUser.save();

    const populated = await Post.findById(newPost._id).populate("userId", "name email");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("[createPost]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/* ========================= GET FEED ========================= */
export const getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .populate("comments.userId", "name");

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("[getFeed]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/* ========================= LIKE POST ========================= */
export const likePost = async (req, res) => {
  const userId = req.userid;
  const { postId } = req.body;

  try {
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const idx = post.likes.indexOf(userId);
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    return res.status(200).json({
      success: true,
      data: { likes: post.likes, liked: idx < 0 },
    });
  } catch (error) {
    console.error("[likePost]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/* ========================= COMMENT ========================= */
export const commentPost = async (req, res) => {
  const userId = req.userid;
  const { postId, text } = req.body;

  try {
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.comments.push({
      userId,
      text: text.trim(),
      createdAt: new Date(),
    });
    await post.save();

    const updated = await Post.findById(postId)
      .populate("userId", "name")
      .populate("comments.userId", "name");

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[commentPost]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/* ========================= SHARE ========================= */
export const sharePost = async (req, res) => {
  const { postId } = req.body;

  try {
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    return res.status(200).json({
      success: true,
      data: { shares: post.shares },
    });
  } catch (error) {
    console.error("[sharePost]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
