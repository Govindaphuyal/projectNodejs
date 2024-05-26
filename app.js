const express =require("express");
const app=express();
const path=require("path");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken")
const userModel=require("./models/user.js");
const postModel=require("./models/post.js")
const cookieParser=require('cookie-parser');
app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname,"/public")))
app.get("/",(req,res)=>{
 res.render("index")
})
app.get("/login",(req,res)=>{
    res.render("login")
   })
   app.get("/profile",isLoggedIn,async(req,res)=>{
      let user=await userModel.findOne({email:req.user.email}).populate("posts");//who login
    res.render("profile",{user})
   })
   app.get("/like/:id",isLoggedIn,async(req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate("user");//who login
   if(post.likes.indexOf(req.user.userid)==-1){
       post.likes.push(req.user.userid)

   }else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
   }
   await post.save();
  res.redirect("/profile")
 })
 app.get("/edit/:id",isLoggedIn,async(req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate("user");//who login
   res.render("edit",{post})
 })
 app.post("/update/:id",isLoggedIn,async(req,res)=>{
    let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});//who login
   res.redirect("/profile")
 })

   app.post("/post",isLoggedIn,async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});//who login 
    let {content}=req.body
        let post=await postModel.create({
            user:user._id,
           
            content
            
        })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
 })

app.post("/register",async(req,res)=>{
    let{email,password,username,name,age}=req.body
    const user=await userModel.findOne({email});
    if(user) return res.status(500).send("user already registered")
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                let user=await userModel.create({
                    username,
                    name,
                    age,
                    email,
                    password:hash

                })
                var token = jwt.sign({email:user.email,userid:user._id}, 'shhhhh');
                res.cookie("token",token)
                res.send("registered")
            });
        });
   })
   app.post("/login",async(req,res)=>{
    let{email,password}=req.body
    const user=await userModel.findOne({email});
    if(!user) return res.status(500).send("user and password not found in register")
        
        bcrypt.compare(password, user.password, function(err, result) {
            if(result) {
                var token = jwt.sign({email:user.email,userid:user._id}, 'shhhhh');
                res.cookie("token",token)
                res.status(200).redirect("/profile")

            }

            else res.redirect("/login")
        });
        
        
    })
    app.post("/logout",(req,res)=>{
        res.cookie("token","")
        res.redirect("/login")
    })
    
    //protected routes
    function isLoggedIn(req,res,next){
        if(req.cookies.token==="") res.redirect("/login")
            else{
            var data = jwt.verify(req.cookies.token, 'shhhhh');
            req.user=data;
            next();
    }


   }
   
app.listen(3000);