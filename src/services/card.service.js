import { CardModel } from '*/models/card.model'
import { ColumnModel } from '*/models/column.model'
import { CloudinaryProvider } from '*/providers/CloudinaryProvider'
import { ObjectId } from 'mongodb'

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
const update = async (cardId, data, userInfo, cardCoverFile) => {
  try {
    const updateData = {
      ...data,
      updatedAt: Date.now()
    }
    // console.log("User: ", userInfo)
    let updatedCard = {}
    
    if (cardCoverFile) {
      // update card cover
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
   

      updatedCard = await CardModel.update(cardId, {
        cover: uploadResult.secure_url
      })

    } else if (updateData.newComment) {
       const comment = {
        ...updateData.newComment,
        userId: ObjectId(userInfo._id),
        userEmail: userInfo.email,
        createdAt: Date.now()
       }
       console.log('comment',comment)

       updatedCard = await CardModel.pushNewComment(cardId, comment)
    }else if (updateData.incomingMember) {

      updatedCard = await CardModel.updateMembers(cardId, updateData.incomingMember)
      
    } else {
      // update title, description, ...
      updatedCard = await CardModel.update(cardId, updateData)
    }

    

    return updatedCard
  } catch (error) {
    throw new Error(error)
  }
}

export const CardService = {
  createNew,
  update
}
