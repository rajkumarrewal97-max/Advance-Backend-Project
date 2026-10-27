const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');



/**
 * POST /api/transactions/
 * create a new transaction
 */

 router.post("/", authMiddleware.authMiddleware, transactionController.createTransactionController);


/**
 * POST /api/transactions/system/initial-funds
 * on system user
 */

 router.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)




 module.exports = router