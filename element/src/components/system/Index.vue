<template>
  <el-menu mode="vertical">
    <el-submenu  v-for=" (submenu,index) in menu" :index="index+1+''">
      <template slot="title" ><i :class="submenu.class"></i>{{submenu.name}}</template>
      <el-menu-item v-for="(child ,childIndex) in submenu.children" :index="(index+1)+''+(childIndex+1)" >{{child.name}}</el-menu-item>
    </el-submenu>

  </el-menu>
</template>

<script>
    export default {
        name: "Index",
        data() {
            return {
                menu: [{name: "工作台",class:"el-icon-menu"},
                    {name: "票据",class:"el-icon-zy-quanbaomiaosha", children: [{name: "理票据"}]},
                    {name: "凭证", children: [{name: "录凭证"}, {name: "查凭证"}]},
                    {name: "设置", children: [{name: "系统参数"}]}
                ]
            };
        }
    }
</script>

<style scoped>

</style>
