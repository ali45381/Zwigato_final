
import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
const port = 5000;

let cart = [];

app.use(cors());
app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  res.send("Correct server is running");
});

// Get food from PostgreSQL
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

// Get current cart
app.get("/api/cart", (req, res) => {
  res.json(cart);
});

// Add food to cart
app.post("/api/cart", (req, res) => {
  const food = req.body;

  if (!food || food.id == null || !food.name || !Number.isFinite(Number(food.price))) {
    return res.status(400).json({ error: "Invalid food data" });
  }

  const existingItem = cart.find(
    item => String(item.id) === String(food.id)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...food,
      quantity: 1
    });
  }

  console.log("Cart after adding:", cart);
  res.status(201).json(cart);
});

// Update the entire cart
app.patch("/api/cart", (req, res) => {
  console.log("PATCH ROUTE REACHED");

  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      error: "Cart must be an array"
    });
  }

  cart = req.body;
  console.log("Updated cart:", cart);

  res.status(200).json({
    message: "Cart updated successfully",
    cart
  });
});

app.post("/api/order", async (req, res) => {
  try {
    const orderCart = req.body.cart;

    // 1. Validate the cart
    if (!Array.isArray(orderCart) || orderCart.length === 0) {
      return res.status(400).json({
        error: "Cart is empty or missing"
      });
    }

    // 2. Calculate the total price
    const totalPrice = orderCart.reduce((total, item) => {
      return total + (Number(item.price) * Number(item.quantity));
    }, 0);

    // 3. Save the order in PostgreSQL
    const result = await db.query(
      `INSERT INTO public.orders (items, total_price)
       VALUES ($1, $2)
       RETURNING *`,
      [JSON.stringify(orderCart), totalPrice]
    );

    // 4. Send confirmation after saving
    res.status(201).json({
      message: "Order placed successfully",
      order: result.rows[0]
    });

  } catch (error) {
    console.error("Error placing order:", error);

    res.status(500).json({
      error: "Failed to place order"
    });
  }
});

// Connect to PostgreSQL before starting the server
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "school",
  password: "Ali@1",
  port: 5432
});

async function startServer() {
  try {
    await db.connect();
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
