const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav()
  let dataLogin = await utilities.getDataLogin()
  //req.flash("notice", "This is a flash message.")
  res.render("./account/login", {
    title: "Login",    
    nav,
    dataLogin,
    errors: null,
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav()
  res.render("./account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body
  
  // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing the registration.')
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null
    })
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
      req.flash("message notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

/* ****************************************
*  Deliver account view
* *************************************** */
async function accountLoginView(req, res, next) {
  let nav = await utilities.getNav()
  const token = req.cookies.jwt
  let dataLogin = '<a title="Click to log in" href="/account/login">My Account</a>'   
    

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    let clientAdminOptions = '<a href="/account/update/'+req.user.account_id+'">Edit Account Information</a>' 
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>'    
    
    if (req.user.account_type == "Client"){
      res.render("./account/account", {
      title:"Account Managemet",
      nav,
      errors: null, 
      redirectTo: "../inv",
      delay: 1500,
      dataLogin,
      userName,
      clientAdminOptions,
    })
    }else{
      clientAdminOptions += '<h3>Inventory Management</h3>'
      clientAdminOptions += '<a href="../inv">Manage Inventory</a>'
      res.render("./account/account", {
      title:"Account Managemet",
      nav,
      errors: null, 
      dataLogin,
      userName,
      clientAdminOptions,
    })
    }
    
    

  } catch (err) {
    console.error('JWT inválido:', err.message);
    res.locals.loggedIn = false;
    res.render("./account/account", {
      title:"You're logged in",
      nav,
      errors: null, 
      redirectTo: "../inv",
      delay: 1500,
      dataLogin,
    })
  }

}


/* ****************************************
 *  Process to logout request
 * ************************************ */
async function accountLogout(req, res) {
  
  res.clearCookie('jwt');
  return res.redirect('/');
  
}



/* ****************************************
*  Deliver update view
* *************************************** */
async function updateView(req, res, next) {
  let nav = await utilities.getNav()
  const account_id = parseInt(req.params.userId)  
  const itemData = await accountModel.getAccountById(account_id)
  let dataLogin = ""  
  

  if (itemData){
      try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
      req.user = decoded;          // datos del usuario
      res.locals.user = decoded;   // disponible en EJS    
      const userName = req.user.account_firstname
      dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>'  
      
      res.render("./account/update", {
        title:"Edit Account",
        nav,
        errors: null, 
        dataLogin,
        account_id:itemData.account_id,
        account_firstname:itemData.account_firstname,                
        account_lastname:itemData.account_lastname,
        account_email:itemData.account_email,
      })   
    }catch (err) {
      console.error('JWT inválido:', err.message);
      res.locals.loggedIn = false;
      return res.redirect("/account/")
    }
  }else{
    //
  }
  
}


/* ***************************
 *  Update Account Data
 * ************************** */
async function updateAccount (req, res, next) {
  let nav = await utilities.getNav()
  const {
    account_id,
    account_firstname,
    account_lastname,
    account_email
  } = req.body
  const updateResult = await accountModel.updateAccount(
    account_id,  
    account_firstname,
    account_lastname,
    account_email
  )

  if (updateResult) {  
      res.clearCookie('jwt');    
      const accessToken = jwt.sign(updateResult, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      req.flash("notice", `Congratulations, your information has been updated.`)
      res.redirect("/account/")
  } else {        
    req.flash("notice", "Sorry, the udpate failed.")
    const dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+account_id+' LOGOUT</a>'
    res.status(501).render("account/update/"+account_id, {
    title: "Edit Account ",
    nav,
    errors: null,
    account_id,
    account_firstname,
    account_lastname,
    account_email,
    dataLogin
    })
  }
}

/* ***************************
 *  Update Password Data
 * ************************** */
async function updatePassword (req, res, next) {
  let nav = await utilities.getNav()
  const {
    account_id,
    account_password
  } = req.body

  // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10)
  } catch (error) {
    const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>'
    
    req.flash("notice", 'Sorry, there was an error updating password.')
    res.status(500).render("account/update", {
      title: "Edit Account",
      nav,
      errors: null,
      dataLogin,
    })
  }

  const updateResult = await accountModel.updatePassword(
    account_id,  
    hashedPassword
  )

  if (updateResult) {  
      res.clearCookie('jwt');    
      const accessToken = jwt.sign(updateResult, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      req.flash("notice", `Congratulations, your Password has been updated.`)
      res.redirect("/account/")
  } else {        
    req.flash("notice", "Sorry, the udpate failed Password.")
    const dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+account_id+' LOGOUT</a>'
    res.status(501).render("account/update/"+account_id, {
    title: "Edit Account ",
    nav,
    errors: null,
    account_id,
    dataLogin
    })
  }
}


module.exports = { buildLogin, buildRegister,registerAccount, 
  accountLogin,accountLoginView, accountLogout, updateView, updateAccount, updatePassword}




