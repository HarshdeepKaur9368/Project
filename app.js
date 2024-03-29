require("dotenv").config();

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing =require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const expressError=require("./utils/expressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const Review =require("./models/review.js");
const session=require("express-session");
const MongoStore=require("connect-mongo");
// const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");


const listingRouter=require("./router/listing.js");
const reviewRouter=require("./router/review.js");
const userRouter=require("./router/user.js");

// app.get("/",(req,res)=>{
//     res.send("hi , i am root");
// });



// app.use(flash());

// app.use(passport.initialize());
// app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    // res.locals.success=req.flash("success");
    res.locals.currentUser=req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"ram12@gmail.com",
//         username:"Ram kumar",  
//     });
//    let registeredUser= await User.register(fakeUser,"helloworld");
//    res.send(registeredUser);
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.set("views engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const dbUrl=process.env.ATLASDB_URL;

main()
.then((res)=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:"mysupersecretcode",
    },
    touchAfter:24*3600,
});

store.on("error",()=>{
    console.log("error in session store");
});

const sessionOptions={
    store,
   secret:"mysupersecretcode",
   resave:false,
   saveUninitialized:false,
   cookie:{
     expires:Date.now()+7*24*60*60*1000,
     maxAge:7*24*60*60*1000,
     httpOnly:true
   },
};



app.use(session(sessionOptions));

// app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


const validateListing=(req,res,next)=>{
    let{error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new expressError(400,errMsg);
    }else{
        next();
    }
};

// app.get((req,res,next)=>{
//     res.locals.success=req.flash("success");
//     req.flash("success","New listing created!");
//     next();
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);

const validateReview=(req,res,next)=>{
    let{error}=reviewSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new expressError(400,errMsg);
    }else{
        next();
    }
};

//index route
app.get("/listings",async(req,res)=>{
   const allListings=await Listing.find({});
   console.log(allListings);
   res.render("listings/index.ejs",{allListings});
});

//new route
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
})

//show route
app.get("/listings/:id",async(req,res)=>{
    let{id}=req.params;
    const listing=await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs",{listing});
});

//create route
app.post("/listings",
validateListing,
wrapAsync(async(req,res,next)=>{
        const newListing=new Listing(req.body.listing);
        await newListing.save();
        // req.flash("success","New listing created!");
        // req.flash("success","New listing created!");
        res.redirect("/listings");
}));

//edit route
app.get("/listings/:id/edit",async(req,res)=>{
    let{id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
})

//update route
app.put("/listings/:id",async(req,res)=>{
    let{id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
});

//delete route
app.delete("/listings/:id",async(req,res)=>{
    let{id}=req.params;
   let deletedListing= await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   res.redirect("/listings");
});



//post route(reviews)
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
   let listing= await Listing.findById(req.params.id);
   let newReview=new Review(req.body.review);

   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();

   console.log("new review saved");
   res.redirect(`/listings/${listing._id}`);
}));

//post route(delete)
app.delete("/listings/:id/reviews/:reviewId",async(req,res)=>{
    
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    let{id,reviewId}=req.params;
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
});



// error handling middleware
app.get((req,res,err,next)=>{
    let{status,message}=err;
    res.render("error.ejs");
    // res.status(status).send(message);
});



app.listen(8080,(req,res)=>{
    console.log("app is listening to 8080");
});