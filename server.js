const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const dbConnect = require("./books_db");
const orderConnect = require('./order_db');

const app = express();
const PORT = process.env.PORT || 1905;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

const booksPath = path.join(__dirname, "books.json");
let books = JSON.parse(fs.readFileSync(booksPath, "utf-8"));

app.get("/", (req, res) => {
  res.render("index", { books });
});

app.post("/create", async (req, res) => {
  try {
    const data = new StudentModel(req.body);
    await data.save();
    res.status(201).send(data);
  } catch (err) {
    console.log(err);
  }
});

app.get("/books/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = books.find((book) => book.id === bookId);
  if (!book) {
    return res.status(404).send("Book not Found");
  }
  res.render("book_details", { book });
});

let shoppingCart = [];
app.get("/cart", (req, res) => {
  res.render("cart", { cart: shoppingCart });
});

app.post("/cart/add", (req, res) => {
  const bookId = parseInt(req.body.bookId);
  const qty = parseInt(req.body.qty);
  const book = books.find((book) => book.id === bookId);
  if (!book) {
    return res.status(404).send("Book not found.");
  }

  if (qty > book.qty) {
    return res.status(400).send("Not enough stock.");
  }
  const cartItem = shoppingCart.find((item) => item.bookId === bookId);
  if (cartItem) {
    cartItem.qty += qty;
  } else {
    shoppingCart.push({
      bookId,
      title: book.title,
      price: book.price,
      qty,
    });
  }

  res.redirect("/cart");
});

app.get("/add_book", (req, res) => {
  res.sendFile(`${__dirname}/add_book.html`);
});

app.post("/add_book_submit", (req, res) => {
  const bid = req.body.bid;
  const title = req.body.title;
  const author = req.body.author;
  const price = req.body.price;
  const qty = req.body.qty;
  const image = req.body.image;

  insert(bid, title, author, price, qty, image)
    .then(() => {
      console.log("Document inserted successfully");
      res.redirect("/");
    })
    .catch((error) => {
      console.error("Error inserting document:", error);
      res.status(500).send("Error inserting document");
    });
});

async function insert(bid, title, author, price, qty, image) {
  const newBook = {
    book_id: parseInt(bid),
    book_name: title,
    book_author: author,
    book_price: parseFloat(price),
    book_qty: parseInt(qty),
    book_img: image,
  };

  try {
    const db = await dbConnect();
    await db.insertOne(newBook);
    books.push({
      id: newBook.book_id,
      title: newBook.book_name,
      author: newBook.book_author,
      price: newBook.book_price,
      qty: newBook.book_qty,
      image: newBook.book_img,
    });

    fs.writeFileSync(booksPath, JSON.stringify(books, null, 2), "utf-8");
  } catch (error) {
    console.error(
      "Error inserting data into database or updating JSON file:",
      error
    );
    throw error;
  }
}

app.post("/cart/remove", (req, res) => {
  const bookId = parseInt(req.body.bookId);
  shoppingCart = shoppingCart.filter((item) => item.bookId !== bookId);
  res.redirect("/cart");
});

app.post("/checkout", (req, res) => {
  const buyerName = req.body.buyerName;
  const totalQty = shoppingCart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = shoppingCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  res.render("checkout", {
    buyerName,
    cart: shoppingCart,
    totalQty,
    totalPrice,
  });
  shoppingCart = [];
});

async function insertOrder(buyerName, title, qty, totalPrice) {
  try {
    const db = await orderConnect();
    const ordersCollection = db.collection('orders');

    const result = await ordersCollection.insertOne({
      buyerName: buyerName,
      title: title,
      qty: qty,
      totalPrice: totalPrice,
    });

    console.log("Order inserted successfully:", result.insertedId);
  } catch (error) {
    console.error("Error inserting order:", error);
    throw error;
  }
}

app.post("/order_submit", async (req, res) => {
  const buyerName = req.body.buyerName;
  const cart = req.body.cart.map((item) => JSON.parse(item)); 
  const totalQty = req.body.totalQty;
  const totalPrice = req.body.totalPrice;

  try {
    for (let item of cart) {
      await insertOrder(buyerName, item.title, item.qty, item.price);
    }
    res.redirect("/");
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(500).send("Failed to submit order");
  }
});

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
