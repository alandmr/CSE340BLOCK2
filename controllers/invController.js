const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

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
  //req.flash("notice", "This is a flash message.")

  res.render("./inventory/vmanagement", {
    title:"Vehicle Management",
    nav,
    errors: null,    
  })
}

 
// /* ***************************
//  *  Build vehicle Add New Classification View
//  * ************************** */
// /* ***************************
invCont.addClassificationView = async function(req, res){
  const nav = await utilities.getNav()  
  //req.flash("notice", "This is a flash message.")

  res.render("./inventory/add-classification", {
    title:"Add Classification",
    nav,
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
      res.status(201).render("inventory/vmanagement", {
        title: "Vehicle Management",
        nav,
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
  res.render("./inventory/add-inventory", {
    title:  "Add Vehicle",
    nav,
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
      res.status(201).render("inventory/vmanagement", {
        title: "Vehicle Management",
        nav,
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


 module.exports = invCont