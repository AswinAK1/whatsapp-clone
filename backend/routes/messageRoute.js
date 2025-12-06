import express from 'express';
import {sendMessage, getMessage, deleteMessage, deleteSelectedMessages} from '../controller/messageController.js'
import protectRoute from '../middleware/protectRoute.js';


const router = express.Router();

router.post("/send/:id",protectRoute, sendMessage)
router.get("/:userId",protectRoute, getMessage)
router.delete('/delete-message/:id',protectRoute, deleteMessage)
router.post('/delete-selected',protectRoute, deleteSelectedMessages)



export default router
