<template>
  <div>
    <el-card ref="header" class="card">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="params.period">
            <el-option v-for="period in periodList" :key="period" :value="period" :label="period"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="票据状态">
          <el-select v-model="params.state">
            <el-option value="" label="全部"></el-option>
            <el-option v-for="state in stateList" :key="state.value" :value="state.value"
                       :label="state.text"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="票据类型">
          <el-select v-model="params.type">
            <el-option value="" label="全部"></el-option>
            <el-option v-for="type in templateTypeList" :key="type.id" :value="type.id"
                       :label="type.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="记账状态">
          <el-select v-model="params.accounted">
            <el-option value="" label="全部"></el-option>
            <el-option v-for="accountedState in accountedStateList" :key="accountedState.value"
                       :value="accountedState.value" :label="accountedState.text"></el-option>
          </el-select>
        </el-form-item>
        <el-button type="primary" size="small">查询</el-button>
        <el-button size="small">清空</el-button>
      </el-form>
    </el-card>
    <el-card ref="body" class="card">
      <el-row style="margin-bottom: 12px;">
        <el-button type="small">汇总生产凭证</el-button>
        <el-button type="small">退回</el-button>
        <el-button type="small">跨期</el-button>
        <el-button type="small">删除</el-button>
        <template v-for="statistics in billStatistics">
          <span class="statistics-name">{{statistics.name}}</span>
          <span class="statistics-count">{{statistics.count}}</span>
        </template>
      </el-row>
      <el-table class="table" :data="billList" :show-overflow-tooltip="true" :border="true"
                :highlight-current-row="true" header-row-class-name="table-header" size="small">
        <el-table-column align="center" type="selection" width="50"></el-table-column>
        <!--        <el-table-column align="center"  type="index" :index="autoIndex" label="序号" width="80"></el-table-column>-->
        <el-table-column align="center" prop="no" label="编号">
        </el-table-column>
        <el-table-column align="center" label="票据影像">
          <template slot-scope="scope">
            <el-popover placement="right" :open-delay="400" trigger="hover" style="overflow: hidden;" >
              <img :src="scope.row.imageUrl" class="img-popover">
              <div slot="reference" >
                <img :src="scope.row.imageUrl" class="img-cell">
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="info.type" label="票据类型"></el-table-column>
        <el-table-column align="center" prop="info.summary" label="摘要"></el-table-column>
        <el-table-column align="center" prop="date" label="票据日期"></el-table-column>
        <el-table-column align="center" label="状态" width="160">
          <template slot-scope="scope">{{accountedStateMap[scope.row.state]}}</template>
        </el-table-column>
        <el-table-column prop="associatedVoucherNo" label="关联凭证" align="center" width="120"></el-table-column>

      </el-table>
    </el-card>

  </div>
</template>

<script>
  import samples from '../../modules/samples.js'

  export default {
    name: "BillListPage",
    data() {
      return samples;
    },
    methods: {
      autoIndex(index) {
        return index + 1;
      }
    },
    mounted() {
      if (this.stateList) {
        this.stateMap = {};
        this.stateList.forEach(state => this.stateMap[state.value] = state.text);
      }
      if (this.accountedStateList) {
        this.accountedStateMap = {};
        this.accountedStateList.forEach(state => this.accountedStateMap[state.value] = state.text);
      }
    }
  }
</script>

<style scoped>
  .statistics-name {
    margin-left: 10px;
    font-weight: bolder;
    font-size: 12px;
  }

  .statistics-count {
    margin-left: 5px;
    color: red;
    font-size: 12px;
  }

  .img-cell {
    width: 200px;
    height: 100px;
  }

  .table-header {
    background-color: rgba(0, 0, 255, 0.61);
    color: black;
  }

  .card {
    padding: 3px;
    margin-bottom: 10px;
  }
  .img-popover {
    width: 800px;
    max-height: 400px;
  }
</style>
