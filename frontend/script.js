
let food = [];

let cart = [];
   
let total = 0;

// FILTER FOOD
function filterFood(category) {
  return food.filter(function (item) {
    return item.category === category;
    console.log("Selected category ",category);
    console.log("food data",food);
  });
}

// CREATE ALL BUTTON
const parent = document.querySelector(".pop-food");
const allButton = document.createElement("button");

allButton.textContent = "All";
allButton.className = "pop";
parent.append(allButton);

// DISPLAY FOOD
function displayFood(foodlist) {
  const foodContainer = document.getElementById("food-container");
  foodContainer.innerHTML = "";

  for (let i = 0; i < foodlist.length; i++) {
    const div1 = document.createElement("div");
    div1.className = "food";

    const img = document.createElement("img");
    img.src = foodlist[i].image;
    img.alt = foodlist[i].name;
    img.className = "food-image";

    const p1 = document.createElement("p");
    p1.textContent = foodlist[i].name;

    const p2 = document.createElement("p");
    p2.textContent = "₹" + foodlist[i].price;

    const p3 = document.createElement("p");
    p3.textContent = foodlist[i].rating ?? "";

    const but1 = document.createElement("button");
    but1.textContent = "Add Cart";

    but1.addEventListener("click", async function () {
      // Send the selected food to the backend
      const selectedFood = {
        ...foodlist[i],
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

        // Use the cart returned by the backend
        cart = data;
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

  console.log(foodlist);
}

// FETCH FOODS FROM POSTGRESQL API
fetch("http://localhost:5000/api/foods")
  .then(res => {
    console.log("Food API status:", res.status);

    if (!res.ok) {
      throw new Error("Failed to fetch foods");
    }

    return res.json();
  })
  .then(data => {
    food = data;
    displayFood(food);
  })
  .catch(err => console.error("Food fetch error:", err));

// CART COUNT
function cartadd() {
  const cartLink = document.getElementById("cart-link");

  if (cartLink) {
    // Count total units, including quantities
    cartLink.textContent =
      "Cart 🛒 " +
      cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }
}

// LOAD CART FROM BACKEND
fetch("http://localhost:5000/api/cart")
  .then(res => {
    if (!res.ok) {
      throw new Error("Failed to fetch cart");
    }

    return res.json();
  })
  .then(data => {
    cart = data;
    price();
    add();
    cartadd();
  })
  .catch(err => console.error("Cart fetch error:", err));

   async function syncCart() {
    try {
      console.log("sending cart to backend",cart);


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
        cart = data.cart;

    } catch (err) {
        console.error("Cart sync error:", err);
    }
}
// SEARCH FOOD
function search() {
  const nav = document.getElementsByTagName("nav")[0];
  const input = document.createElement("input");

  input.placeholder = "Search food...";

  input.addEventListener("input", function () {
    const searchTerm = input.value.toLowerCase();

    const result = food.filter(function (item) {
      return item.name.toLowerCase().includes(searchTerm);
    });

    displayFood(result);
  });

  nav.append(input);
}

search();

// DISPLAY CART
function add() {
  const cartContainer = document.getElementById("cart-container");
  cartContainer.innerHTML = "";

  for (let j = 0; j < cart.length; j++) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "cart-item";

    const itemName = document.createElement("p");
    itemName.textContent = cart[j].name;

    const itemPrice = document.createElement("p");
    itemPrice.textContent = "₹" + cart[j].price;

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const quantityText = document.createElement("span");
    quantityText.textContent =
      "Quantity: " + cart[j].quantity;

    const plusButton = document.createElement("button");
    plusButton.textContent = "+";

    plusButton.addEventListener("click", async() => {
      cart[j].quantity += 1;
      await syncCart();
      price();
      add();
      cartadd();
    });

    const minusButton = document.createElement("button");
    minusButton.textContent = "−";

    minusButton.addEventListener("click", async() => {
      if (cart[j].quantity > 1) {
        cart[j].quantity -= 1;
      } else {
        cart.splice(j, 1);
      }
      await syncCart();
      price();
      add();
      cartadd();
    });

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", async() => {
      cart.splice(j, 1);
      await syncCart();
      price();
      add();
      cartadd();
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

// CATEGORY BUTTONS
const categoryButtons = document.getElementsByClassName("pop");

for (let i = 0; i < categoryButtons.length; i++) {
  categoryButtons[i].addEventListener("click", function () {
    const category = categoryButtons[i].textContent.trim();

    if (category === "All") {
      displayFood(food);
    } else {
      displayFood(filterFood(category));
    }
  });
}


 // PLACE ORDER
const orderButton = document.getElementById("place-order");

if (orderButton) {
  orderButton.addEventListener("click", async function () {
    // 1. Check whether the cart is empty
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      // 2. Send the cart to the backend
      const response = await fetch("http://localhost:5000/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cart: cart
        })
      });

      // 3. Read the backend response
      const data = await response.json();

      // 4. Handle errors
      if (!response.ok) {
        alert(data.error || "Failed to place order");
        return;
      }

      // 5. Confirm successful order
      alert("Order placed successfully!");

      console.log("Saved order:", data.order);

      // 6. Clear the frontend cart
      cart = [];

      // 7. Synchronize the empty cart with the backend
      await fetch("http://localhost:5000/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cart)
      });

      // 8. Refresh the cart display and total
      price();
      add();
      cartadd();

    } catch (error) {
      console.error("Order error:", error);
      alert("Could not connect to the server.");
    }
  });
}


























































//      if (existingFood) {
//
//        existingFood.quantity += 1;
//
//      } else {
//
//        cart.push({ ...foodlist[i], quantity: 1 });
//
//      }
//
//      price();
//
//      add();
//
//      cartadd();
//
//    });
//
//    div1.append(img,p1, p2, p3, but1);
//
//    foodContainer.append(div1);
//
//  }
//  console.log(foodlist);
//
//}