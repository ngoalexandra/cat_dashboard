var path = require('path');

//========== EXPRESS ==============
const express = require('express');
const app = express();

//========== PATH FOR VIEWS DIR ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

//========== BODY PARSER ==============
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//========== STATIC ==============
app.use(express.static(__dirname + "/static"));

//========= SESSION =============
const session = require('express-session');
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

//====== FLASH =============
const flash = require('express-flash');
app.use(flash());

//======= MONGOOSE ==========
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/animal_db');
mongoose.Promise = global.Promise;
// create collection
var CatSchema = new mongoose.Schema({
    name: {type: String, required: [true, "Must include first name"], minlength: [2, "First name cannot be empty"]},
    weight: {type: Number, required: [true, "Must include weight of cat"], minlength: [1, "Weight  cannot be empty"]},
    color: {type: String, required: [true, "Must include color of cat"], minlength: [1, "Color cannot be empty"]} 
}, {timestamps: true});
var Cat = mongoose.model('Cat', CatSchema);

// displays all cats in DB
app.get("/", function (request, response){
    Cat.find({}, function(error, cats){
        if(error){
            console.log("not able to find anything from database");
        } else {
            all_cats = cats;
            response.render("index", {cats: all_cats});
        } 
    })
})

// displays cat with that ID
app.get("/cat/:id", function(request, response){
    Cat.find({_id: request.params.id}, function(error, cat){
        if(error){
            console.log("Error: cannot find cat's info within our database");
        } else {
            response.render("show_by_id", {cat: cat});
            
        }
    })
})

// page that shows the form to create new cat
app.get("/new", function(request, response){
    response.render("new");
    console.log("adding new cat")
})

// creating a new cat logic
app.post("/new", function(request, response){
    var cat = new Cat({
        name: request.body.name,
        weight: request.body.weight,
        color: request.body.color
    });
    console.log(cat);
    cat.save(function(error){
        if(error){
            console.log("Failed to save within the database");
            for (var key in error.errors){
                request.flash("error_msg", error.errors[key].message);
            }
            response.render('new');
        } else {
            response.redirect("/");
        }
       
    });
});

// edit form
app.get('/edit/:id', function (request, response) {
    console.log("I am in edit route");
    Cat.find({_id: request.params.id}, function(error, cat){
        console.log("cat info", cat);
        if (error){
            console.log("cannot update");
        } else {
            response.render("edit", {cat : cat});
        }
    }); 
});

// edit cat with that ID
app.post("/update", function (request, response){
    
    console.log(request.body);
    var opts = {runValidators: true};
    Cat.update({_id: request.body.id}, {$set: {name: request.body.name, weight: request.body.weight, color: request.body.color}}, opts, function (error, cat){
        if(error){
            console.log("not able to successfully edit cat information");
            for(var key in error.errors){
                request.flash("error_msg", error.errors[key].message);
            }
            Cat.find({_id: request.body.id}, function(error, cat){
                if (error){
                    console.log("cannot update");
                } else {
                    response.render("edit", {cat : cat});
                }
            }); 
        }  else {
                console.log(" cat information has been successfully updated"); 
                response.redirect("/");
        } 
    });
});

// delete cat from db
app.post('/delete/:id', function (request, response) {
    Cat.find({_id: request.params.id}).remove().exec(); // .exec() executes the query
    response.redirect('/')
});



app.listen(8000, function(){
    console.log("I am in port 8000");
})

