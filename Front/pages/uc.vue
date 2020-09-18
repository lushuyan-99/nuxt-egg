<template>
  <div class="contenter">
      <h1>用户中心</h1>
      <i class="el-icon-loading"></i>
      <div ref="drag" id="drag">
          <input type="file" name="file" @change="handleFileChange">
      </div>
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
      <div>
        <!-- chunk.progeress///当progress<0的时候显示红色，100成功绿色，别的数字就用方块的高度 -->

          <div class="cube-container" :style="{width:cubeWidth+'px'}">
             <!-- <div>我是测试的是</div> -->
             <div class="cube" v-for="(chunk,index) in chunks" :key="index">
                 <div :class="{'uploading':chunk.progress>0&&chunk.progress<100,'success':chunk.progress==100,'error':chunk.progress<0}"  :style="{height:chunk.progress+'%'}">
                    <i class="el-icon-loading" style="color:#f56c6c" v-if="chunk.progress>0&&chunk.progress>100"></i>
                 </div>
             </div>
          </div>
      </div>
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5'

const CHUNK_SIZE = 1*1024   //设定文件片段
export default {
   data () {
       return {
           hashProgress:0,
          //  uploadProgress:0,
           file:'',
           chunks:[],
           worker:{},
       }
   },
   computed: {
      cubeWidth(){
      return  Math.ceil(Math.sqrt(this.chunks.length))*16
    },
    uploadProgress(){
      if(!this.file || this.chunks.length){
        return 0
      }
      const loaded = this.chunks.map(item=>item.chunk.size*item.progress)
                        .reduce((acc,cur)=>acc+cur,0)
      return parseInt(((loaded*100)/this.file.size).toFixed(2))
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

     async calculateHashSample(){ //布隆过滤器，判断一个数据存在与否

      //1G的文件，抽样以后5M以内
      //hash一样，文件不一定一样
      //hash不一样，文件一定不一样

      return new Promise(resolve=>{
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()

        const file = this.file
        const size = file.size
        const offset = 1*1024
        //第一个1KB，最后一个区块数据都要
        let chunks = [file.slice(0,offset)]
        let cur = offset
        while(cur<size){
          if (cur+offset>size) {
            //获取最后一个区块
            chunks.push(file.slice(cur,cur+offset))
          }else{
            //中间的区块
            const mid = cur+offset/2
            const end = cur+offset
            chunks.push(file.slice(cur,cur+2))
            chunks.push(file.slice(mid,mid+2))
            chunks.push(file.slice(end-2,end))
          }
          cur+=offset
        }
        //中间的，取前中后各两个字节
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = e=>{
          spark.append(e.target.result)
          this.hashProgress = 100
          resolve(spark.end())
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

      const  hash = await this.calculateHashSample()

        this.hash = hash
        console.log(hash);
         console.log(99999)
        const chunks  = this.createFileChunk(this.file)
        console.log(chunks)
        this.chunks = chunks.map((chunk,index)=>{
            //切片的名字 = hash+index
            const name = this.hash + '-'+ index
            const hash = this.hash
            return {
                hash,
                name,
                index,
                chunk:chunk.file,
                progress:0
            }
        })

        console.log(this.chunks)

        //当hash计算完成以后问一下后台有没有上传过，是否有碎片存在
        const {data:{uploaded,uploadedList}} = await this.$http.post('/checkfile',{
          hash:this.hash,
          ext:this.file.name.split('.').pop()
        })
        if (uploaded) {
          return this.$message.success('秒传成功')
        }

        // const hash = await this.calculateHashWorker()  //这里进行hash计算 
        // const hash = await this.calculateHashIdle()   //通过fiburary的方法进行hash计算
     
        await this.uploadChunks()
        await  this.mergeRequest()
        //   //这个是二进制的东西
        //    const form = new FormData()
        //    //传进去的是文件的名字和文件的内容
        //    form.append('name','file')
        //    form.append('file',this.file)
        //    //这样上面就可以获取二进制的对象 
        // const ret = await this.$http.post('/uploadfile',form,{onUploadProgress:progress=>{
        //     this.uploadProgress = Number(((progress.loaded/progress.total)*100).toFixed(2))
        // }})
       },
    
    async uploadChunks(){
           console.log(1111)
          //转成Promise变成axios的对象
          const requests = this.chunks.map((chunk,index)=>{
              const form = new FormData()
              form.append('chunk',chunk.chunk)
              form.append('hash',chunk.hash)
              form.append('name',chunk.name)
              return form
          }).map((form,index)=>{
              this.$http.post('/uploadfile',form,{onUploadProgress:progress=>{
            this.chunks[index].progress  = Number(((progress.loaded/progress.total)*100).toFixed(2))
        }})
          })
          //promise过多的话会造成浏览器的卡顿@todo，接下来可以进行并发数量的控制
          await Promise.all(requests)
       },
    
    //TCP慢启动，先上传一个区块，比如10KB，根据上传成功时间，决定下一个区块是20K，还是50K，还是5K
     //在下一个一样的逻辑，可能编程100K，200K，或者2K
    //  上传可能报错
    // 报错之后，进度条变红，开始重试
    // 一个切片重试失败三次，整体全部终止
    async sendRequest(chunks,limit=4){
    //  limit是并发数
    // 一个数组长度是limit
    // [task12,task13,task4]
    return new Promise((resolve,reject)=>{
       const len = chunks.length
       let counter = 0
       let isStop = false
       const start = async ()=>{
         if (isStop) {
           return
         }
         const task = chunks.shift()  //删除队列的第一个
         if (task) {
           const {form,index} = task
           try {
             await this.$http.post('/uploadfile',form,{
               onUploadProgress:progress=>{
                 //不是整体的进度条了，而是每个区块都有自己的进度条，整体的进度条需要计算
                 this.chunks[index].progress = Number(((progress.loaded/progress.total)*100).toFixed(2))
               }
             })
             if (counter==len-1) {
               //最后一个任务
               resolve()
             } else {
               counter++
               //启动下一个任务
               start()
             }
           } catch (error) {
             this.chunks[index].progress = -1
             if (task.error<3) {
               task.error++
               chunks.unshift(task),  //在数据的头部传入
               start()
             } else {
               //错误三次
               isStop = true
               reject()
             }
           }
         }
       }
      
      while (limit>0) {
        //启动limit个任务
        //模拟一下延迟
        setTimeout(()=>{
          start()
        },Math.random()*2000)
      }
      limit -=1
    })
    },
     
     async mergeRequest(){
       const ret = await this.$http.post('/mergefile',{
        ext:this.file.name.split('.').pop(),
        size:CHUNK_SIZE,
        hash:this.hash
      })
      const url = ret.data.url
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
 .cube-container
     background-color #ffff
   .cube
   width 14px
   height 14px
   line-height 14px
   border 1px black solid
   background #eee
   float left
     >.success
      background green
    >.uploading
      background blue
    >.error
      background red

 
</style>