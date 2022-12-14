import express from 'express'
import { InvitationController } from '*/controllers/invitation.controller'
import { InvitationValidation } from '*/validations/invitation.validation'
import { AuthMiddleware } from '*/middlewares/auth.middleware'
 
const router = express.Router()
 
// Create board invitation
router.route('/board')
 .post(AuthMiddleware.isAuthorized, InvitationValidation.createNewBoardInvitation, InvitationController.createNewBoardInvitation)
 
export const invitationRoutes = router
 

