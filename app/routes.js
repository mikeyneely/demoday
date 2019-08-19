module.exports = function(app, passport, db, multer, ObjectId) {

  // normal routes ===============================================================

  // sign up/ login page)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, function(req, res) {
    let userID = req.session.passport.user
    console.log(req.session.passport.user)
    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('profile.ejs', {
        user : req.user,
        messages: result
      })
    })
  });
  //user feed
  app.get('/feed', isLoggedIn, function(req, res) {
    let userID = req.session.passport.user
    console.log(req.session.passport.user)
    db.collection('users').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('feed.ejs', {
        user : req.user,
        messages: result
      })
    })
  });
  //
  app.get('/feed/:feed_id', function(req, res) {
    console.log(req.params.feed_id);
    var uId = ObjectId(req.params.feed_id)
    db.collection('users').findOne({"_id": uId}, (err, otherUser) => {
      if (err) return console.log(err)
      db.collection('posts').findOne({stageName: otherUser.local.stageName}, (err, posts) => {
        res.render('feedProfile.ejs', {
          user : req.user,
          otherUser : otherUser,
          posts: posts
        })
      })
    })
  });
  app.get('/updateprofile', isLoggedIn, function(req, res) {
    var uId = ObjectId(req.session.passport.user)
    console.log(req.session.passport.user)

    var uName

    db.collection('posts').findOne({stageName: req.user.local.stageName}, (err, result) => {


      if (err) return console.log(err)
      console.log('got post', req.user.local.stageName,result)
      if (err) return console.log(err)
      res.render('updateprofile.ejs', {
        user : req.user,
        posts: result
      })

    })
  })






  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================

  //---------------------------------------
  // IMAGE CODE
  //---------------------------------------
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }
  });

  var storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/audio/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".mp3")
    }
  });

  var upload = multer({storage: storage});
  var upload1 = multer({storage: storage1});
  app.post('/up', upload.single('file-to-upload'), (req, res, next) => {

    insertDocuments(db, req, 'images/uploads/' + req.file.filename, () => {
      //db.close();
      //res.json({'message': 'File uploaded successfully'});
      res.redirect('/updateprofile')
    });
  });

  app.post('/upSong', upload1.single('song'), (req, res, next) => {
    insertDocuments1(db, req, 'audio/uploads/' + req.file.filename, () => {
    // insertDocuments1(db, req, 'audio/uploads/' + req.file.filename, () => {
      //db.close();
      //res.json({'message': 'File uploaded successfully'});
      res.redirect('/updateProfile')
    });
  });

  var insertDocuments = function(db, req, filePath, callback) {
    var collection = db.collection('users');
    var uId = ObjectId(req.session.passport.user)
    collection.findOneAndUpdate({"_id": uId}, {
      $set: {
        profileImage: filePath
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })
    // collection.findOne({"_id": uId}, (err, result) => {
    //     //{'imagePath' : filePath }
    //     //assert.equal(err, null);
    //     callback(result);
    // });
  }

  var insertDocuments1 = function(db, req, filePath, callback) {
    var uId = ObjectId(req.session.passport.user)
    var uName
    db.collection('users').find({"_id": uId}).toArray((err, result) => {
      if (err) return console.log(err)
      uName = result[0].local.stageName
      uCity = result[0].local.city
      uAbout = result[0].local.aboutUser

      db.collection('posts').save({stageName: uName, city: uCity, aboutUser: uAbout, profileSong: 'audio/uploads/' + req.file.filename}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        callback()
      })
    })
  }

  var insertOrUpdateSong = function(db, req, filePath, callback) {
    var collection = db.collection('posts');
    var uId = ObjectId(req.session.passport.user)
    collection.updateOne({"_id": uId}, {
      $set: {
        profileSong: filePath
      }
    }, {
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })
  }
  //---------------------------------------
  // IMAGE CODE END
  //---------------------------------------


  app.post('/messages', (req, res) => {
    db.collection('messages').save({msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })
  //I was trying to enable users to update profile information but couldnt quite get there //
  //I'm gonna keep messing with it  I think im getting close//
  // app.put('/update', (req, res) => {
  //     var uId = ObjectId(req.session.passport.user)
  //     console.log(uId, "test");
  //     db.collection('users').findOneAndUpdate({"_id": uId}, {
  //     $set: {
  //       aboutUser : req.body.aboutUser
  //     }
  //   },
  //    (err, result) => {
  //     if (err) return res.send(err)
  //     res.send(result)
  // })


  app.put('/messages', (req, res) => {
    db.collection('messages')
    .findOneAndUpdate({msg: req.body.msg}, {
      $set: {
        stageName: req.body.stageName,
        thumbUp:req.body.thumbUp + 1
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })




  app.delete('/messages', (req, res) => {
    db.collection('messages').findOneAndDelete({msg: req.body.msg}, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })
  app.put('/thumbDown', (req, res) => {
    db.collection('messages')
    .findOneAndUpdate({msg: req.body.msg}, {
      $set: {
        thumbUp:req.body.thumbUp - 1
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })
  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user            = req.user;
    user.local.email    = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
  return next();

  res.redirect('/');
}
