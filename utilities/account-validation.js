const utilities = require(".")
const { body, validationResult } = require("express-validator")
const validate = {}
const accountModel = require("../models/account-model")
const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/*  **********************************
*  Registration Data Validation Rules
* ********************************* */
  validate.registationRules = () => {
    return [
      // firstname is required and must be string
      body("account_firstname")
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 1 })
        .withMessage("Please provide a first name."), // on error this message is sent.
  
      // lastname is required and must be string
      body("account_lastname")
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Please provide a last name."), // on error this message is sent.
  
      // valid email is required and cannot already exist in the database
    body("account_email")
        .trim()
        .isEmail()
        .normalizeEmail() // refer to validator.js docs
        .withMessage("A valid email is required.")
        .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists){
        throw new Error("Email exists. Please log in or use different email")
        }
    }),    
  
      // password is required and must be strong password
      body("account_password")
        .trim()
        .notEmpty()
        .isStrongPassword({
          minLength: 12,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
        .withMessage("Password does not meet requirements."),
    ]
  }


/*  **********************************
*  Login Data Validation Rules
* ********************************* */

validate.loginRules = () => {
    return [ 
    // valid email is required and cannot already exist in the database
    body("account_email")
        .trim()
        .escape()
        .notEmpty()
        .isEmail()
        .normalizeEmail() // refer to validator.js docs
        .withMessage("A valid email is required."),

    // password is required and must be strong password
    body("account_password")
    .trim()
    .notEmpty()
    .isStrongPassword({
          minLength: 12,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
    })
    .withMessage("Password does not meet requirements."),    
    ]
}


/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("account/register", {
      errors,
      title: "Registration",
      nav,
      account_firstname,
      account_lastname,
      account_email,
    })
    return
  }
  next()
}

/* ******************************
 * Check data and return errors or continue to login
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  const { account_email,account_password } = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("account/login", {
      errors,
      title: "Login",
      nav,
      account_email,
      account_password,
    })
    return
  }
  next()
}

/* ******************************
 * Check data and return errors or continue to Adding Classification
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
  const classification_name  = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      errors,
      title: "Add Classification",
      nav,
      classification_name,
    })
    return
  }
  next()
}


/*  **********************************
*  Add Classification Data Validation Rules
* ********************************* */
  validate.classificationRules = () => {
    return [ 
      // valid classification is required and cannot already exist in the database
    body("classification_name")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid input.") // on error this message is sent.
      .custom(async (classification_name) => {
        const classificationExists = await invModel.checkExistingClassification(classification_name)
        if (classificationExists){
          throw new Error("Classification exists. Please try with another classification name.")
        }
      }),    

    ]
  }



/* ******************************
 * Check data and return errors or continue to Adding New Vehicle
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
  const {inv_make,inv_model,inv_year,inv_description,inv_image,
  inv_thumbnail,inv_price,inv_miles,inv_color,classification_id}  = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const cList = await utilities.buildClassificationList(null)
    res.render("inventory/add-inventory", {
      errors,
      title: "Add Vehicle",
      nav,
      cList,
      inv_make,inv_model,inv_year,inv_description,inv_image,
      inv_thumbnail,inv_price,inv_miles,inv_color,classification_id,
    })
    return
  }
  next()
}

/* ******************************
 * Check data and return errors or continue when editing Vehicle
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  const {inv_id,inv_make,inv_model,inv_year,inv_description,inv_image,
  inv_thumbnail,inv_price,inv_miles,inv_color,classification_id}  = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const cList = await utilities.buildClassificationList(null)
    res.render("inventory/edit-inventory", {
      errors,
      title: "Edit "+inv_make+" "+invModel,
      nav,
      cList,
      inv_id,inv_make,inv_model,inv_year,inv_description,inv_image,
      inv_thumbnail,inv_price,inv_miles,inv_color,classification_id,
    })
    return
  }
  next()
}


/*  **********************************
*  Add Inventory Data Validation Rules
* ********************************* */
  validate.inventoryRules = () => {
    let inv_make = "";
    return [ 
      // valid classification is required and cannot already exist in the database
      body("inv_make","inv_model")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid vehicle make.") // on error this message is sent.    
      .custom(async (inv_makep ) => {
          inv_make = inv_makep
      }),
                      
      
      body("inv_model")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid vehicle model.") // on error this message is sent.
      .custom(async (inv_model ) => {
        const inventoryExists = await invModel.checkExistingInventory(inv_make,inv_model)
        if (inventoryExists){
          throw new Error("The vehicle "+inv_make+" "+inv_model+" that you are trying to add, already exist.")
        }
      }),
      

      body("inv_year")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 4 })
      .withMessage("Please provide a valid year."), // on error this message is sent.

      body("inv_description")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Not allowed empty description."), // on error this message is sent.      

      body("inv_image")
      .trim()      
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid image path."), // on error this message is sent.

      body("inv_thumbnail")
      .trim()      
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid thumbnail path."), // on error this message is sent.

      body("inv_price")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid vehicle price."), // on error this message is sent.

      body("inv_miles")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid vehicle miles."), // on error this message is sent.

      body("inv_color")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a valid vehicle color."), // on error this message is sent.

      body("classification_id")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please select a valid vehicle classification."), // on error this message is sent.

    ]
  }  


/*  **********************************
*  Update Data Validation Rules
* ********************************* */
  validate.updateRules = () => {
    return [
      // firstname is required and must be string
      body("account_firstname")
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 1 })
        .withMessage("Please provide a first name."), // on error this message is sent.
  
      // lastname is required and must be string
      body("account_lastname")
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 2 })
        .withMessage("Please provide a last name."), // on error this message is sent.
  
      // valid email is required and cannot already exist in the database
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail() // refer to validator.js docs
      .withMessage("A valid email is required."),    
  ]
  }


/* ******************************
 * Check data and return errors or continue to update
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email,account_id } = req.body
  let errors = []
  errors = validationResult(req)

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 
    
    res.render("account/update", {
      errors,
      title: "Edit Account",
      nav,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      dataLogin,
    })
    return
  }
  next()
}

/*  **********************************
*  Update Password Validation Rules
* ********************************* */
  validate.passwordRules = () => {
    return [
      // password is required and must be strong password
      body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),  
  ]
  }


/* ******************************
 * Check data and return errors or continue to update Password
 * ***************************** */
validate.checkPasswordData = async (req, res, next) => {
  const { account_id } = req.body
  let errors = []
  errors = validationResult(req)

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 
    
    res.render("account/update", {
      errors,
      title: "Edit Account",
      nav,
      account_id,
      dataLogin,
    })
    return
  }
  next()
}

module.exports = validate