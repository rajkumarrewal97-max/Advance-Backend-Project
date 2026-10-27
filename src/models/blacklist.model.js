const mongoose = require("mongoose");


const tokenBlacklistSchema = new mongoose.Schema({
    token:{
        type:String,
        require:[true, "Token is required to logout"],
        unique:[true, "Token should be unique"]
    }, 
},  {
    timestamps:true
})


tokenBlacklistSchema.index({createdAt:1}, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // 3 days
})

const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema);

module.exports = tokenBlacklistModel

