require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");

mongoUser=process.env.user;
mongopassword=process.env.password;
mongoose.connect("mongodb+srv://"+mongoUser+":"+mongopassword+"@cluster0.cic7v.mongodb.net/todolistDB",{useNewUrlParser:true},{ useUnifiedTopology: true },{ useFindAndModify: false });
mongoose.set('useFindAndModify', false);
const itemsSchema = {
    name:{
      type: String,
      required:true,
    }
}
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
    name:"Welcome to your todolist!",
});
const item2 = new Item({
    name:"Hit + button to add a new item",
});
const item3 = new Item({
    name:"Hit x to delete an item",
});
const intro1 = new Item({
    name: "SignIn to create your personal ToDo list"
});
const defaultItems = [item1,item2,item3];
const defaultintro = [item1,intro1,item2,item3];
const userSchema = {
    name :{
        type:String,
        required:true
    },
    password : {
        type : String,
        required:true
    },
    item:[itemsSchema],
}
const User = mongoose.model("User",userSchema);

app.get("/",function(req,res){
    
    /*var today = new Date();
    //console.log(today);
     var options = {
         weekday : "long",
         day : "numeric",
         month : "long"
     }
    var date = today.toLocaleDateString("en-US",options);
     //console.log(day);
     */ 
     Item.find({},function(err,itemsAvailable){
         if(itemsAvailable==0){
            Item.insertMany(defaultintro,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("succesfully inserted default itmes");
                } 
            });
            res.redirect("/");
         }else{
            itemsAvailable.forEach(function(item){
                console.log(item.name);
            });
            res.render("list",{ listTitle:"Today", newitem:itemsAvailable , id:""});
        } 
    })   
});
app.post("/",function(req,res){
    //console.log(req.body);
   /* item = req.body.toDo;
    if(req.body.list === "Work"){
        workItems.push(item);
        res.redirect("/work");
    }else{
        items.push(item);
        res.redirect("/");
    } */
    const itemName = req.body.toDo;
    const listName = req.body.list;
    const id = req.body.id;
    console.log(id);
    const item = new Item({
        name: itemName,
    });
    if(listName=="Today"){
        item.save();
        res.redirect("/");
    }else{
        User.findOne({_id:id},function(err,foundList){
            foundList.item.push(item);
            foundList.save();
            res.redirect("/go-"+id);
        });
    }  
});
app.get("/SignIn",function(req,res){
    res.render("signin");
})
app.get("/SignUp",function(req,res){
    res.render("signup");
})
app.post("/SignUp",function(req,res){
    const userName = req.body.username;
    const password = req.body.password;
    console.log( userName +" "+ password);
    const saltRounds = 10;
    let userinfo;
    bcrypt.genSalt(saltRounds, function (saltError, salt) {
    if (saltError) {
        throw saltError
    } else {
        bcrypt.hash(password, salt, function(hashError, hash) {
        if (hashError) {
            throw hashError
        } else {
            console.log(hash);
            userinfo = new User({
                name: userName,
                password : hash,
                item:defaultItems,
            });
            userinfo.save();
            res.render("signupsuccess");
            //$2a$10$FEBywZh8u9M0Cec/0mWep.1kXrwKeiWDba6tdKvDfEBjyePJnDT7K
        }
        });
    }
    });  
});
app.post("/SignIn",function(req,res){
    const userName = req.body.username;
    const password = req.body.password;
    User.find({name:userName},function(err,founduser){
        if(founduser==0){
            res.render("signinfailed",{msg:"No User Record Found! Go SignUp First"});
        }else{
            console.log(founduser.name +" "+founduser.password);
            founduser.forEach(function(user){
                bcrypt.compare(password, user.password, function(error, isMatch) {
                    if (error) {
                      throw error
                    } else if (!isMatch) {
                      console.log("Password doesn't match!");
                      res.render("signinfailed",{msg:"Wrong Username or Password, Try Again!"})
                    } else {
                      console.log("Password matches!");
                      res.redirect("/go-"+user.id);
                    }
                  });
            });
        }  
    })
})
app.post("/delete",function(req,res){
    console.log(req.body.nameOfItem + " "+ req.body.listName);
    const id = req.body.id;
    itemToBeDeleted = req.body.nameOfItem;
    listName = req.body.listName;
    if(listName=="Today"){
        Item.deleteOne({name:req.body.nameOfItem},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("deletion successful");
                res.redirect("/");
            }
        });    
    }else{
        User.findOneAndUpdate({_id:id},{$pull:{item:{name:itemToBeDeleted}}},function(err,foundList){
            if(!err){  
                console.log("item deleted from custum list");
                res.redirect("/go-"+id);
            }
        });    
    }
});

app.get("/go-:id",function(req,res){
    const id = req.params.id;
    User.findOne({_id:id},function(err,listfound){
        if(!err){
            if(!listfound){
                res.send("error 404");
            }else{
                const userCustomList = lodash.capitalize(listfound.name);
                console.log(userCustomList +" "+id);
                console.log("Displaying new user id");
                res.render("list",{listTitle:userCustomList,newitem:listfound.item,id:id});
            }
        }  
    });
});
/*app.post("/addnewlist", function(req,res){
    listname = req.body.listname;
    console.log(listname);
    res.redirect("/go/"+listname);
})*/

app.get("/about",function(req,res){
    res.render("about");
})
let port = process.env.PORT;
if(port == null || ""){
    port = 3000
}
app.listen(port,function(){
    console.log("server started Successfully");
});