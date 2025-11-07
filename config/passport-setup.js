const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./keys');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// accesstoken token given for getting info
// refreshToken get a new access token without the user's interaction.

// passport.serializeUser((user, done) => {
//     done(null, user.ID);
// });

// passport.deserializeUser((id, done) => {
//     User.findById(id).then((user) => {
//         done(null, user);
//     });
// });

passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret,
        callbackURL: '/auth/google/redirect'
    }, async (accessToken, refreshToken, profile, done) => {
        // passport callback function
        console.log('passport callback function fired');
        
        let user = await prisma.user.findUnique({
            where: { Email: profile.emails[0].value }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    Alias: profile.displayName,
                    Email: profile.emails[0].value,
                    Password: 'password123',
                    Online: true,
                    CreationDate: new Date(),
                }
            });
            console.log('Created User:', user);
            done(null, user);
        }
        else
        {
            console.log('user is: ', user);
            done(null, user);
        }
            
        // console.log(profile.em)

        // done();
    })
);