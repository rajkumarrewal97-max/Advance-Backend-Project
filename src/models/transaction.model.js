const { Amphora } = require("lucide-react");
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "transaction must have to associated with a fromaccount"],
    index: true,
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "transaction must have to associated  with a to account"],
    index: true,
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "SUCCESS", "FAILED", "REVERSED"],
      message: "Status can be pending, success, failed, reversed",
    },
    default: "PENDING",
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for transaction"],
    min: [0, "transaction account can not be negative"],
  },
  idempotencyKey: {
    type: String,
    required: [true, "Idempotency key is required for transaction"],
    unique: true,
    index: true,
  },
}, {
  timestamps: true,
});


const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;

