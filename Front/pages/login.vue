<template>
  <div class="login-container">
     <el-form :rules="rules" :model="form" ref="loginfrom" label-width="100px" class="login-form" >
         <el-form-item prop="email" label="邮箱">
             <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
         </el-form-item>
          <el-form-item prop="capche" label="验证码">
              <img :src='captcha' alt="" @click="updateCaptch">
             <el-input  v-model="form.captcha" placeholder="请输入验证码"></el-input>
         </el-form-item>
         <!-- <el-form-item prop="emailcode" label="验证码">
             <el-input v-model="form.mailcode" placeholder="请输入邮箱验证码"></el-input>
         </el-form-item> -->
           <el-form-item prop="password" label="密码">
             <el-input v-model="form.password" placeholder="请输入密码"></el-input>
         </el-form-item>
         <el-form-item>
             <el-button type='primary' @click.native.prevent="handleLogin">登录</el-button>         
             <nuxt-link to='/register'>
                 <el-button type="primary">注册</el-button>
             </nuxt-link>
        
         </el-form-item>

     </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
    layout:'login',
   data () {
       return {
           send:{},
           form:{
               email:"11264242@qq.com",
               password:'asdasd',
               captcha:""
           },
           rules:{
               emailcode:[
                   {required:true,message:'请输入邮箱验证码'}
               ],
               captcha:[
                   {
                       required:true,message:"请输入验证码"
                   }
               ],
               password:[{
                   required:true,pattern:/^[\w_-]{6,12}$/g,message:"请输入6-12位密码"
               }],
               email:[
                   {required:true,message:'请输入邮箱'},
                   {required:true,message:"请输入正确的邮箱格式"}
               ]
           },
           code:{
               captcha:"/api/captcha"
           },
           captcha:"/api/captcha"
       }
   },
   methods: {
       handleLogin(){
         console.log("我要登录")
         this.$refs.loginfrom.validate(
             async valid=>{
                 if (valid) {
                     console.log(11111)
                     let obj = {
                          email:this.form.email,
                          passwd:this.form.password,
                          captcha:this.form.captcha,
                         }
                        console.log(obj)
                     let ret = await this.$http.post("user/login",obj)
                     //code = 0 就是成功
                     console.log(ret);
                     if (ret.code===0) {
                         //token 的存储，登录成功，返回token
                         alert('登录成功')
                         localStorage.setItem('KKB_USER_TOKEN',ret.data.token)
                         setTimeout(()=>{
                             this.$router.push("/")
                            },500)
                     } else {
                         alert(ret.message)
                     }
                 } else {
                     alert('校验不成功')
                 }
             }
         )
       
       },
       updateCaptch(){  //点击更新图片
         this.captcha = "/api/captcha?_t"+new Date().getTime()
       }
   }
}
</script>

<style>

</style>