const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose")


/**
 * create a new transaction
 * THE 10-STEPS TRANSACTION FOLLOW:
 * 1. Validate the request 
 * 2. Validate idempontency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (pending)
 * 6. Create debit ledger entry
 * 7. Create credit ledger entry
 * 8. Mark transaction as completed
 * 9. Commit mongodb session
 * 10. Send email notification 
 */

async function createTransactionController(req, res) {

/**
 * 1. validate the request 
 */
    
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // ydi 1 bhi bhi field missing h to error throw krdo
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // account to aa rha h, kyuki transaction create krna h to check kro
    // ki account exist bhi krta h, -> user ka real account 
    // means wheather account is exist or not in database
    const fromUserAccount = await accountModel.findOne({
         _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempontency key
     */

    const isTransactionAlreadyExist = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExist){
        if(isTransactionAlreadyExist.status === "COMPLETED"){
            return res.status(200).json({
                message: "Transaction completed",
            })
        }

        if(isTransactionAlreadyExist.status === "PENDING"){
           return res.status(200).json({
                message: "Transaction is still processing"
            })
        }

        if(isTransactionAlreadyExist.status === "FAILED"){
           return res.status(500).json({
                message: "Transaction processing faailed, please retry"
            })
        }

        if(isTransactionAlreadyExist.status === "REVERSED"){
          return  res.status(500).json({
                 message: "Transaction was reserved, please retry"
            })
        }

    }


    /**
     * 3. Check account status
     */

    if(!fromAccount.status === "ACTIVE" || !toAccount.status === "ACTIVE"){
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }


    /**
     * 4. Derive sender balance from ledger
     * make sure model me aggregation pipline ho, debit and credit ko handle kro account model me
     */

    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance, Current balance is ${balance},   Requested amount is ${amount}`
        })
    }

    /**
 * 5. Create transaction (pending)
 * 6. Create debit ledger entry
 * 7. Create credit ledger entry
 * 8. Mark transaction as completed
 * 9. Commit mongodb session
     */

    /**
     * 5 to 8 steps sath me complete hogi ydi ek bhi failed hoti h to puri process rokh do
     * session start kro then create
     */ 

    let transaction;
    try{
    const session = await mongoose.startSession()
    session.startTransaction()

     // mongodb me transaction save kr rhe h but same idemontency key se,
     // same request dobara aayi h to same transaction create na ho
     transaction =(await transactionModel.create([{
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING"
     }], {session}))[ 0 ];


     const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
     }], {session})

     await (() => {
        return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
     })()

     const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
     }], {session})


      // save mt kro same ideompotencyKey ke 2 transaction ek ko find kro and update kro
      await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "SUCCESS" },
        {session}
      )

     await session.commitTransaction()
     await session.endSession()

    } catch (error) {
        return res.status(400).json({
            message: "Transaction is pending due to some issue, please retry after some time"
        })
    }


     /*10. Send email notification */

     // req.user ka use middleware se kr rhe jiske psss user ki sari details import mt kro route me kiya h kafi h
     await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toUserAccount._id)

      
     return res.status(200).json({
        message: "Transaction completed successfully",
        transaction: transaction
     })

}

/**
 * kisko paisa bhejna h , kitna bhejna h, idempotensykey 
 */

async function createInitialFundsTransaction(req, res) {
    
       const{toAccount, amount, idempotencyKey} = req.body

       if(!toAccount || !amount || !idempotencyKey){
          return res.status(400).json({
            message: "toAccount, amount, and idempotensyKey are required"
          })
       }

       const toUserAccount = await accountModel.findOne({
           _id: toAccount
       })

       if(!toUserAccount){
          return res.status(400).json({
             message: "Invalid account"
          })
       }

       // check kro kiske account se paise ktenge

       const fromUserAccount = await accountModel.findOne({
            user: req.user._id
       })

       if(!fromUserAccount){
         return res.status(400).json({
             message: "System user account not found"
         })
       }


       const session = await mongoose.startSession()
       session.startTransaction()

       /**
        * new ka use krenge kyuki database me nhi, server side pr transaction ka use krna h create hatao to session bhi
        */
       const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
       })

       // yha create use krenge 
       const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
       }], {session})

       const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
       }], {session})

       transaction.status = "SUCCESS"
       await transaction.save({session})

         await session.commitTransaction()
         await session.endSession()


         return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
         })

}


module.exports = {
    createTransactionController,
    createInitialFundsTransaction
}