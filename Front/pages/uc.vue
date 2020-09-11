<template>
  <div class="contenter">
      <h1>用户中心</h1>
      <i class="el-icon-loading"></i>
      <div ref="drag" id="drag">
          <input type="file" name="file" @change="handleFileChange">
      </div>
       <!-- <div>
          <el-button @click="uploadFile">上传</el-button>
      </div>  -->

      <div>
          <el-progress :strocke-width="40" :text-inside="true" :percentage="uploadProgress"></el-progress>
      </div>
      <div>
          <el-button @click="uploadFile">上传</el-button>
      </div>

      <div>
          <el-progress :stroke-width="20" :text-inside="true" :percentage="hashProgress"></el-progress>
              <p>计算hash的进度</p>
      </div>
      <!-- <div>
          <div class="cube-container">
             <div class="cube">
                 <div>
                    chunk有关的代码
                 </div>
             </div>
          </div>
      </div> -->
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = 1*1024   //设定文件片段
export default {
   data () {
       return {
           hashProgress:0,
           uploadProgress:0,
           file:'',
           chunks:[],
           worker:{}
       }
   },
  async mounted () {
       const ret = await this.$http.get('/user/info')
    //    console.log(ret)
       this.bindEvents()
   },
   methods: {
       bindEvents(){
           const drag = this.$refs.drag
           drag.addEventListener('dragover',e=>{
             drag.style.borderColor = 'red'
             e.preventDefault()
           })
            drag.addEventListener('dragleave',e=>{
             drag.style.borderColor = '#eeee'
             e.preventDefault()
           })
           drag.addEventListener('drop',e=>{
             console.log(e.dataTransfer)
             e.preventDefault()
              const fileList = e.dataTransfer.files
               drag.style.borderColor = '#eeee'
               this.file = fileList[0]
               console.log(this.file)
           })
       },
      async blobToString(blob){  //通过读文件的形式来实现
         return new Promise(resolve=>{
             const render = new FileReader()
             render.onload = function(){
                 console.log(render.result)
                 //第一个map变成ASKI吗，第二个是变成字符串的形式
                 // 如果不明白可以用这个 'G'.charCodeAt().toString(16)  试下
                 const ret = render.result.split('').map(v=>v.charCodeAt()).map(v=>v.toString(16).toUpperCase()).join()
                 console.log(ret)
                 resolve(ret)
             }
             //执行读取的功能
             render.readAsBinaryString(blob)
         })
       },
       async isGif(file){
         //47494638   gif的文件头
         //进行16进制的转换
         const ret = await this.blobToString(file.slice(0,6))
         const isGif = (ret=='47 49 46 38 39 61')||(ret=='47 49 46 38 37 61')
         return isGif
       },
      async isZip(file){  //504B0304    zip的文件头
       //通过文件流来判断
       const ret = await this.blobToString(file.slice(0,6))

       },
      async isPng(file){
        const ret = await this.blobToString(file.slice(0,8))
        console.log(ret)
        const isPng = (ret == "89,50,4E,47,D,A,1A,A")
        return isPng
       },
     async isJpg(file){
      const len = file.size
      const start = await this.blobToString(file.slice(0,2))
      const tail = await this.blobToString(file.slice(-2,len))
      const isjpg = (start=='FF D8') && (tail=='FF D9')
      return isjpg
    },
      async isImage(file){
          console.log(await this.isJpg(file))
          console.log(await this.isPng(file))
         return await this.isJpg(file) || await this.isPng(file)
       },
       handleFileChange(e){
           console.log(e)
        const [file] = e.target.files
        console.log(file)
         if (file) {
             console.log(7777);
             console.log(file)
             return this.file = file
         } 
       },

     createFileChunk(file,size = CHUNK_SIZE){  //将文件根据根据设定的文件的大小来进行分割
       console.log(111)
     const chunks = []  //存放文件的片段 
      let cur = 0
      while (cur<this.file.size){
          chunks.push({index:cur,file:this.file.slice(cur,cur+size)})
          cur+= size   
      }
      return chunks
     },
     async calculateHashIdle(){   //借鉴fiber  抽样hash的计算
       const chunks = this.chunks
        return new Promise(resolve=>{
            const spark = new sparkMD5.ArrayBuffer()
            let count = 0

            const appendToSpark = async file=>{
                return new Promise(resolve=>{
                    const reader = new FileReader()
                    reader.readAsArrayBuffer(file)
                    reader.onload = e=>{
                        spark.append(e.target.result)  //标记1
                        resolve()
                    }
                })
            }
              const workLoop = async deadline=>{
          // timeRemaining获取当前帧的剩余时间
          while(count<chunks.length && deadline.timeRemaining()>1){
            // 空闲时间，且有任务
            await appendToSpark(chunks[count].file)
            count++
            if(count<chunks.length){
              this.hashProgress = Number(
                ((100*count)/chunks.length).toFixed(2)
              )
            }else{
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        // 浏览器一旦空闲，就会调用workLoop
        window.requestIdleCallback(workLoop)
        })
       
     },

     async calculateHashWorker(){   //这里进行hash计算
     console.log(777)
       return new Promise(resolve=>{
           this.worker = new Worker('/hash.js')  //这里相当于开了一个新的进程，详情查看阮一峰文档
           console.log(this.worker)
           console.log(this.chunks)
           this.worker.postMessage({chunks:this.chunks})  //主线程向新进程传递数据
           console.log(this.worker)
           debugger
           this.worker.onmessage = e=>{  //主线程通过this.worker指定监听函数，接受子线程返回的信息
               const {progress,hash} = e.data
               console.log(progress)
               this.hashProgress = Number(progress.toFixed(2))  //新增用来计算hash的值，保留两位小数
               if (hash) {
                   resolve(hash)
               }
           }
       })
     },

     async uploadFile(){  
        //  console.log(await this.isImage(this.file))  
        //  if( await this.isImage(this.file)){
        //   alert('文件格式正确')
        //  }else{
        //      alert('文件格式不正确')
        //      return
        //  }
         console.log(99999)
        const chunks  = this.createFileChunk(this.file)
        console.log(chunks)

        // const hash = await this.calculateHashWorker()  //这里进行hash计算 
        const hash = await this.calculateHashIdle()   //通过fiburary的方法进行hash计算
        // console.log('hash',hash)
        // console.log('hash1',hash1)

        // this.hash = hash
        this.chunks = chunks.map((chunk,index)=>{
            //切片的名字 = hash+index
            const name = this.hash + '-'+ index
            return {
                hash,
                name,
                index,
                chunk:chunk.file
            }
        })

        console.log(this.chunks)

        // await this.uploadChunks()

        return

          //这个是二进制的东西
           const form = new FormData()
           //传进去的是文件的名字和文件的内容
           form.append('name','file')
           form.append('file',this.file)
           //这样上面就可以获取二进制的对象 
        const ret = await this.$http.post('/uploadfile',form,{onUploadProgress:progress=>{
            this.uploadProgress = Number(((progress.loaded/progress.total)*100).toFixed(2))
        }})
       },
       uploadChunks(){
           console.log(1111)
          //转成Promise变成axios的对象
          const requests = this.chunks.map((chunk,index)=>{
              const form = new FormData()
              form.append('chunk',chunk.chunk)
              form.append('hash',chunk.hash)
              form.append('name',chunk.name)
              return form
          }).map((form,index)=>{
              debugger
              this.$http.post('/uploadfile',{onUploadProgress:progress=>{
            this.uploadProgress = Number(((progress.loaded/progress.total)*100).toFixed(2))
        }})
          })
        //   await Promise.all(requests)
       }
   }
}
</script>

<style lang='stylus'>
.contenter
  background-color #ffff
  #drag
   height 100px;
   line-height 100px;
   border 2px dashed #eee;
   text-align center
 
</style>