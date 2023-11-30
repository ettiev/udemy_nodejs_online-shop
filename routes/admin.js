const path = require("path");
const { body } = require("express-validator");

const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);
router.post(
    '/add-product', 
    isAuth, 
    [
        body('title',
            "Please enter a valid title.")
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price',
            "Please enter a valid price.")
                .isFloat(),
        body('description',
            "Please enter a valid product description - of between 20 and 400 characters.")
            .isLength({ min: 20, max: 400 })
            .trim()
    ],
    adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post(
    '/edit-product',
    isAuth, 
    [
        body('title',
            "Please enter a valid title.")
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price',
            "Please enter a valid price.")
                .isFloat(),
        body('description',
            "Please enter a valid product description - of between 20 and 400 characters.")
            .trim()
            .isLength({ min: 20, max: 400 })
    ],
    adminController.postEditProduct);

router.get('/products', isAuth, adminController.getProducts);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
