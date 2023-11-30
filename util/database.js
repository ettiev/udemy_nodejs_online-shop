const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect("mongodb+srv://ettiev:awratqo5gLyGkEh5@nodejs-shop.hxqr4qd.mongodb.net/shop?retryWrites=true&w=majority")
    .then(client => {
        console.log("Connected to Database.");
        _db = client.db();
        callback();
    })
    .catch( err => {
        console.log(err);
        throw err;
    }) 
};

const getDb = () => {
    if (_db) {
        return _db    
    }
    throw "No database found!";
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

// password: awratqo5gLyGkEh5