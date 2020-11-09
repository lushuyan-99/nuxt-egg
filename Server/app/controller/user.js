const md5 = require('md5')
const jwt = require('jsonwebtoken')
const BaseController = require('./base')
const HashSalt = ':Kaikeba@good!@123'

const createRules = {
  email: { type: 'email' },
  captcha: { type: 'string' },
  passwd: { type: 'string' },
  nickname: { type: 'string' },
}

class userController extends BaseController {
  async login() {
    const { ctx, app } = this
    const { email, captcha, passwd } = ctx.request.body
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }
    //  const user = await ctx.model.User.findOne({
    //     email,
    //     passwd: md5(passwd + HashSalt),
    //   })
    //  if(!user){
    //    return this.error('用户名密码错误')
    //  }

    // 用户的信息加密成token 返回
    //   const token = jwt.sign({
    //     // _id: user._id,
    //     email,
    //   }, app.config.jwt.secret, {
    //     expiresIn: '100h',
    //   })
    this.success({ email, nickname: 'lulu' })
  }
  async register() {
    const { ctx } = this
    try {
      this.validate(createRules)
    } catch (e) {
      return this.error('参数校验失败', -1, e.error)
    }

  }
  async verify() {
    // 校验用户是否存在
  }
  async checkEmail(email) {
    console.log(this.ctx.model)
    // const user = await this.ctx.model.User.findOne({ email })
    // return user
  }
  async info() {
    // 用户的详细信息
    const { ctx } = this

    //

    // 这个地方不知道是哪个邮件，需要从token里面读取，有的接口需要从接口里面读数据，有的不需要
    const { email } = ctx.state
    //   const user = await this.checkEmail(email)
    this.success(email)
  }
}

module.exports = userController
