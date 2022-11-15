import { env } from '*/config/environtment'
import { JwtProvider } from '*/providers/JwtProvider'
import { HttpStatusCode } from '*/utilities/constants'

const isAuthorized = async (req, res, next) => {
    const clientAccessToken = req.cookies?.accessToken
    // console.log(clientAccessToken)
    if (!clientAccessToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
            errors: 'Unauthorized (token not found)'
          })
    }

    try {
        // Thực hiện giải mã token xem nó có hợp lệ hay không
        const decoded = await JwtProvider.verifyToken(env.ACCESS_TOKEN_SECRET_SIGNATURE, clientAccessToken )
        // console.log(decoded)

        // quan trọng: Nếu như cái token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được vào cái request, để sử dụng cho các phần xử lý ở phía sau

        req.jwtDecoded = decoded

        // Cho phép req đi tiếp
        next()
    } catch (error) {
        console.log(error)
        if (error?.message?.includes('jwt expired')) {
            //  cái accessToken nó bị hết hạn (expired) thì mình cần trả về một cái mã lỗi cho phía FE gọi api refershToken
            return res.status(HttpStatusCode.EXPIRED).json({
                errors: 'Need to refresh token.'
              })
        }

        // Nếu như caí accessToken nó không hợp lệ do bất kỳ điều gì thì chúng ta sẽ trả về mã 401 cho phía FE gọi api sign_out luôn
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
            errors: 'Unauthorized.'
          })
    }
}

export const AuthMiddleware = {
    isAuthorized
}