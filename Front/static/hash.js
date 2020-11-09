
// 引入spark-md5

self.importScripts('spark-md5.min.js')


self.onmessage = e=>{
  // 接受主线程传递的数据
  const {chunks } = e.data
  const spark = new self.SparkMD5.ArrayBuffer()  //创建计算md5的库
//  设置一个进度
  let progress = 0    
  let count = 0

  const loadNext = index=>{  //有点像中间件里面的东西
    const reader = new FileReader()
    console.log(chunks[index].file)
    reader.readAsArrayBuffer(chunks[index].file)  //读取指定的Blob或File内容
    reader.onload = e=>{
      count ++
      spark.append(e.target.result)
      if(count==chunks.length){  //计算结束
        self.postMessage({
          progress:100,
          hash:spark.end()
        })
      }else{  //没有计算结束
        progress += 100/chunks.length
        self.postMessage({
          progress
        }) 
        loadNext(count)   //执行下一步
      }
    }
  }
  loadNext(0)
}