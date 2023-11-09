import { Router } from "express";
import mysql from "mysql2";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const router = Router();

const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    database: "mt_mysql_db",
    password: "secretpassword",
    connectionLimit: 100,
  })
  .promise();

router.get("/", async (_req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT * FROM users");
    const users = rows || [];
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.get("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Bad Request" });
    }

    const [rows] = (await connection.query("SELECT * FROM users WHERE id = ?", [
      id,
    ])) as RowDataPacket[];

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "Not Found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.post("/", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Bad Request" });
    }

    const [results] = (await connection.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    )) as ResultSetHeader[];

    res.status(201).json({ id: results.insertId, ...req.body });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email } = req.body;
    const { id } = req.params;
    if (!id || !email) {
      return res.status(400).json({ message: "Bad Request" });
    }

    const [results] = (await connection.query(
      "UPDATE users SET email = ? WHERE id = ?",
      [email, id]
    )) as ResultSetHeader[];

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Not Found" });
    }
    res.status(200).json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.delete("/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Bad Request" });
    }

    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

export default router;
