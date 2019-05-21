<template>
  <el-container style="height:complex;">
    <el-aside>
      <el-menu>
        <el-submenu index="1">
          <template slot="title">
            <i class="el-icon-location"></i>
            <span>菜单1</span>
          </template>
          <el-submenu index="1-1">
            <template slot="title">菜单1.1</template>
            <el-menu-item index="1.1.1">选项1.1.1</el-menu-item>
          </el-submenu>
        </el-submenu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>header</el-header>
      <el-main>main</el-main>
      <el-footer>footer</el-footer>
    </el-container>
  </el-container>
</template>

<script>
  export default {
    name: "structure",
    data(){

      return {
        title
      };
    }
  }
</script>

<style scoped>
  .el-aside {
    width: 200px;
    height: auto;
    background-color: #DCDFE6;
  }

  .el-header {
    width: 100%;
    background-color: white;
    text-align: center;
  }
</style>
