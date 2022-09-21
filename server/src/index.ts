require('dotenv').config()

import "reflect-metadata"
import mongoose from "mongoose"
import express from "express"
import MongoStore from "connect-mongo"
import session from "express-session"
import { createConnection } from "typeorm"
import { buildSchema } from "type-graphql"
import { ApolloServer } from "apollo-server-express"
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'

import { User } from "./entities/User"
import { Post } from "./entities/Post"
import { HelloResolve } from "./resolvers/hello"
import { UserResolve } from "./resolvers/user"
import { COOKIE_NAME, __prod__ } from "./constants"
import { Context } from "./types/Context"

const main = async () => {
    await createConnection({
        type: 'postgres',
        database: 'reddit',
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: true,
        synchronize: true,
        entities: [User, Post],
    })

    const app = express()

    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME}:${process.env.SESSION_DB_PASSWORD}@reddit.2h7yb2j.mongodb.net/reddit`

    await mongoose.connect(mongoUrl, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })

    app.use(session({
        name: COOKIE_NAME,
        store: MongoStore.create({ mongoUrl }),
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: __prod__,
            sameSite: 'lax',
        },
        secret: process.env.SESSION_SECRET_DEV_PROD as string,
        saveUninitialized: false,
        resave: false

    }))

    const apolloServer = new ApolloServer({
        schema: await buildSchema({ resolvers: [HelloResolve, UserResolve], validate: false }),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
        context: ({ req, res }): Context => ({ req, res })
    })

    await apolloServer.start()

    apolloServer.applyMiddleware({ app, cors: false })


    const PORT = process.env.PORT || 4000

    app.listen(PORT, () => console.log(`started port ${PORT}`)
    )


}

main().catch((err) => console.log(err)
)
