const express  = require('express');
var app      = express();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');


var configDB = require('./config/database.js');


mongoose.connect(configDB.url); 

require('./config/passport')(passport);


app.use(cookieParser());
app.use(bodyParser()); 

app.set('view engine', 'ejs'); 


app.use(session({ secret: 'biztime' })); 
app.use(passport.initialize());
app.use(passport.session()); 
app.use(flash()); 

require('./app/routes.js')(fs,multer,path,app,passport); 
