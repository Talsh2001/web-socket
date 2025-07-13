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
    const messages = await getAllGroupMessages();
    res.send(messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/private", async (req, res) => {
  try {
    const messages = await getAllPrivateMessages();
    res.send(messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/private/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deletePrivateMessage(id);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/group/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteGroupMessage(id);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
