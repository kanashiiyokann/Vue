<template>
  <div class="login">
    <el-form>
      <el-row type="flex" justify="center">
        <el-form-item label="用户名">
          <el-input v-model="name"></el-input>
        </el-form-item>
      </el-row>
      <el-row type="flex" justify="center">
        <el-form-item label="密码">
          <el-input v-model="pwd" type="password"></el-input>
        </el-form-item>
      </el-row>
    </el-form>
  </div>
</template>

<script>
  import storage from 'modules/storage'

  export default {
    name: 'login',
    data() {
      return {name: '', pwd: ''}
    },
    method:{
      login(){

        storage.save("name",this.name);
      }
    }
  }
</script>

<style>
  .login {
    height: 400px;
    width: 600px;
    background-color: #99a9bf;
    margin: 200px auto;
    border-radius: 5px;
  }
</style>
