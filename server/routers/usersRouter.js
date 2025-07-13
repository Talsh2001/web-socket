import express from "express";
import jwt from "jsonwebtoken";
import {
  findUser,
  getAllUsers,
  findUser_id,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
} from "../BLL/userBLL.js";

const router = express.Router();

const JWT_SECRET = "socket";

router.get("/", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/id/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const id = await findUser_id(username);
    res.send(id);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const obj = req.body;
    const result = await addUser(obj);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const obj = req.body;
    const result = await updateUser(id, obj);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findUser({ username, password });
    if (!user) {
      return res.status(403).send({ message: "Wrong Credentials..." });
    }
    const accessToken = jwt.sign({ username }, JWT_SECRET);
    res.send({ accessToken, username });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
