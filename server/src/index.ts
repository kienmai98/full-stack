require('dotenv').config()

import "reflect-metadata"
import express from "express"
import { createConnection } from "typeorm"

const main = async () => {
    await createConnection({
        type: 'postgres',
        database: 'reddit',
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        logging: true,
        synchronize: true,
    })
}