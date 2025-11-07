import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import keys from './keys';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret,
        callbackURL: '/auth/google/redirect'
    }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        // passport callback function
        console.log('passport callback function fired');
        
        // let user = await prisma.user.findUnique({
        //     where: { Email: profile.emails?.[0].value }
        // });
        
        // if (!user) {
        //     user = await prisma.user.create({
        //         data: {
        //             Alias: profile.displayName || 'User',
        //             Email: profile.emails?.[0].value || '',
        //             Password: 'password123',
        //             Online: true,
        //             CreationDate: new Date(),
        //         }
        //     });
        //     console.log('Created User:', user);
        //     done(null, user);
        // }
        // else
        // {
        //     console.log('user is: ', user);
        //     done(null, user);
        // }
    })
);