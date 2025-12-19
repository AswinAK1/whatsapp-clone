import Conversation from "../model/conversationModel.js";
import Message from "../model/messageModel.js";
import mongoose from "mongoose";
import User from "../model/useModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";



const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      messages: message,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    // REAL-TIME PART: emit message to receiver (and optionally sender)
    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    const senderSocketId = getReceiverSocketId(senderId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // if you want to also update sender's UI in real time (multi-tab, etc.)
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({ success: true, messages: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const getMessage = async (req, res) => {
  try {
    const { userId: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate({
      path: "messages",
      options: { sort: { createdAt: 1 } },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    return res.status(200).json(conversation.messages);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const messageObjectId = new mongoose.Types.ObjectId(messageId);

    const message = await Message.findById(messageObjectId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }


    const conversation = await Conversation.findOne({
      participants: { $all: [message.senderId, message.receiverId] },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    console.log("Before Deletion:", conversation);


    const updateResult = await Conversation.updateOne(
      { _id: conversation._id },
      { $pull: { messages: messageObjectId } }
    );

    console.log("Update Result:", updateResult);

    const updatedConversation = await Conversation.findById(conversation._id);
    console.log("After Deletion:", updatedConversation);

    await Message.findByIdAndDelete(messageObjectId);

    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const deleteSelectedMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "messageIds array is required and cannot be empty",
      });
    }

    // Convert to ObjectId
    const objectIds = messageIds.map((id) => new mongoose.Types.ObjectId(id));

    // Find only messages that belong to this user (sender or receiver)
    const messagesToDelete = await Message.find({
      _id: { $in: objectIds },
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    if (messagesToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No deletable messages found for this user",
      });
    }

    const allowedIds = messagesToDelete.map((m) => m._id);

    // 1) Remove message ids from any conversations containing them
    await Conversation.updateMany(
      { messages: { $in: allowedIds } },
      { $pull: { messages: { $in: allowedIds } } }
    );

    // 2) Delete the messages themselves
    const deleteResult = await Message.deleteMany({
      _id: { $in: allowedIds },
    });

    return res.status(200).json({
      success: true,
      message: "Selected messages deleted successfully",
      deletedCount: deleteResult.deletedCount,
      deletedIds: allowedIds,
    });
  } catch (error) {
    console.error("Error deleting selected messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};





export {sendMessage,getMessage, deleteMessage, deleteSelectedMessages}