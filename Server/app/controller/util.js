'use strict';
const svgCaptcha = require('svg-captcha')
const Controller = require('egg').Controller;
const fse = require('fs-extra')

class UtilController extends Controller {
  async captcha() {
   const captcha = svgCaptcha.create({
       size:4,
       fontSize:50,
       width:100,
       height:40,
       noise:3

   })
  //  console.log(captcha);
   this.ctx.session.captcha = captcha.text
   this.ctx.response.type = "image/svg+xml"
   this.ctx.body = captcha.data
  //  console.log(captcha);
  }
  async uploadfile(){
    //文件管理的话用fs-extra会更好用一些
    const {ctx} = this
    const file = ctx.request.files[0]
    const {name} = ctx.request.body
    console.log(file,name)
    await fse.move(file.filepath,this.config.UPLOAD_DIR+'/'+file.filename)
    this.ctx.body = {url:`/public/${file.filename}`}
  }
}

module.exports = UtilController;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     