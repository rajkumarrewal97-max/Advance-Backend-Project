const { CaseLower } = require("lucide-react");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema  = new mongoose.Schema({
    email:{
        type: String,
        required: [true, "Email is required for creating a user"],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email"
        ],
        unique: [true, "Email already exist"]
    },
    name:{
        type: String,
        required: [true, "name is required for creating a user"],
    },
    password:{
         type:String,
         required: [true, "password is required for creating a user"],
         minlength:[6, "password should contain more than 6 characters"],
         select:false // bydefault nhi rhega database query me
    },
    systemUser:{
        type: Boolean,
        default: false,
        immutable: true,
        select: false 
    }
} ,{
     timestamps:true
})

// jab bhi user ke password ko save kroge tb ye fun chlega
userSchema.pre("save", async function(){
   // use hash to save password

    // ydi password change nhi hua h to kuch mt kro
    if(!this.isModified("password")){
        return 
    }
    // ydi change hua h to hash me convert kro
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    return 

})

// ydi dubara user password se sign up krega to cheack kro purane password se jo database me h

 userSchema.methods.comparePassword = async function (password){

     return await bcrypt.compare(password, this.password)

 }

 const userModel = mongoose.model("user", userSchema);

 module.exports = userModel;