import { Router } from "express";
import mysql from "mysql2";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const router = Router();
const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    database: "mt_mysql_db",
    password: "secretpassword?",
    connectionLimit: 100,
  })
  .promise();

router.get("/", async (request, response) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT * FROM users");
    const users = rows || [];
    return response.status(200).json(users);
  } catch (error) {
    console.log(error);
    return response.status(500).send(error.message);
  } finally {
    connection.release();
  }
});

router.get("/:id", async (request, response) => {
  const connection = await pool.getConnection();
  try {
    const { id } = request.params;
    if (!id) {
      return response.status(400).json({ message: "Bad Request" });
    }

    const [rows] = (await connection.query("SELECT * FROM users WHERE id = ?", [
      id,
    ])) as RowDataPacket[];

    const user = rows[0];
    if (!user) {
      return response.status(404).json({ message: "Not Found" });
    }
    response.status(200).json(user);
  } catch (error) {
    console.log(error);
    response.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.post("/", async (request, response) => {
  const connection = await pool.getConnection();
  try {
    const { name, email } = request.body;
    if (!name || !email) {
      return response.status(400).json({ message: "Bad Request" });
    }

    const [results] = (await connection.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    )) as ResultSetHeader[];

    response.status(201).json({ id: results.insertId, ...request.body });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (request, response) => {
  const connection = await pool.getConnection();
  try {
    const { name } = request.body;
    const { id } = request.params;
    if (!id || !name) {
      return response.status(400).json({ message: "Missing id or name" });
    }

    const [results] = (await connection.query(
      "UPDATE users SET name = ? WHERE id = ?",
      [name, id]
    )) as ResultSetHeader[];

    if (results.affectedRows === 0) {
      return response.status(404).json({ message: "Not Found" });
    }
    response.status(200).json({ id: request.params.id, ...request.body });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

router.delete("/:id", async (request, response) => {
  const connection = await pool.getConnection();
  try {
    const { id } = request.params;
    if (!id) {
      return response.status(400).json({ message: "Bad Request" });
    }

    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    response.status(204).send();
  } catch (error) {
    console.log(error);
    response.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  } finally {
    connection.release();
  }
});

export default router;
