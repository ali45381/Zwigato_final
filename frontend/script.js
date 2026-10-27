
let food = [];
let cart = [];
let total = 0;

// CATEGORY SECTION
const parent = document.querySelector(".pop-food");

const allButton = document.createElement("button");
allButton.textContent = "All";
allButton.className = "pop";
allButton.dataset.category = "All";
parent.append(allButton);

// Give each existing category button a clean category name.
// The emoji stays visible, but is not used for filtering.
const categoryNames = [
  "Pizza",
  "Burger",
  "Biryani",
  "Desserts",
  "Drinks"
];

const categoryButtons = parent.querySelectorAll("button.pop");

categoryButtons.forEach(function (button) {
  const category = categoryNames.find(function (name) {
    return button.textContent.includes(name);
  });

  if (category) {
    button.dataset.category = category;
  }
});

// FILTER FOOD
function filterFood(category) {
  console.log("Selected category:", category);

  const filteredFood = food.filter(function (item) {
    return String(item.category || "").trim().toLowerCase() ===
      String(category || "").trim().toLowerCase();
  });

  console.log("Filtered results:", filteredFood);

  displayFood(filteredFood);
}

// ONE CLICK HANDLER FOR ALL CATEGORY BUTTONS
parent.addEventListener("click", function (event) {
  const button = event.target.closest("button.pop");

  if (!button || !parent.contains(button)) {
    return;
  }

  const category = button.dataset.category;

  if (!category) {
    console.warn("Category not configured:", button.textContent);
    return;
  }

  if (category === "All") {
    displayFood(food);
  } else {
    filterFood(category);
  }
});

// DISPLAY FOOD
function displayFood(foodlist) {
  const foodContainer = document.getElementById("food-container");

  if (!foodContainer) {
    console.error("Food container not found!");
    return;
  }

  foodContainer.innerHTML = "";

  // Handle empty results safely
  if (!Array.isArray(foodlist) || foodlist.length === 0) {
    foodContainer.textContent = "No food found in this category.";
    return;
  }

  for (let i = 0; i < foodlist.length; i++) {
    const item = foodlist[i];

    const div1 = document.createElement("div");
    div1.className = "food";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name || "Food";
    img.className = "food-image";

    const p1 = document.createElement("p");
    p1.textContent = item.name;

    const p2 = document.createElement("p");
    p2.textContent = "₹" + item.price;

    const p3 = document.createElement("p");
    p3.textContent = item.rating ?? "";

    const but1 = document.createElement("button");
    but1.textContent = "Add Cart";

    but1.addEventListener("click", async function () {
      const selectedFood = {
        ...item,
        quantity: 1
      };

      try {
        const res = await fetch("http://localhost:5000/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(selectedFood)
        });

        if (!res.ok) {
          throw new Error("Failed to add food to cart");
        }

        const data = await res.json();

        // The backend should return the updated cart array.
        cart = Array.isArray(data) ? data : data.cart;

        if (!Array.isArray(cart)) {
          throw new Error("Backend did not return the expected cart");
        }

        price();
        add();
        cartadd();
      } catch (err) {
        console.error("Cart error:", err);
      }
    });

    div1.append(img, p1, p2, p3, but1);
    foodContainer.append(div1);
  }

  console.log("Displayed food:", foodlist);
}

// FETCH FOODS FROM POSTGRESQL API
async function loadFoods() {
  try {
    const res = await fetch("http://localhost:5000/api/foods");

    console.log("Food API status:", res.status);

    if (!res.ok) {
      throw new Error("Failed to fetch foods");
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Food API did not return an array");
    }

    food = data;
    displayFood(food);
  } catch (err) {
    console.error("Food fetch error:", err);
  }
}

loadFoods();

// CART COUNT
function cartadd() {
  const cartLink = document.getElementById("cart-link");

  if (cartLink) {
    cartLink.textContent =
      "Cart 🛒 " +
      cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
  }
}

// LOAD CART FROM BACKEND
async function loadCart() {
  try {
    const res = await fetch("http://localhost:5000/api/cart");

    if (!res.ok) {
      throw new Error("Failed to fetch cart");
    }

    const data = await res.json();

    cart = Array.isArray(data) ? data : data.cart;

    if (!Array.isArray(cart)) {
      throw new Error("Backend did not return the expected cart");
    }

    price();
    add();
    cartadd();
  } catch (err) {
    console.error("Cart fetch error:", err);
  }
}

loadCart();

// SYNCHRONIZE CART WITH BACKEND
async function syncCart() {
  try {
    console.log("Sending cart to backend:", cart);

    const res = await fetch("http://localhost:5000/api/cart", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cart)
    });

    if (!res.ok) {
      throw new Error("Failed to sync cart");
    }

    const data = await res.json();

    cart = Array.isArray(data) ? data : data.cart;

    if (!Array.isArray(cart)) {
      throw new Error("Backend did not return the expected cart");
    }
  } catch (err) {
    console.error("Cart sync error:", err);
    throw err;
  }
}

// SEARCH FOOD
function search() {
  const nav = document.querySelector("nav");
  const input = document.createElement("input");

  input.placeholder = "Search food...";
  input.type = "search";
  input.id = "food-search";

  nav.append(input);

  input.addEventListener("input", function () {
    const searchTerm = input.value.trim().toLowerCase();

    const result = food.filter(function (item) {
      return String(item.name || "")
        .toLowerCase()
        .includes(searchTerm);
    });

    displayFood(result);
  });
}

search();

// DISPLAY CART
function add() {
  const cartContainer = document.getElementById("cart-container");
  cartContainer.innerHTML = "";

  for (let j = 0; j < cart.length; j++) {
    const item = cart[j];

    const itemDiv = document.createElement("div");
    itemDiv.className = "cart-item";

    const itemName = document.createElement("p");
    itemName.textContent = item.name;

    const itemPrice = document.createElement("p");
    itemPrice.textContent = "₹" + item.price;

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const quantityText = document.createElement("span");
    quantityText.textContent = "Quantity: " + item.quantity;

    const plusButton = document.createElement("button");
    plusButton.textContent = "+";

    plusButton.addEventListener("click", async function () {
      item.quantity = Number(item.quantity || 0) + 1;

      try {
        await syncCart();
        price();
        add();
        cartadd();
      } catch (err) {
        console.error("Could not update quantity:", err);
      }
    });

    const minusButton = document.createElement("button");
    minusButton.textContent = "−";

    minusButton.addEventListener("click", async function () {
      if (Number(item.quantity) > 1) {
        item.quantity = Number(item.quantity) - 1;
      } else {
        cart.splice(j, 1);
      }

      try {
        await syncCart();
        price();
        add();
        cartadd();
      } catch (err) {
        console.error("Could not update quantity:", err);
      }
    });

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", async function () {
      cart.splice(j, 1);

      try {
        await syncCart();
        price();
        add();
        cartadd();
      } catch (err) {
        console.error("Could not remove item:", err);
      }
    });

    controls.append(
      quantityText,
      plusButton,
      minusButton,
      removeButton
    );

    itemDiv.append(itemName, itemPrice, controls);
    cartContainer.append(itemDiv);
  }

  const totalText = document.createElement("p");
  totalText.textContent = "Total: ₹" + total;
  cartContainer.append(totalText);
}

// CALCULATE TOTAL
function price() {
  total = 0;

  for (let j = 0; j < cart.length; j++) {
    total +=
      Number(cart[j].price) * Number(cart[j].quantity || 0);
  }
}

// PLACE ORDER
const orderButton = document.getElementById("place-order");

if (orderButton) {
  orderButton.addEventListener("click", async function () {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cart: cart
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to place order");
        return;
      }

      alert("Order placed successfully!");
      console.log("Saved order:", data.order);

      // Clear the cart on the backend
      const clearResponse = await fetch(
        "http://localhost:5000/api/cart",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify([])
        }
      );

      if (!clearResponse.ok) {
        throw new Error("Order saved, but cart could not be cleared");
      }

      const clearData = await clearResponse.json();
      cart = Array.isArray(clearData) ? clearData : clearData.cart;

      if (!Array.isArray(cart)) {
        cart = [];
      }

      price();
      add();
      cartadd();
    } catch (error) {
      console.error("Order error:", error);
      alert("There was a problem processing your order. Check the console.");
    }
  });
}
