<template>
  <div id="app">
    <el-form>
      <el-form-item label="fruit">
        <el-select v-model="fruit.selected.aux">
          <el-option v-for="option in options" :label="option" :value="option" :key="option"></el-option>
        </el-select>
      </el-form-item>
      <el-button @click="print">print</el-button>
    </el-form>

  </div>
</template>

<script>
  export default {
    name: "test",
    data() {
      return {options: ['orange', 'apple', 'banana'], fruit: {selected: {}, default: 'apple'}};
    },
    methods:{
      print(){
      console.log(this.fruit)
      }
    }
  }


</script>

<style scoped>

</style>
