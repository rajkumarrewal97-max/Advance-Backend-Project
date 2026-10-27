const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller")



const router = express.Router();


/**
 * POST  /api/account/
 * Create a new account
 * Protected route
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/**
 * GET /api/account/
 * Get all accounts of the logged-in user
 * Protected route
 */

router.get("/", authMiddleware.authMiddleware, accountController.getAllAccountsController);


/**
 * GET /api/account/balance/:accountId
 * Get the balance of a specific account
 * Protected route
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);
 


module.exports = router;