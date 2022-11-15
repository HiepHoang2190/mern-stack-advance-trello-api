import express from 'express'
import { BoardController } from '*/controllers/board.controller'
import { BoardValidation } from '*/validations/board.validation'
import {AuthMiddleware} from '*/middlewares/auth.middleware'

const router = express.Router()

router.route('/')
  // .get((req, res) => console.log('GET list of boards'))
  .post(AuthMiddleware.isAuthorized,BoardValidation.createNew, BoardController.createNew)

router.route('/:id')
  .get(AuthMiddleware.isAuthorized,BoardController.getFullBoard)
  .put(AuthMiddleware.isAuthorized,BoardValidation.update, BoardController.update)

export const boardRoutes = router
