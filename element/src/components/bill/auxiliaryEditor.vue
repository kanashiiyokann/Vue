<template>
  <el-table :data="data" :border="true" :stripe="true" align="center">
    <el-table-column label="编码" prop="code"></el-table-column>
    <el-table-column label="名称" prop="name"></el-table-column>
    <el-table-column label="操作">
      <template slot-scope="scope">
        <el-button type="danger" @click="deleteAuxiliary(scope.$index)">删除</el-button>
        <el-button>编辑</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
  export default {
    name: "auxiliaryEditor",
    props: ["data", "type"],
    methods: {
      deleteAuxiliary(index) {
        this.data.splice(index, 1);
        this.$message.success("删除成功！");
      }
    }
  }
</script>

<style scoped>
</style>
