import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '*/config/mongodb'
import { ColumnModel } from './column.model'
import { CardModel } from './card.model'
import { pagingSkipValue} from '*/utilities/algorithms'
// Define Board collection
const boardCollectionName = 'boards'
const boardCollectionSchema = Joi.object({
  title: Joi.string().required().min(1).max(50).trim(),

  description: Joi.string().required().min(3).max(256).trim(),
  ownerIds: Joi.array().items(Joi.string()).default([]),
  memberIds: Joi.array().items(Joi.string()).default([]),

  columnOrder: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().timestamp().default(Date.now()),
  updatedAt: Joi.date().timestamp().default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id','createdAt']

const validateSchema = async (data) => {
  return await boardCollectionSchema.validateAsync(data, { abortEarly: false })
}

const findOneById = async (id) => {
  try {
    const result = await getDB().collection(boardCollectionName).findOne({ _id: ObjectId(id) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async (data) => {
  try {
    const value = await validateSchema(data)
    const result = await getDB().collection(boardCollectionName).insertOne(value)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (id, data) => {
  try {
    const updateData = { ...data }

    Object.keys(updateData).forEach(fieldName => {
      if(INVALID_UPDATE_FIELDS.includes(fieldName)) {
          delete updateData[fieldName]
      }
    })

    const result = await getDB().collection(boardCollectionName).findOneAndUpdate(
      { _id: ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * @param {string} boardId
 * @param {string} columnId
 */
const pushColumnOrder = async (boardId, columnId) => {
  try {
    const result = await getDB().collection(boardCollectionName).findOneAndUpdate(
      { _id: ObjectId(boardId) },
      { $push: { columnOrder: columnId } },
      { returnDocument: 'after' }
    )

    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

const getFullBoard = async (boardId) => {
  try {
    const result = await getDB().collection(boardCollectionName).aggregate([
      { $match: {
        _id: ObjectId(boardId),
        _destroy: false
      } },
      { $lookup: {
        from: ColumnModel.columnCollectionName,
        localField: '_id',
        foreignField: 'boardId',
        as: 'columns'
      } },
      { $lookup: {
        from: CardModel.cardCollectionName,
        localField: '_id',
        foreignField: 'boardId',
        as: 'cards'
      } }
    ]).toArray()

    return result[0] || {}
  } catch (error) {
    throw new Error(error)
  }
}

const getListBoards = async (userId, currentPage, itemsPerPage) => {
  try {
    
    const queryConditions = [
      { _destroy: false },

      { $or: [
        { ownerIds: { $all: [ObjectId(userId)]} },
        { memberIds: { $all: [ObjectId(userId)]} }
      ]}
    ]
    
    console.log('currentPage',currentPage)
    console.log('itemsPerPage',itemsPerPage)

    const query = await getDB().collection(boardCollectionName).aggregate([
      { $match: { $and: queryConditions}},
      { $facet: {
        'boards': [
          { $skip: pagingSkipValue(currentPage, itemsPerPage)},
          { $limit: itemsPerPage },
          { $sort: { title: 1}} //title A-Z
        ],
        'totalBoards': [
          { $count: 'countedBoards'}
        ]
      }}
    ]).toArray()


    console.log(query)
    const res = query[0]


    return {
      boards: res.boards || [],
      totalBoards : res.totalBoards[0]?.countedBoards || 0
    }

  } catch (error) {
    throw new Error(error)
  }
}

export const BoardModel = {
  createNew,
  update,
  pushColumnOrder,
  getFullBoard,
  findOneById,
  getListBoards
}
