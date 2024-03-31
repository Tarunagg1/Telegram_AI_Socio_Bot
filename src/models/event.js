const mongoose = require('mongoose');


const eventSchema = mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    tgId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});


const eventModel = mongoose.model('event', eventSchema);



module.exports = eventModel;
