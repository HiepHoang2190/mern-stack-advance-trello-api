import { UserModel } from '*/models/user.model'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';
import {pick} from 'lodash'
import {SendInBlueProvider} from '*/providers/SendInBlueProvider'
import {WEBSITE_DOMAIN} from '*/utilities/constants'
import { pickUser } from '*/utilities/transform'
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
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getUser.email}&token=${getUser.verifyToken}`
    const subject = 'Trello Clone App: Please verify your email before using our services!'
    const htmlContent = `
     <h3>Here is your verification link:</h3>
     <h3>${verificationLink}</h3>
     <h3>Sincerely,<br/> - Trungquandev Official - </h3>
   `

   await SendInBlueProvider.sendEmail(getUser.email, subject, htmlContent)

    // return pick(getUser,['email','username','displayName','avatar','role','isActive','createdAt','updatedAt'])
    return pickUser(getUser)
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const verifyAccount = async(data) => {
  try {
    // Kiểm tra xem email đã tồn tại trong hệ thống hay chưa
    const existUser = await UserModel.findOneByEmail(data.email)
    if(!existUser) {
        throw new Error('Email  khong ton tai.')
    }
    if(existUser.isActive) {
      throw new Error('Your account is already active.')
    }
    if(data.token !== existUser.verifyToken) {
      throw new Error('Token is invalid!.')
    }

    const updateData = {
      verifyToken: null,
      isActive: true
    }

    const updateUser = await UserModel.update(existUser._id.toString(), updateData)
    console.log(updateUser)

    // return pick(updateUser,['email','username','displayName','avatar','role','isActive','createdAt','updatedAt'])
    return pickUser(updateUser)
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

export const UserService = {
  createNew,
  verifyAccount
}
