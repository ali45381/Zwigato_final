import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
const port = process.env.PORT || 5000;

let cart = [];

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test route
app.get("/test", (req, res) => {
  res.send("Zwigato backend is running");
});

// Get all foods
app.get("/api/foods", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM public.ali ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Food fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch foods" });
  }
});

// Add food
app.post("/api/foods", async (req, res) => {
  try {
    const { name, price, category, rating, image } = req.body;

    if (
      !name ||
      price == null ||
      !category ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        error: "Valid name, price, and category are required"
      });
    }

    const result = await db.query(
      `INSERT INTO public.ali
       (name, price, category, rating, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, Number(price), category, rating ?? null, image ?? null]
    );

    res.status(201).json({
      message: "Food added successfully",
      food: result.rows[0]
    });
  } catch (err) {
    console.error("Add food error:", err.message);
    res.status(500).json({ error: "Failed to add food" });
  }
});

// Get cart
app.get("/api/cart", (req, res) => {
  res.json(cart);
});

// Add food to cart
app.post("/api/cart", (req, res) => {
  const food = req.body;

  if (
    !food ||
    food.id == null ||
    !food.name ||
    !Number.isFinite(Number(food.price)) ||
    Number(food.price) < 0
  ) {
    return res.status(400).json({ error: "Invalid food data" });
  }

  const existingItem = cart.find(
    item => String(item.id) === String(food.id)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...food, quantity: 1 });
  }

  res.status(201).json(cart);
});

// Update cart
app.patch("/api/cart", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Cart must be an array" });
  }

  cart = req.body;

  res.status(200).json({
    message: "Cart updated successfully",
    cart
  });
});

// Place order
app.post("/api/order", async (req, res) => {
  try {
    const orderCart = req.body.cart;

    if (!Array.isArray(orderCart) || orderCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or missing"
      });
    }

    const validItems = orderCart.every(item =>
      item &&
      item.id != null &&
      item.name &&
      Number.isFinite(Number(item.price)) &&
      Number(item.price) >= 0 &&
      Number.isInteger(Number(item.quantity)) &&
      Number(item.quantity) > 0
    );

    if (!validItems) {
      return res.status(400).json({ error: "Invalid order items" });
    }

    const totalPrice = orderCart.reduce(
      (total, item) =>
        total + Number(item.price) * Number(item.quantity),
      0
    );

    const result = await db.query(
      `INSERT INTO public.orders (items, total_price)
       VALUES ($1, $2)
       RETURNING *`,
      [JSON.stringify(orderCart), totalPrice]
    );

    cart = [];

    res.status(201).json({
      message: "Order placed successfully",
      order: result.rows[0]
    });
  } catch (err) {
    console.error("Order error:", err.message);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// Start server after checking database connection
async function startServer() {
  try {
    await db.query("SELECT 1");
    console.log("Connected to PostgreSQL");

    app.listen(port, () => {
      console.log(`Zwigato backend running on port ${port}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
}

startServer();
