const express=require("express");
const router=express.Router();
const Listing =require("../models/listing.js");
const wrapAsync=require("../utils/wrapAsync.js");
const expressError=require("../utils/expressError.js");
const {listingSchema,reviewSchema}=require("../schema.js");
const flash=require("connect-flash");
const passport=require("passport");

const validateListing=(req,res,next)=>{
    let{error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new expressError(400,errMsg);
    }else{
        next();
    }
};

//index route
router.get("/",async(req,res)=>{
    const allListings=await Listing.find({});
    console.log(allListings);
    res.render("listings/index.ejs",{allListings});
 });
 
 //new route
 router.get("/new",(req,res)=>{
    console.log(req);
    // if(!req.isAuthenticated()){
    //     req.flash("error","You must be logged in to create a listing");
    //    return res.redirect("/login");
    // }
     res.render("listings/new.ejs");
 });
 
 //show route
 router.get("/:id",async(req,res)=>{
     let{id}=req.params;
     const listing=await Listing.findById(id).populate("reviews");
     res.render("listings/show.ejs",{listing});
 });

//create route
// router.post("/",
// validateListing,
// wrapAsync(async(req,res,next)=>{
//         const newListing=new Listing(req.body.listing);
//         await newListing.save();
        
//         res.redirect("/listings");
// }));

//edit route
router.get("/:id/edit",async(req,res)=>{
    let{id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
})

//update route
router.put("/:id",async(req,res)=>{
    let{id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
}); 

//delete route
router.delete("/:id",async(req,res)=>{
    let{id}=req.params;
   let deletedListing= await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   res.redirect("/listings");
});

module.exports=router;