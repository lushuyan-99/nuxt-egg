// 解析token的中间件，也可以用egg-jwt

const { jwt } = require('jsonwebtoken')

module.exports = ({ app }) => {
  return async function verify(ctx, next) {
    if (!ctx.request.header.authorization) {
      ctx.body = {
        code: -666,
        message: '用户没有登录',
      }
      return
    }
    // 从上面获取这个当前值
    const token = ctx.request.header.authorization.replace('Bearer ', '')
    try {
      const ret = await jwt.verify(token, app.config.jwt.secret) // 根据密钥来获取
      ctx.state.email = ret.email
      ctx.state.userid = ret._id
      await next()
    } catch (error) {
      if (error.name == 'TokenExpiredError') {
        ctx.body = {
          code: -666,
          message: '登录过期了',
        }
      } else {
        ctx.body = {
          code: -1,
          message: '用户信息报错',
        }
      }
    }
  }
}
