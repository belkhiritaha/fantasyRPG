import mongoose from "mongoose";
import express from "express";

import messageModels from "../models/message.models";
import { io } from "../api";

const messageRouter = express.Router();

// GET /messages - get all messages
messageRouter.get("/", async (req, res) => {
    const messages = await messageModels.find({}, { sender: 1, content: 1, _id: 0 });
    res.json(messages);
});

// POST /messages - create a new message
messageRouter.post("/", async (req, res) => {
    const message = new messageModels(req.body);
    await message.save();
    res.json(message);
    io.emit('new_message', message);
});

export default messageRouter;