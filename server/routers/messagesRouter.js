import {
  getAllGroupMessages,
  getAllPrivateMessages,
  deletePrivateMessage,
  deleteGroupMessage,
} from "../BLL/messagesBLL.js";
import express from "express";

const router = express.Router();

router.get("/group", async (req, res) => {
  try {
    const currentUser = res.locals.token; // Get authenticated user from middleware
    const messages = await getAllGroupMessages(currentUser);
    res.send(messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/private", async (req, res) => {
  try {
    const currentUser = res.locals.token; // Get authenticated user from middleware
    const messages = await getAllPrivateMessages(currentUser);
    res.send(messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/private/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = res.locals.token; // Get authenticated user from middleware
    const result = await deletePrivateMessage(id, currentUser);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/group/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = res.locals.token; // Get authenticated user from middleware
    const result = await deleteGroupMessage(id, currentUser);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
