const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");


router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

router.post("/signup",
wrapAsync(async(req,res)=>{
    try{
        let{email,username,password}=req.body;
        const newUser=new User({email,username});
        const registeredUser=await User.register(newUser,password);
        console.log(registeredUser);
        res.redirect("/listings");
        console.log(req.body);
    }
    catch(e){
        res.redirect("/signup");
    }

}));

router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

router.post("/login",passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),
async(req,res)=>{
    console.log(req);
res.send("Welcome to wanderlust, You are logged in");
console.log(req.body);
res.redirect("/listings");
});

router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are logged out");
        res.redirect("/listings");
    });
});

module.exports=router;