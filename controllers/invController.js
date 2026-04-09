const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const invCont = {}
//const invDetail = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

// /* ***************************
//  *  Build vehicle detail by item selected
//  * ************************** */
invCont.buildDetailByInventoryId = async function (req, res, next) {
  const inv_id = req.params.inventoryId
  const data = await invModel.getDetailItemByInventoryId(inv_id)
  const detail = await utilities.buildDetailView(data)
  let nav = await utilities.getNav()
  const vehicleName = data[0].inv_year+" "+data[0].inv_make+" "+data[0].inv_model
  res.render("./inventory/detail", {
    title:  vehicleName ,
    nav,
    detail,
  })
}


// /* ***************************
//  *  Build vehicle Management View
//  * ************************** */
invCont.buildManagement = async function(req, res){
  const nav = await utilities.getNav()    
  const classificationSelect = await utilities.buildClassificationList()
  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./inventory/vmanagement", {
    title:"Vehicle Management",
    nav,
    dataLogin,
    classificationSelect,
    errors: null,    
  })
}

 
// /* ***************************
//  *  Build vehicle Add New Classification View
//  * ************************** */
// /* ***************************
invCont.addClassificationView = async function(req, res){
  const nav = await utilities.getNav()  
  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./inventory/add-classification", {
    title:"Add Classification",
    nav,
    dataLogin,
    errors: null,    
  })
}


// /* ***************************
//  *  Registering the new classification 
//  * ************************** */
// /* ***************************
invCont.addClassification = async function(req, res){
   
  const {classification_name} = req.body
  //req.flash("notice", "This is a flash message.")
  const regResult = await invModel.addClassification(
      classification_name      
    )
    const nav = await utilities.getNav() 
  
    if (regResult) {
      req.flash(
        "notice",
        `The ${classification_name} classification was successfully added.`
      )
      const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
      req.user = decoded;          // datos del usuario
      res.locals.user = decoded;   // disponible en EJS    
      const userName = req.user.account_firstname
      dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 
      res.status(201).render("inventory/vmanagement", {
        title: "Vehicle Management",
        nav,
        dataLogin,
        errors: null
      })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      res.status(501).render("inventory/add-classification", {
        title: "Add Classification",
        nav,
        errors: null
      })
    }
}


// /* ***************************
//  *  Build Inventory View
//  * ************************** */
invCont.buildInventoryView = async function (req, res, next) {    
  const cList = await utilities.buildClassificationList(null)
  let nav = await utilities.getNav() 
  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./inventory/add-inventory", {
    title:  "Add Vehicle",
    nav,
    dataLogin,
    cList,
    errors:null,
  })
}


// /* ***************************
//  *  Adding new inventory vehicle
//  * ************************** */
// /* ***************************
invCont.addInventory = async function(req, res){
   
  const {inv_make,inv_model,inv_year,inv_description,inv_image,
  inv_thumbnail,inv_price,inv_miles,inv_color,classification_id} = req.body
  
  const regResult = await invModel.addInventory(
      inv_make,inv_model,inv_year,inv_description,inv_image,
      inv_thumbnail,inv_price,inv_miles,inv_color,classification_id)
  const nav = await utilities.getNav() 
  const cList = await utilities.buildClassificationList(null)
  
    if (regResult) {
      req.flash(
        "notice",
        `The ${inv_make} ${inv_model} car was successfully added.`
      )
      const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
      req.user = decoded;          // datos del usuario
      res.locals.user = decoded;   // disponible en EJS    
      const userName = req.user.account_firstname
      dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 
      res.status(201).render("inventory/vmanagement", {
        title: "Vehicle Management",
        nav,
        dataLogin,
        classificationSelect: cList,
        errors: null
      })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      res.status(501).render("inventory/add-inventory", {
        title: "Add Vehicle",
        nav,
        cList,
        errors: null,
      })
    }
}

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
}


// /* ***************************
//  *  Editing inventory vehicle View
//  * ************************** */
// /* ***************************
invCont.editInventory = async function (req, res, next) {
  const inv_id = parseInt(req.params.inventoryId)
  let nav = await utilities.getNav()
  const itemData = await invModel.getDetailItemByInventoryId(inv_id)
  const classificationSelect = await utilities.buildClassificationList(itemData[0].classification_id)
  const itemName = `${itemData[0].inv_make} ${itemData[0].inv_model}`

  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    errors: null,
    classificationSelect: classificationSelect,
    inv_id: itemData[0].inv_id,
    inv_make: itemData[0].inv_make,
    inv_model: itemData[0].inv_model,
    inv_year: itemData[0].inv_year,
    inv_description: itemData[0].inv_description,
    inv_image: itemData[0].inv_image,
    inv_thumbnail: itemData[0].inv_thumbnail,
    inv_price: itemData[0].inv_price,
    inv_miles: itemData[0].inv_miles,
    inv_color: itemData[0].inv_color,
    classification_id: itemData[0].classification_id,
    dataLogin,
  })
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body
  const updateResult = await invModel.updateInventory(
    inv_id,  
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id
  )

  if (updateResult) {
    const itemName = updateResult.inv_make + " " + updateResult.inv_model
    req.flash("notice", `The ${itemName} was successfully updated.`)
    res.redirect("/inv/")
  } else {
    const classificationSelect = await utilities.buildClassificationList(classification_id)
    const itemName = `${inv_make} ${inv_model}`

    const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
    req.user = decoded;          // datos del usuario
    res.locals.user = decoded;   // disponible en EJS    
    const userName = req.user.account_firstname
    dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

    req.flash("notice", "Sorry, the insert failed.")
    res.status(501).render("inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect: classificationSelect,
    errors: null,
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
    dataLogin,
    })
  }
}


// /* ***************************
//  *  Deleting inventory vehicle View
//  * ************************** */
// /* ***************************
invCont.deleteInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inventoryId)
  let nav = await utilities.getNav()
  const itemData = await invModel.getDetailItemByInventoryId(inv_id)  
  const itemName = `${itemData[0].inv_make} ${itemData[0].inv_model}`

  const decoded = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);    
  req.user = decoded;          // datos del usuario
  res.locals.user = decoded;   // disponible en EJS    
  const userName = req.user.account_firstname
  dataLogin = '<a title="Click to log out" href="/account/logout"> Welcome '+userName+' LOGOUT</a>' 

  res.render("./inventory/delete-confirm", {
    title: "Delete " + itemName,
    nav,    
    inv_id: itemData[0].inv_id,
    inv_make: itemData[0].inv_make,
    inv_model: itemData[0].inv_model,
    inv_year: itemData[0].inv_year,
    inv_price: itemData[0].inv_price,
    errors: null,
    dataLogin,
  })
}


/* ***************************
 *  Delete Inventory Data
 * ************************** */
invCont.deleteInventory = async function (req, res, next) {
  //const inv_id = parseInt(req.params.inventoryId)
  const {
    inv_id = parseInt(req.params.inventoryId),
    inv_make,
    inv_model,
  } = req.body

  let nav = await utilities.getNav()
  const deleteResult = await invModel.deleteInventoryItem(inv_id,)

  if (deleteResult) {
    const itemName = `${inv_make} ${inv_model}`
    req.flash("notice", `The ${itemName} was deleted successfully.`)
    res.redirect("/inv/")
  } else {    
    const itemName = `${inv_make} ${inv_model}`
    req.flash("notice", "Sorry, the insert failed.")
    res.status(501).render("inventory/delete-confirmation", {
    title: "Delete " + itemName,
    nav,
    errors: null,
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_price,
    })
  }
}


 module.exports = invCont