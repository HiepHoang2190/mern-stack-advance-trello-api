import { CardModel } from '*/models/card.model'
import { ColumnModel } from '*/models/column.model'

const createNew = async (data) => {
  try {
    const createdCard = await CardModel.createNew(data)
    const getNewCard = await CardModel.findOneById(createdCard.insertedId.toString())

    await ColumnModel.pushCardOrder(getNewCard.columnId.toString(), getNewCard._id.toString())

    return getNewCard
  } catch (error) {
    throw new Error(error)
  }
}

// user info lấy từ token, mà token mình đang lưu mỗi email với _id vào
const update = async (cardId, data, userInfo) => {
  try {
    const updateData = {
      ...data,
      updatedAt: Date.now()
    }
    console.log("User: ", userInfo)

    const updatedCard = await CardModel.update(cardId, updateData)

    return updatedCard
  } catch (error) {
    throw new Error(error)
  }
}

export const CardService = {
  createNew,
  update
}
