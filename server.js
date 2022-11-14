import express from 'express'
const app = express()

import dotenv from 'dotenv'
dotenv.config();

// Allows to not have to use try/catch in controllers:
import 'express-async-errors'
import morgan from 'morgan';

// DB and authenticateUser
import connectDB from './db/connect.js'

// Routers
import authRouter from './routes/authRoutes.js'
import jobsRouter from './routes/jobsRoutes.js'

//Middleware:
import errorHandlerMiddleware from './middleware/error-handler.js'
import notFoundMiddleware from './middleware/not-found.js'
import authenticateUser from './middleware/auth.js'

// for dev, use morgan to show more details on HTTP req/res
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
}
// Info passed back to use will be routed through express json middleware:
app.use(express.json())

app.get('/api/v1', (req, res) => {
    res.json({ msg: "welcome" })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/jobs', authenticateUser, jobsRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL)
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}...`)
        })
    } catch (error) {
        console.log(error)
    }
}

start()