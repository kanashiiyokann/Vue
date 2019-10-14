<template>
  <el-card class="box-card">
    <div slot="header" class="header">系统登陆</div>
    <el-form size="small" :rules="rules" ref="form" :model="form">
      <el-form-item prop="userName">
        <el-input placeholder="用户名" :model="form.userName" maxlength="20"></el-input>
      </el-form-item>
      <el-form-item prop="userPwd">
        <el-input type="password" placeholder="密码" :model="form.userPwd" maxlength="20"></el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox label="记住密码" :model="cache"></el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" style="width: 100%" @click="loginSubmit">登陆</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
    export default {
        name: "Login",
        data() {
            return {
                form: {
                    userName: "",
                    userPwd: ""
                },
                rules: {
                    userName: [{required: true, message: "请输入用户名！", trigger: "blur"}],
                    userPwd: [{validator: this.validatorUserPwd, trigger: "blur"}]
                },
                cache: false
            };

        },
        methods: {
            loginSubmit() {
                this.$refs.form.validate((pass) => {
                    if (pass) {
                        console.log(this.form);
                        //缓存表单
                        if (this.cache) {
                            sessionStorage.setItem("login.form", this.form);
                        } else {
                            sessionStorage.removeItem("login.form");
                        }
                    }
                });

            },
            validatorUserPwd(rule, value, callback) {
                value = value || "";
                if (value === "") {
                    callback(new Error('请输入密码！'));
                } else {
                    callback();
                }
                // callback(new Error('密码字符种类至少包含三种！'));
            }

        }
    }
</script>

<style scoped>
  .header {
    font-weight: bolder;
    text-align: center;
  }

  .box-card {
    display: inline-block;
    width: 320px;
    height: 280px;
    padding: 20px;
    box-shadow: 6px 8px 8px 6px rgba(0, 0, 0, 0.1);
    margin: 120px auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

</style>
