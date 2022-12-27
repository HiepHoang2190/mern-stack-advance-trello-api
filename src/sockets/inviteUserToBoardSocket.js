/**
 * 
 * @param {*} socket from socket.io library
 */


export const inviteUserToBoardSocket = (socket) => {
    socket.on('c_user_invited_to_board', (invitation) => {
        // console.log('invitation',invitation)
        
        // Emit  ngược lại một sự kiện có tên là "s_user_invited_to_board" về cho client khác (ngoại trừ chính thằng user gửi lên)
  
        socket.broadcast.emit('s_user_invited_to_board',invitation)
      })
}