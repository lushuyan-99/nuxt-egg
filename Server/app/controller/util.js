'use strict'
const svgCaptcha = require('svg-captcha')
// const Controller = require('egg').Controller
const fse = require('fs-extra')
const path = require('path')
const BaseController = require('./base')


class UtilController extends BaseController {
  async captcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      noise: 3,
    })
    //  console.log(captcha);
    this.ctx.session.captcha = captcha.text
    this.ctx.response.type = 'image/svg+xml'
    this.ctx.body = captcha.data
    //  console.log(captcha);
  }
  async uploadfile() {
    // 文件管理的话用fs-extra会更好用一些
    //在后台以 /public/hash/(hash+index)  =>这样更方便图片的碎片化管理
    const { ctx } = this
    const file = ctx.request.files[0]
    const { name, hash } = ctx.request.body
    //hash的名字就是文件夹的名字
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    // const filePath = path.resolve()  //这个是文件最后存储的位置
    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }
    await fse.move(file.filepath, `${chunkPath}/${name}`)
    // console.log(file, name)
    // await fse.move(file.filepath, this.config.UPLOAD_DIR + '/' + file.filename)
    // this.ctx.body = { url: `/public/${file.filename}` }
    this.message('切片上传成功')
  }
  async mergefile() {
    const { ext, size, hash } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.mergeFile(filePath, hash, size)
    this.success({
      url: `/public/${hash}.${ext}`,
    })
  }
  async checkfile() {
    const { ctx } = this
    const { ext, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}-${ext}`)
    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) {  //如果文件存在
      //文件存在
      uploaded = true
    } else {  
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash))
    }
    this.success({
      uploaded,
      uploadedList
    })
  }
  async getUploadedList(dirPath) {
    return fse.existsSync(dirPath) ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.') : []
  }
  async mergeFile(filepPath, filehash, size) {
    const chunkdDir = path.resolve(this.config.UPLOAD_DIR, filehash) // 切片的文件夹
    let chunks = await fse.readdir(chunkdDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map(cp => path.resolve(chunkdDir, cp))
    await this.mergeChunks(chunks, filepPath, size)

  }
  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) => new Promise(resolve => {
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
        fse.unlinkSync(filePath)
        resolve()
      })
      readStream.pipe(writeStream)
    })

    await Promise.all(
      files.forEach((file, index) => {
        pipStream(file, fse.createWriteStream(dest, {
          start: index * size,
          end: (index + 1) * size,
        }))
      })
    )
  }
}

module.exports = UtilController
