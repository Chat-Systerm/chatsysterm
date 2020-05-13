var express = require('express');
var router = express.Router();

<<<<<<< HEAD
router.get('/admin',async function(req,res,next){
=======
router.get('/admin',function(req,res,next){

    //TODO:进一步判断是不是admin
>>>>>>> f2dfefb0a3e6a34cf9bf155f1bb6c1c5d90609c3
    res.render('admin',{ user_name:req.session.user});
});
module.exports = router;