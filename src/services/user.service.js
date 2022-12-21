import { UserModel } from '*/models/user.model'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';
import { pick } from 'lodash'
import { SendInBlueProvider } from '*/providers/SendInBlueProvider'
import { JwtProvider } from '*/providers/JwtProvider'
import { CloudinaryProvider } from '*/providers/CloudinaryProvider'
import { WEBSITE_DOMAIN } from '*/utilities/constants'
import { pickUser } from '*/utilities/transform'
import { env } from '*/config/environtment'

const createNew = async (data) => {
  try {
    // Kiểm tra xem email đã tồn tại trong hệ thống hay chưa
    const existUser = await UserModel.findOneByEmail(data.email)
    if (existUser) {
      throw new Error('Email already exist.')
    }

    // Tạo data user để lưu vào DB
    // uniqueName: nếu email là trungquandev@gmail.com thì sẽ lấy được "trungquandev"

    const nameFromEmail = data.email.split('@')[0] || ''
    const userData = {
      email: data.email,
      password: bcryptjs.hashSync(data.password, 8),
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    const createdUser = await UserModel.createNew(userData)
    const getUser = await UserModel.findOneById(createdUser.insertedId.toString())

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

const verifyAccount = async (data) => {
  try {
    // Kiểm tra xem email đã tồn tại trong hệ thống hay chưa
    const existUser = await UserModel.findOneByEmail(data.email)
    if (!existUser) {
      throw new Error('Email  khong ton tai.')
    }
    if (existUser.isActive) {
      throw new Error('Your account is already active.')
    }
    if (data.token !== existUser.verifyToken) {
      throw new Error('Token is invalid!.')
    }

    const updateData = {
      verifyToken: null,
      isActive: true
    }

    const updateUser = await UserModel.update(existUser._id.toString(), updateData)
    // console.log(updateUser)

    // return pick(updateUser,['email','username','displayName','avatar','role','isActive','createdAt','updatedAt'])
    return pickUser(updateUser)
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const signIn = async (data) => {
  try {

    const existUser = await UserModel.findOneByEmail(data.email)
    if (!existUser) {
      throw new Error('Email  khong ton tai.')
    }
    if (!existUser.isActive) {
      throw new Error('Your account is not active.')
    }

    // Compare password
    if (!bcryptjs.compareSync(data.password, existUser.password)) {
      throw new Error('Your email or password is incorrect.')
    }

    const userInfoToStoreInJwtToken = {
      _id: existUser._id,
      email: existUser.email
    }

    // xử lý tokens
    // Tạo 2 loại token, accessToken và refreshToken để trả về cho phía Front-end
    const accessToken = await JwtProvider.generateToken(
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_SECRET_LIFE,
      // 5,
      userInfoToStoreInJwtToken
    )

    const refreshToken = await JwtProvider.generateToken(
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_SECRET_LIFE,
      // 15,
      userInfoToStoreInJwtToken
    )

    return {accessToken, refreshToken, ...pickUser(existUser)}

  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

const refreshToken = async (clientRefershToken) => {
  try {
    // Verify / giải mã token
    const refershTokenDecoded = await JwtProvider.verifyToken(env.REFRESH_TOKEN_SECRET_SIGNATURE, clientRefershToken )

    // Đoạn này vì chúng ta chỉ lưu những thông tin unique và cố định của user, vì vậy có thể lấy luôn từ decoded ra, tiết kiệm query vào DB để lấy data mới.
    const userInfoToStoreInJwtToken = {
      _id: refershTokenDecoded._id,
      email: refershTokenDecoded.email
    }

    const accessToken = await JwtProvider.generateToken(
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_SECRET_LIFE,
      // 5,
      userInfoToStoreInJwtToken
    )

    return {accessToken}

  } catch (error) {
    throw new Error(error)
  }
}
const update = async (userId, data, userAvatarFile) => {
  try {
    let updatedUser = {}

    if(userAvatarFile) {
      // console.log('agasds')
      // Upload file len cloudinary
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')
      // console.log(uploadResult)

      updatedUser = await UserModel.update(userId, {
        avatar: uploadResult.secure_url
      })

    } else if(data.currentPassword && data.newPassword) {
      //  Change password
      const existUser = await UserModel.findOneById(userId)
      if (!existUser) {
        throw new Error('User not found.')
      }
      // Compare password
      if (!bcryptjs.compareSync(data.currentPassword, existUser.password)) {
        throw new Error('Your current password is incorrect.')
      }

      updatedUser = await UserModel.update(userId, {
        password: bcryptjs.hashSync(data.newPassword, 8)
      })

    } else {
      // General information: displayName
      updatedUser = await UserModel.update(userId, {
        displayName: data.displayName
      })
    }
    
    return pickUser(updatedUser)
  } catch (error) {
    throw new Error(error)
  }
}

export const UserService = {
  createNew,
  verifyAccount,
  signIn,
  refreshToken,
  update
}
