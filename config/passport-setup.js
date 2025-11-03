const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const keys = require('./keys')

passport.use(
    new GoogleStrategy({
    // options for GoogleStrategy
    clientID: keys.clientID,
    clientSecret: keys.clientSecret
}), () => {
    // passport callback function


})


