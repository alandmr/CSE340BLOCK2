// Needed Resources 
const express = require("express")
const router = new express.Router() 
const accController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')


// Route to build Login view
router.get("/login", utilities.handleErrors(accController.buildLogin));
// Process the login attempt
router.post("/login", regValidate.loginRules(), regValidate.checkLoginData, utilities.handleErrors(accController.buildLogin))
// Route to build Registration view
router.get("/register",utilities.handleErrors(accController.buildRegister));
// Route to register the new account
router.post("/register", regValidate.registationRules(), regValidate.checkRegData, 
utilities.handleErrors(accController.registerAccount))

module.exports = router;