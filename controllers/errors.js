exports.getPageNotFound = (req, res, next) => {
    res.status(404).render("page-not-found", {
        docTitle: "Page not found!", 
        path: "/404",
        isAuthenticated: req.session.isLoggedIn 
    });
};

exports.get500 = (req, res, next) => {
    res.status(404).render("page-error-500", {
        docTitle: "Error Occured!", 
        path: "/500",
        isAuthenticated: req.session.isLoggedIn 
    })  
}