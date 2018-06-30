module.exports = function(fs,multer,path,app, passport) {

	const port     = process.env.PORT || 2000;
	var server=app.listen(port,()=>{
	  console.log('listening on port 2000')
	});
	const io = require('socket.io').listen(server);
	var dir,usr={},check=0,predir;

    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.get('/profile', isLoggedIn, function(req, res) {
			use={user:req.user};
			if(check===0){
			dir = `${__dirname}/uploads/${use.user.local.email}/`;
			predir=dir;
		  }
			if(!fs.existsSync(dir)){
				fs.mkdirSync(dir);
			}
			console.log(use);
  		res.render('profile.ejs',{});
  		io.on('connection',function(socket){
				socket.on('back',function(){
					dir=predir;
					display(dir,fs,socket);
				})
				socket.on('cdir',function(valu){
					predir=dir;
					dir=`${dir}${valu.dname}/`;
					console.log(dir);
					check=valu.val;
						var folder=[],nonfolder=[];
					display(dir,fs,socket);
				});
    	socket.on('addfolder',function(name){
      	var fdir=`${dir}${name}`;
      	if(!fs.existsSync(fdir)){
        	fs.mkdirSync(fdir);
        	display(dir,fs,socket);
      	}
    	});
    	socket.on('dfolder',function(name){
      	var ddir=`${dir}${name}`;
				// console.log(`${dir}${name}`);
      	if(fs.lstatSync(ddir).isDirectory()){
        	fs.rmdir(ddir,function (err) {
    					if (err){console.log(err);}
    					display(dir,fs,socket);
							});

      	}else if(fs.lstatSync(ddir).isFile()) {
        	fs.unlink(ddir,function (err) {
    					if (err){console.log(err);}
    					display(dir,fs,socket);
							});
      	}
				else {
					console.log('cant delete');
				}
    	});
    	display(dir,fs,socket);

  });
});

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
app.post('/upload', (req, res) => {
	const storage = multer.diskStorage({
  destination: dir,
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage
  // limits:{fileSize: 1000000}
}).single('myfile');
  upload(req, res, (err) => {
		if(err){
			res.render('error.ejs', {
				msg: err
			});
		} else {
			console.log(req.file);
			res.render('profile.ejs');
		}
  });
});

};
function display(dir,fs,socket){
	var folder=[],nonfolder=[];
	fs.readdir(dir, (err, files) => {
		files.forEach(file => {
				if(fs.lstatSync(`${dir}${file}`).isDirectory()){
					folder.push(file);
				}
				else {
					nonfolder.push(file);
				}
		});
		socket.emit('fileslist',{folder,nonfolder});
	});
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
