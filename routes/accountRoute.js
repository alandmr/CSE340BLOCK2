// Needed Resources 
const express = require("express")
const router = new express.Router() 
const accController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')


// Route to build Login view
router.get("/login", utilities.handleErrors(accController.buildLogin));
// Process the login attempt
router.post("/login", regValidate.loginRules(), regValidate.checkLoginData, utilities.handleErrors(accController.accountLogin))
// Route to build Registration view
router.get("/register",utilities.handleErrors(accController.buildRegister));
// Route to register the new account
router.post("/register", regValidate.registationRules(), regValidate.checkRegData, 
utilities.handleErrors(accController.registerAccount))

router.get("/", utilities.checkLogin, utilities.handleErrors(accController.accountLoginView));
router.get("/logout", utilities.handleErrors(accController.accountLogout));

router.get("/update/:userId", utilities.handleErrors(accController.updateView));
router.post("/update/", regValidate.updateRules(), regValidate.checkUpdateData, utilities.handleErrors(accController.updateAccount));
router.post("/updatePassword/", regValidate.passwordRules(), regValidate.checkPasswordData, utilities.handleErrors(accController.updatePassword));

router.get("/manage/", utilities.handleErrors(accController.accountManageView));
router.get("/delete/:accountId", utilities.handleErrors(accController.deleteAccountView));
router.post("/delete/", utilities.handleErrors(accController.deleteAccount));

module.exports = router;