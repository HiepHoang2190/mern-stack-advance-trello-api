import { UserModel } from '*/models/user.model'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';
import {pick} from 'lodash'

const createNew = async (data) => {
  try {
    // Kiểm tra xem email đã tồn tại trong hệ thống hay chưa
    const existUser = await UserModel.findOneByEmail(data.email)
    if(existUser) {
        throw new Error('Email already exist.')
    }

    // Tạo data user để lưu vào DB
    // uniqueName: nếu email là trungquandev@gmail.com thì sẽ lấy được "trungquandev"
 
    const nameFromEmail = data.email.split('@')[0] || ''
    const userData = {
        email:data.email,
        password:bcryptjs.hashSync(data.password, 8),
        username: nameFromEmail,
        displayName: nameFromEmail,
        verifyToken:uuidv4()
    }

    const createdUser= await UserModel.createNew(userData)
    const getUser= await UserModel.findOneById(createdUser.insertedId.toString())

    //  gửi email cho người dùng click xác thực

    return pick(getUser,['email','username','displayName','avatar','role','isActive','createdAt','updatedAt'])

  } catch (error) {
    throw new Error(error)
  }
}



export const UserService = {
  createNew
}
