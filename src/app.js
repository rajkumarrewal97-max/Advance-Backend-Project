const express = require("express");
const cookieparser = require("cookie-parser");

const app = express();

/**
 * Middlewares
 */
app.use(express.json());
app.use(cookieparser());

/**
 * Routes requires
 */
const authRouter = require("../src/routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

/**
 * GET /
 */
app.get("/", (req, res) => {
  res.send("Welcome to the Banking API");
});

/**
 * Use routes
 */
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);

module.exports = app;
