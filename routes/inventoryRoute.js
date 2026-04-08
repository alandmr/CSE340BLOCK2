// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const regValidate = require('../utilities/account-validation')

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildDetailByInventoryId));
router.get("/inv", utilities.handleErrors(invController.buildManagement));
router.get("/add-classification", utilities.handleErrors(invController.addClassificationView));
router.post("/add-classification", regValidate.classificationRules(),regValidate.checkClassificationData,
utilities.handleErrors(invController.addClassification));
router.get("/add-inventory", utilities.handleErrors(invController.buildInventoryView));
router.post("/add-inventory", regValidate.inventoryRules(),regValidate.checkInventoryData,
utilities.handleErrors(invController.addInventory));
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))
router.get("/edit/:inventoryId", utilities.handleErrors(invController.editInventory));
router.post("/update/", invController.updateInventory)

module.exports = router;