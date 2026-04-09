const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async function(req, res){
  const nav = await utilities.getNav()  
  const dataLogin = await utilities.getDataLogin()  
  res.render("index", {title: "Home", nav, dataLogin,})
}

baseController.errorLink = async function(req, res){
  const nav = await utilities.getNav()  
  //const dataLogin = await utilities.getDataLogin()  
  res.render("index", {title: "Home", nav, dataLogin,})
}

module.exports = baseController