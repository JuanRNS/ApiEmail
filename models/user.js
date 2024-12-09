const mogoose = require('mongoose');

const userSchema = new mogoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    passwordConfirm: {
        type: String,
        required: true
    }
   
})

const User = mogoose.model('User', userSchema);

module.exports = User;