const fs = require("fs");
const path = require("path");
// const stripe = require("stripe")(process.env.STRIPE_KEY )

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 4;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page;
    let totalItems;
    
    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        return  Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
    }).then(
        products => {
            res.render('shop/product-list', {
                docTitle: "Products", 
                path: "/products",
                prods: products,
                currentPage: page,
                hasNextPage: (ITEMS_PER_PAGE * page < totalItems),
                hasPreviousPage: (page > 1),
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)                
            });
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then((product) => {
        res.render('shop/product-detail', {
            docTitle: product.title + " - Details", 
            path: "/products",
            product: product
        })
    }).catch((err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }));
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page;
    let totalItems;
    
    Product.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        return  Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
    }).then(
        products => {
            res.render('shop/index', {
                docTitle: "Home", 
                path: "/",
                prods: products,
                currentPage: page,
                hasNextPage: (ITEMS_PER_PAGE * page < totalItems),
                hasPreviousPage: (page > 1),
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)                
            });
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                docTitle: "Your Cart", 
                path: "/cart",
                products: products    
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId).then(product => {
            return req.user.addToCart(product);
        }).then(result => {
            //console.log(result);
            res.redirect("/cart");
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
        .then(result => {
            res.redirect("/cart");    
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price
            })

        //     return stripe.checkout.session.create({
        //         payment_menthod_types: ['card'],
        //         line_items: products.map(p => {
        //             return {
        //                 name: p.productId.title,
        //                 description: p.product.description,
        //                 amount: p.productId.price * 100,
        //                 currency: "usd",
        //                 quantity: p.quantity
        //             }
        //         }),
        //         success_url: req.protocol + "://" + req.get('host') + "/checkout/success",  // e.g. host => http://localhost:3000
        //         cancel_url: req.protocol + "://" + req.get('host') + "/checkout/cancel"
        //     });
        // }).then(session => {    
            res.render('shop/checkout', {
                docTitle: "Checkout", 
                path: "/checkout",
                products: products,
                totalSum: total,
                sessionId: "00000"    //session.id   
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}};
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        }).then(
            res.redirect('/orders')
        ).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {quantity: i.quantity, product: {...i.productId._doc}};
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        }).then(
            res.redirect('/orders')
        ).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ "user.userId": req.user._id })
    .then(orders => {
        res.render('shop/orders', {
            docTitle: "Your Orders", 
            path: "/orders",
            orders: orders
        });     
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if (!order) {
            return next(new Error("No order found!"));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error("Unauthorized action!")); 
        }
        const invoiceName = "invoice-" + orderId + ".pdf";
        const invoicePath = path.join("data", "invoices", invoiceName);
        
        const pdfDoc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline; filename='" + invoiceName + "'");
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text("Invoice", {
            underline: true
        });
        pdfDoc.fontSize(20).text("---------------------------------");
        let totalPrice = 0;
        order.products.forEach(prod => {
            let prodTotal = prod.product.price * prod.quantity; 
            totalPrice += prodTotal;
            pdfDoc.fontSize(14).text(prod.product.title + " - " + prod.quantity + " x $" + prod.product.price + " [$" + prodTotal + "]")
        })
        pdfDoc.text("---------------------------------");
        pdfDoc.fontSize(20).text("Total: $" + totalPrice);

        pdfDoc.end();

        // fs.readFile(invoicePath, (err, data) => {        // First load the whole file into the server opposed to "streaming" 
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader("Content-Type", "application/pdf");
        //     res.setHeader("Content-Disposition", "inline; filename='" + invoiceName + "'");
        //     //res.setHeader("Content-Disposition", "attachment; filename='" + invoiceName + "'");  // To download the file
        //     res.send(data);
        // });

        // const file = fs.createReadStream(invoicePath);
        // // set Headers
        // file.pipe(res);     
    })
    .catch(
        err => next(err)
    )
    
};