<template>
  <div class="login-container">
      <el-form class="login-form" label-width="100px" :model="form" :rules="rules" ref="registerForm">
         <el-form-item prop="email" label="邮箱">
             <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
         </el-form-item>
         <el-form-item prop="captcha" label="验证码" class="captcha-container">
            <div class="captcha">
               <img :src="code.captcha" @click="updateCaptcha"/>
            </div>
            <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
         </el-form-item>
         <el-form-item prop='nickname' label="昵称">
             <el-input v-model="form.nickname" aria-placeholder="请输入昵称"></el-input>
         </el-form-item>
         <el-form-item prop="passwd" label="密码">
             <el-input v-model="form.passwd" aria-placeholder="请输入密码"></el-input>
         </el-form-item>
         <el-form-item prop="repasswd" label="确认密码">
            <el-input v-model="form.repasswd" aria-placeholder="请再次输入密码"></el-input>
         </el-form-item>
         <el-form-item>
             <el-button type="primary" @click.native.prevent="handleRegister">注册</el-button>
         </el-form-item>
      </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
   layout:"login",
   data () {
       return {
           form:{
               email:"1126424282@qq.com",
               nickname:'lulu',
               passwd:'lushuyan910203',
               repasswd:'lushuyan910203',
               captcha:''
           },
           rules:{
               email:[
                   {required:true,message:'请输入邮箱'},
                   {type:'email',message:'请输入正确的邮箱格式'}
               ],
               captcha:[
                   {required:true,message:"请输入验证码"}
               ],
               nickname:[
                   {required:true,message:'请输入昵称'}
               ],
               passwd:[
                   {required:true,pattern:/^[\w_-]{6,16}$/g,message:'请输入6-16位密码'}
               ],
               repasswd:[
                   {required:true,message:'请再次输入密码'},
                   {validator:(rule,value,callback)=>{
                       if(value !==this.form.passwd){
                         callback(new Error("两次密码不一样"))
                       }
                       callback()
                   }}
               ]
           },
           code:{
               captcha:"/api/captcha"
           },
       }
   },
   methods: {
       handleRegister(){
           this.$refs.registerForm.validate(async valid=>{
               if(valid){
                   alert('成功')
                 console.log('校验成功');
                 
                //  @todo 发送注册请求
                 let obj = {
                     email:this.form.email,
                     nickname:this.form.nickname,
                     passwd:md5(this.form.passwd),
                     captcha:this.form.captcha
                 }

                let ret = await this.$http.post('/user/login',obj)
                //code=0 就是成功
                console.log(ret);
                if (ret.code==0) {
                    alert('成功')
                } else {
                    alert("校验失败")
                }
                 
               }else{
                   console.log('校验失败');
               }
           })
       },
       updateCaptcha(){
         this.code.captcha = "/api/captcha?_t"+new Date().getTime()
       }
   }
}
</script>

<style>

</style>