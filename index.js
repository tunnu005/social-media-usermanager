import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import http from 'http'
import dotenv from 'dotenv'
import ConnectDB from './connectdb.js'
// import { login } from './services.js'
import auth from './auth.js'
import multer from 'multer'
import os from 'os'
import cluster from 'cluster'
import cron from "node-cron"

import {getUserProfile,getuser, unfollowUser,search,followUser, EditProfile } from './services.js'


const CPUnumbers = os.cpus().length

console.log("CPU numbers : ",CPUnumbers)

// if(cluster.isMaster){
//     console.log(`Master process ${process.pid} is running `)
// }

// cron.schedule("*/10 * * * * *",()=>{
//     console.log("Cron job is running every 10 seconds")
//     // const users = await User.find({})
//     // console.log(users)
// })

dotenv.config();
ConnectDB()

const app = express()

app.use(helmet())
app.use(express.json({limit:'10mb'}))
app.use(cookieParser())


app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'http://localhost:5174',
        'http://localhost:5173',
        'https://buzzzy.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.get('/', (req, res) => {
    res.send('Hello this is UserManagment server!');
});

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/users/profile/:userId', getUserProfile);
app.get('/api/users/user',auth,getuser)
app.put('/api/users/edit', auth, upload.single('file'),EditProfile);
app.get('/api/users/search', search)
app.post('/api/users/follow',followUser)
app.post('/api/users/unfollow',unfollowUser)


const PORT = process.env.PORT || 3003;
const server = http.createServer(app);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});
