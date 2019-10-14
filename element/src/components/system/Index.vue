<template>
  <el-menu mode="vertical" background-color="#545c64" style="width: 300px;">
    <el-submenu v-for=" (submenu,index) in menu" :index="index+1+''">
      <template slot="title"><i :class="submenu.class"></i>{{submenu.name}}</template>
      <el-menu-item v-for="(child ,childIndex) in submenu.children" :index="(index+1)+''+(childIndex+1)">
        {{child.name}}
      </el-menu-item>
    </el-submenu>

  </el-menu>
</template>

<script>
    export default {
        name: "Index",
        data() {
            return {
                menu: [{name: "工作台", class: "el-icon-menu"},
                    {name: "票据", class: "el-icon-picture", children: [{name: "理票据"}]},
                    {name: "凭证", class: "el-icon-tickets", children: [{name: "录凭证"}, {name: "查凭证"}]},
                    {name: "设置", class: "el-icon-setting", children: [{name: "系统参数"}]}
                ]
            };
        }
    }
</script>

<style scoped>

</style>
