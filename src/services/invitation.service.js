import { InvitationModel } from '*/models/invitation.model'
import { UserModel } from '*/models/user.model'
import { BoardModel } from '*/models/board.model'
import { pickUser } from '*/utilities/transform'
 
const createNewBoardInvitation = async (data, userId) => {
 try {
   // Người đi mời: chính là người đang request, nên chúng ta tìm theo id lấy từ token
   const inviter = await UserModel.findOneById(userId)
   // Người được mời: lấy từ form phía client
   const invitee = await UserModel.findOneByEmail(data.inviteeEmail)
 
   const board = await BoardModel.findOneById(data.boardId)
   if (!invitee || !inviter || !board) {
     throw new Error('Inviter, invitee or board not found!')
   }
 
   const invitation = {
     inviterId: userId,
     inviteeId: invitee._id.toString(),
     type: InvitationModel.INVITATION_TYPES.BOARD_INVITATION,
     boardInvitation: {
       boardId: data.boardId,
       status: InvitationModel.BOARD_INVITATION_STATUS.PENDING
     }
   }
 
   const createdInvitation = await InvitationModel.createNewBoardInvitation(invitation)
   const getInvitation = await InvitationModel.findOneById(createdInvitation.insertedId.toString())
 
   const resData = {
     ...getInvitation,
     inviter: pickUser(inviter),
     invitee: pickUser(invitee),
     board: board
   }

   console.log('resdata',resData)
 
   return resData
 } catch (error) {
   throw new Error(error)
 }
}
 
const getInvitations = async (userId) => {
    try {
      const getInvitations = await InvitationModel.findByUser(userId)
        
      console.log('getInvitations',getInvitations)
      const resInvitations = getInvitations.map(i => {
        return {
          ...i,
          inviter: i.inviter[0] || {},
          invitee: i.invitee[0] || {},
          board: i.board[0] || {}
        }
      })
    
      return resInvitations
    } catch (error) {
      throw new Error(error)
    }
   }
    
   
   

export const InvitationService = {
 createNewBoardInvitation,
 getInvitations
}
 
 

