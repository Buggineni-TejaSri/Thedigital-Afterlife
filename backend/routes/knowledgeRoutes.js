const express = require("express");
const mongoose = require("mongoose");
const Knowledge = require("../models/Knowledge");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// PUBLIC: Anyone can view all stories
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }

    const stories = await Knowledge.find(filter)
      .populate("createdBy", "name")
      .populate("likes", "name")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUBLIC: View one story
router.get("/:id", async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("likes", "name")
      .populate("comments.user", "name");

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Publish a new story
router.post("/", protect, async (req, res) => {
  try {
    const { title, category, content } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        message: "Please fill in all required fields"
      });
    }

    const story = await Knowledge.create({
      title,
      category,
      content,
      author: req.user.name,
      createdBy: req.user._id
    });

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Like a story
router.post("/:id/like", protect, async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    const alreadyLiked = story.likes.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!alreadyLiked) {
      story.likes.push(req.user._id);
      await story.save();
    }

    res.json({
      message: "Story liked successfully",
      likes: story.likes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Unlike a story
router.delete("/:id/like", protect, async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    story.likes = story.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await story.save();

    res.json({
      message: "Story unliked successfully",
      likes: story.likes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Add a comment
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Please enter a comment"
      });
    }

    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    story.comments.push({
      user: req.user._id,
      userName: req.user.name,
      text: text.trim()
    });

    await story.save();

    res.status(201).json({
      message: "Comment added successfully",
      comments: story.comments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Delete your own comment
router.delete("/:id/comments/:commentId", protect, async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    const comment = story.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found"
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own comments"
      });
    }

    comment.deleteOne();
    await story.save();

    res.json({
      message: "Comment deleted successfully",
      comments: story.comments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Edit your own story
router.put("/:id", protect, async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    if (
      !story.createdBy ||
      story.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only edit your own stories"
      });
    }

    const { title, category, content } = req.body;

    story.title = title || story.title;
    story.category = category || story.category;
    story.content = content || story.content;

    await story.save();

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PRIVATE: Delete your own story
router.delete("/:id", protect, async (req, res) => {
  try {
    const story = await Knowledge.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    if (
      !story.createdBy ||
      story.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only delete your own stories"
      });
    }

    await story.deleteOne();

    res.json({
      message: "Story deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;