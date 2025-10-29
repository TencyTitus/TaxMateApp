const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authenticateToken = require("../middleware/auth");

// GET all notifications for authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    const filter = { userId: req.user.id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET unread notification count
router.get("/unread/count", authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id,
      isRead: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create new notification
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, message, type, priority, actionUrl, expiresAt } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }
    
    const notification = new Notification({
      userId: req.user.id,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      actionUrl,
      expiresAt
    });
    
    await notification.save();
    
    res.status(201).json({ 
      message: "Notification created successfully",
      notification 
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT mark notification as read
router.put("/:notificationId/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.notificationId,
        userId: req.user.id 
      },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ 
      message: "Notification marked as read",
      notification 
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT mark all notifications as read
router.put("/read/all", authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE notification
router.delete("/:notificationId", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE all read notifications
router.delete("/read/all", authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user.id,
      isRead: true
    });
    
    res.json({ message: "All read notifications deleted" });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
