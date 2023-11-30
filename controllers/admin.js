const mongoose = require("mongoose");
const fileHelper = require("../util/file");

const Product = require("../models/product");

const { validationResult } = require("express-validator");

const ITEMS_PER_PAGE = 4;

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        docTitle: "Add Product", 
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        product: {
            _id: "", 
            title: "",
            imageUrl: "",
            price: "",
            description: ""
        },
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            path: '/admin/add-product',
            docTitle: 'Add Product',
            editing: false,
            hasError: true,
            errorMessage: "Attached file is not a compatible image type!",
            product: {
                title: product.title,
                price: product.price,
                description: product.description
            },
            validationErrors: []
          });    
    }

    const imageUrl = image.path;

    const product = new Product({
        //_id: new mongoose.Types.ObjectId("650d62f458a9a10ea8e87148"), // casue a database error to test error handling
        title: title, 
        price: price, 
        description: description, 
        imageUrl: imageUrl,
        userId: req.user._id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            path: '/admin/add-product',
            docTitle: 'Add Product',
            editing: false,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                title: product.title,
                price: product.price,
                description: product.description
            },
            validationErrors: errors.array()
          });
    }

    product
        .save()
        .then(result => {
            //console.log(result);
            console.log("Product Created!");
            res.redirect("/admin/products");
        }).catch(err => {
            // return res.status(500).render('admin/edit-product', {
            //     path: '/admin/add-product',
            //     docTitle: 'Add Product',
            //     editing: false,
            //     hasError: true,
            //     errorMessage: "Database opperation failed, please try again!",
            //     product: {
            //         title: product.title,
            //         imageUrl: product.imageUrl,
            //         price: product.price,
            //         description: product.description
            //     },
            //     validationErrors: []
            //   });
            
            //res.redirect('/500');

            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    
    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            docTitle: "Edit Product", 
            path: "/admin/edit-product",
            editing: editMode,
            hasError: false,
            errorMessage: null,
            product: product,
            validationErrors: []        
        });
    }).catch( err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDesc = req.body.description;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            path: '/admin/edit-product',
            docTitle: 'Edit Product',
            editing: true,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                _id: prodId, 
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc
            },
            validationErrors: errors.array()
          });
    }

    Product.findById(prodId).then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect("/")
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDesc;
        if (image) {
           fileHelper.deleteFile(product.imageUrl);
           product.imageUrl = image.path; 
        }
        return product.save()
        .then(result => {
            console.log("Updated Product!");
            res.redirect("/admin/products");
        });
    })
    .catch( err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page;
    let totalItems;
    
    Product.find({userId: req.user._id}).countDocuments()
    .then(numProducts => {
        totalItems = numProducts;
        return  Product.find({userId: req.user._id})
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
    }).then(products => {
       res.render('admin/products', {
            prods: products, 
            docTitle: "Admin Products", 
            path: "/admin/products",
            currentPage: page,
            hasNextPage: (ITEMS_PER_PAGE * page < totalItems),
            hasPreviousPage: (page > 1),
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
        }) 
    }).catch( err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};    

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return next(new Error("Product not found!"));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id:prodId, userId: req.user._id});
    }).then(() => {
        res.status(200).json({
            message: "Success!"
        });
    }).catch( err => {
        res.status(500).json({
            message: "Deleting product failed!"
        })
    });
};