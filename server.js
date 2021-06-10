const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// set startic folder
app.use(express.static(path.join(__dirname, 'public')))
const botName = 'DisKus Bot '

//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        //welcome current user (single user connection)
        socket.emit('message', formatMessage(botName, ' Welcome To DisKus'))

        //broadcast when a user connects (to everbody except user connection)
        socket.broadcast.to(user.room).emit(
            'message',
            formatMessage(botName, ` ${user.username } has joined the chat`)
        )

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    // listen for chatmessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit(
            'message', 
            formatMessage(user.username, msg))
    })

    //runs when user disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        //(to every one)
        if(user){
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, ` ${user.username} has left the chat`)
            )

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
})

const PORT = 3000 || process.env.PORT
server.listen(PORT, () => console.log(`server running on port ${PORT}`))