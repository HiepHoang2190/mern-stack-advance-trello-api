import express from 'express'
import cors from 'cors'
import { corsOptions } from '*/config/cors'
import { connectDB } from '*/config/mongodb'
import { env } from '*/config/environtment'
import { apiV1 } from '*/routes/v1'
import cookieParser from 'cookie-parser'

import socketIo from 'socket.io'
import http from 'http'

connectDB()
  .then(() => console.log('Connected successfully to database server!'))
  .then(() => bootServer())
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

const bootServer = () => {
  const app = express()
  
  // Fix cái vụ Cache from disk của ExpressJS
 app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})


  app.use(cookieParser())

  app.use(cors(corsOptions))

  // Enable req.body data
  app.use(express.json())

  // Use APIs v1
  app.use('/v1', apiV1)

  //  For real-time

  const server = http.createServer(app)
  const io = socketIo(server, {cors: corsOptions})
  io.on('connection', (socket) => {
    // console.log('New client: ', socket.id)

    // socket.on('disconnect', () => {
    //   console.log('Client disconnected')
    // })

    socket.on('c_user_invited_to_board', (invitation) => {
      // console.log('invitation',invitation)
      
      // Emit  ngược lại một sự kiện có tên là "s_user_invited_to_board" về cho client khác (ngoại trừ chính thằng user gửi lên)

      socket.broadcast.emit('s_user_invited_to_board',invitation)
    })
  })

  // app.listen(env.APP_PORT, env.APP_HOST, () => {
  //   console.log(`Hello trungquandev, I'm running at ${env.APP_HOST}:${env.APP_PORT}/`)
  // })

  // Support heroku deploy
  server.listen(process.env.PORT || env.APP_PORT, () => {
    console.log(`Hello trungquandev, I'm running at port: ${process.env.PORT || env.APP_PORT}/`)
  })
}
