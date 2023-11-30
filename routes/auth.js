const express = require("express");
const { check, body } = require("express-validator")

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get('/signup', authController.getSignup);
router.post(
    '/signup', 
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a vaild email!")
            .custom((value, {req} )=> {
                // if (value === "test3@test.com") {
                //     throw new Error("This email address is forbidden!")
                // }
                // return true;
                return User.findOne({email: value})  //async validator that needs to get info back from database
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject(
                                "E-mail already registered! Login with a valid password."
                                );    
                        }
                });
            })
            .normalizeEmail(),
        body('password',
            'Please enter a password with only letters and numbers, that is at least 6 characters long.'
            )
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim(),        // alternative format than above
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords entered need to match!");
                }
                return true;
            })
            .trim()
    ], 
    authController.postSignup);

router.get('/login', authController.getLogin);
router.post('/login',
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a vaild email!")
            .normalizeEmail(),
        body('password',
            'Please enter a valid password, that is at least 6 characters long.')
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim()       
    ], 
    authController.postLogin);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

router.post('/logout', authController.postLogout);

module.exports = router;
