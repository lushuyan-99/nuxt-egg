<template>
  <div class="article-item">
    <h2 style="width:900px">
        <nuxt-link :to='"/article/"+article._id'>
            {{article.title}}
        </nuxt-link>
    </h2>
    <p>
       <UserDisplay :user='article.author'></UserDisplay>
       <span class="action">
           <i class="el-icon-view">{{article.view}}</i>
       </span>
       <span class="action">
           <i class="el-icon-thumb">{{article.link}}</i>
       </span>
    </p>
  </div>
</template>

<script>
import UserDisplay from './UserDisplay'
export default {
    props: ['article'],
    components: {
        UserDisplay
    }

}
</script>

<style lang='scss'>
 .article-item{
     padding: 20px 15px;
     border-bottom: 2px solid #eee;
     h2{
         height: 100px;
     }
     a{
         color: #67c23a;
     }
     .action{
         display: inline-block;
         width: 50px;
     }
 }
</style>