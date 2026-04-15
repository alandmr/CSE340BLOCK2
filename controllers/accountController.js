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
    if (!req.cookies || !req.cookies.SessionMng){
      req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`)
      res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null
      })
    }else{
      req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}.`)
      res.status(201).redirect("/account")
    }
    
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
    let clientAdminOptions = ''
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>'    
    
    if (req.user.account_type == "Client"){   
      clientAdminOptions = '<a href="/account/update/'+req.user.account_id+'">Edit Account Information</a>'    
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
      // Hash the value for SessionMng
      let hashedSessionMng
      try {
            // regular password and cost (salt is generated automatically)
            hashedSessionMng = await bcrypt.hashSync("true", 10)
          } catch (error) {
            req.flash("notice", 'Sorry, there was an error loggin session.')
            res.status(500).redirect("account/")
          }
      
      // Creating SessionMng Cookie
      res.cookie("SessionMng", hashedSessionMng, {
        httpOnly: true,
        maxAge: 3600 * 1000 , 
      })

      clientAdminOptions += '<a href="/account/register/">Add New User</a>' 
      clientAdminOptions += '<a href="/account/manage/">Manage Accounts</a>' 
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
  
  res.clearCookie('jwt')
  res.clearCookie('SessionMng')
  return res.redirect('/')
  
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
      if (!req.cookies || !req.cookies.SessionMng){
        res.clearCookie('jwt');    
        const accessToken = jwt.sign(updateResult, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
        if(process.env.NODE_ENV === 'development') {
          res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
        } else {
          res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
        }
      }
      
      req.flash("notice", `Congratulations, your information has been updated.`)
      res.clearCookie('sessionMng');    
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

/* ****************************************
*  Deliver account manage view
* *************************************** */
async function accountManageView(req, res, next) {
  let nav = await utilities.getNav()
  const accountResult = await accountModel.getAccount()
  let dataLogin = ""  
  let dataTable = '<thead>';
  
  try {
    const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 
      
    dataTable += '<tr><th>First Name</th><th>Last Name</th><td>&nbsp;</td><td>&nbsp;</td></tr>'; 
    dataTable += '</thead>'; 
    // Set up the table body 
    dataTable += '<tbody>'; 
    // Iterate over all vehicles in the array and put each in a row 
    accountResult.rows.forEach((element) => { 
      console.log(element.account_id + ", " + element.account_firstname+", "+element.account_lastname); 
      dataTable += `<tr><td>${element.account_firstname}</td><td>${element.account_lastname}</td>`; 
      dataTable += `<td><a href='/account/update/${element.account_id}' title='Click to update'>Modify</a></td>`; 
      dataTable += `<td><a href='/account/delete/${element.account_id}' title='Click to delete'>Delete</a></td></tr>`; 
    }) 
    dataTable += '</tbody>'; 
    
    res.render("./account/manage", {
      title:"Manage Accounts",
      nav,
      errors: null, 
      dataLogin,
      dataTable,
    })   
  }catch (err) {
    console.error('Error:', err.message);
    res.locals.loggedIn = false;
    return res.redirect("/account/")
  }  
}

// /* ***************************
//  *  Deleting Account View
//  * ************************** */
// /* ***************************
async function deleteAccountView (req, res, next) {
  const account_id = parseInt(req.params.accountId)
  let nav = await utilities.getNav()
  const itemData = await accountModel.getAccountById(account_id)    

  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  const dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./account/delete-acc-confirm", {
    title: "Delete Account",
    nav,    
    account_id: itemData.account_id,
    account_firstname: itemData.account_firstname,
    account_lastname: itemData.account_lastname,
    account_email: itemData.account_email,    
    errors: null,
    dataLogin,
  })
}

/* ***************************
 *  Delete Account
 * ************************** */
  async function deleteAccount(req, res, next) {  
  const {
    account_id = parseInt(req.params.accountId),
    account_firstname,
    account_lastname,
    account_email
  } = req.body

  let nav = await utilities.getNav()
  const deleteResult = await accountModel.deleteAccount(account_id)
  const accountName = `${account_firstname} ${account_lastname}`
  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  const dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  if (deleteResult) {    
    req.flash("notice", `The ${accountName} account was deleted successfully.`)
    res.redirect("/account/")
  } else {        
    req.flash("notice", "Sorry, the insert failed.")
    res.status(501).res.render("./account/delete-acc-confirm", {
      title: "Delete Account",
      nav,    
      account_id: account_id,
      account_firstname: account_firstname,
      account_lastname: account_lastname,
      account_email: account_email,    
      errors: null,
      dataLogin,
    })
  }
}


module.exports = { buildLogin, buildRegister,registerAccount,accountLogin,accountLoginView, 
  accountLogout, updateView, updateAccount, updatePassword, accountManageView, deleteAccountView,deleteAccount}




