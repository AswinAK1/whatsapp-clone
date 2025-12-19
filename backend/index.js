import express from 'express'
import dotenv from 'dotenv/config'
import cookieParser from 'cookie-parser'
import authRouter from './routes/authRoute.js'
import {connectDB} from './config/DB.js'
import messageRoute from './routes/messageRoute.js'
import userRoute from './routes/userRoute.js'
import aiChatRoute from './routes/aiChatRoute.js'
import cors from 'cors';
import User from './model/useModel.js'
import { app, server } from './socket/socket.js'

// api config
const PORT = process.env.PORT;

// DB connection
connectDB()

// Cors connection
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


// middleware
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static('uploads'));


app.get("/",(req,res)=>{
  res.send("api is working")
})


app.use('/api/auth',authRouter)
app.use('/api/messages',messageRoute)
app.use('/api/users',userRoute)
app.use('/api/aiChat',aiChatRoute)


// Creating a ai user
const createAiUser = async(req,res) =>{
  const existingBot = await User.findOne({email:"ai-boat@whatsappClone.com"});
  if(!existingBot){
    await User.create({
      fullName: "AI Bot",
      email: "ai-boat@whatsappClone.com",
      password:"123456",
      phoneNumber:"1234567890",
      about: "I am an AI chatbot!",
      profilePic: "https://img.freepik.com/free-vector/chatbot-chat-message-vectorart_78370-4104.jpg",
      isOnline: true
    })
    console.log("Ai ChatBoat created");
  }
}

createAiUser()


server.listen(PORT, () => {
  console.log(`server is running on port http://localhost:${PORT}`);
});
