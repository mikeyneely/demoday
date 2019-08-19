// config/database.js
module.exports = {

    'url' : `mongodb+srv://${process.env.userName}:${process.env.password}@crud1-68o08.mongodb.net/${process.env.database}?retryWrites=true&w=majority',`
    'dbName': 'userInfo'
};
