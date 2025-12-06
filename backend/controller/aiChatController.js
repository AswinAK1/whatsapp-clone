import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../model/useModel.js";
import Conversation from "../model/conversationModel.js";
import Message from "../model/messageModel.js";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithAi = async(req, res) => {
  try {
    const { userId, message } = req.body;

    const aiUser = await User.findOne({ email: "ai-boat@whatsappClone.com" });

    if (!aiUser) {
      return res.status(404).json({ success: false, message: "AI bot not found" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: [userId, aiUser._id],
      isAiChat: true
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, aiUser._id],
        messages: [],
        isAiChat: true
      });
    }

    // Save user message
    const userMessage = await Message.create({
      senderId: userId,
      receiverId: aiUser._id,
      messages: message,
      isAiMessage: false
    });

    conversation.messages.push(userMessage._id);
    await conversation.save();

    // Get AI response from Gemini
    const model = genAI.getGenerativeModel({
      model:  "gemini-2.5-flash",
      apiVersion: "v1"
    });

    // Handle safety settings and generation config if needed
    const result = await model.generateContent(message);
    const aiReply = result.response;
    const text = aiReply.text();
    console.log("AI response text:", text);

    if (!text || text.trim() === "") {
      return res.status(500).json({ success: false, message: "AI response is empty" });
    }

    // Save AI response
    const aiMessage = await Message.create({
      senderId: aiUser._id,
      receiverId: userId,
      messages: text,
      isAiMessage: true
    });

    conversation.messages.push(aiMessage._id);
    await conversation.save();

    res.json({ aiReply: text });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI response",
      error: error.message
    });
  }
};


const getAiChat = async (req, res) =>{
  try {
    const senderId = req.user._id;

    const aiMessages = await Message.find({
      isAiMessage: true,
      receiverId: senderId,
    });

    res.status(200).json(aiMessages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export { chatWithAi , getAiChat};