<template>
    <div>
      <el-card ref="header">
        <el-form :inline="true">
          <el-form-item >
            <el-select v-model="params.period">
              <el-option v-for="period in samples.periodList" :key="period" :value="period" :label="period"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="票据状态">
            <el-select v-model="params.state">
                <el-option value="" label="全部"></el-option>
                <el-option v-for="state in samples.stateList" :key="state.value" :value="state.value" :label="state.text"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="票据类型">
            <el-select v-model="params.type">
              <el-option value="" label="全部"></el-option>
              <el-option v-for="type in samples.templateTypeList" :key="type.id" :value="type.id" :label="type.type"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="记账状态">
            <el-select v-model="params.accounted">
              <el-option value="" label="全部"></el-option>
              <el-option v-for="accountedState in samples.accountedStateList" :key="accountedState.value" :value="accountedState.value" :label="accountedState.text"></el-option>
            </el-select>
          </el-form-item>
          <el-button  type="primary" size="small">查询</el-button>
          <el-button size="small">清空</el-button>
        </el-form>
      </el-card>
      <el-card ref="body">
        <div>
          <el-button type="small">汇总生产凭证</el-button>
          <el-button type="small">退回</el-button>
          <el-button type="small">跨期</el-button>
          <el-button type="small">删除</el-button>
          <span v-for="statistics in samples.billStatistics" :key="statistics.name">{{statistics.name}} {{statistics.count}}</span>
        </div>
      </el-card>

    </div>
</template>

<script>
  import samples from '../../modules/samples.js'

    export default {
        name: "BillListPage",
        data(){
          return {samples:samples,params:{}};
        }
    }
</script>

<style scoped>

</style>
