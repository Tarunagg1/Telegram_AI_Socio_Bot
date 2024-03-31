const mongoose = require('mongoose');


async function connect() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/bot');
        console.log('connected to databsee');
    } catch (error) {
        console.log(error);
    }
}

module.exports = connect;