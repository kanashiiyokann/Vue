// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import billInfo from './components/bill/billInfo'
import test from './components/test'
import router from './router'
import el from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import storage from './modules/storage.js'

Vue.config.productionTip = false
Vue.use(el);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: {billInfo,test},
  template: '<billInfo/>'
})

let customers = [
  {id: 1, name: '孙上峰'},
  {id: 2, name: '孙胜腾'},
  {id: 3, name: '赵友文'},
];
let appliers = [
  {id: 1, name: '成都膳轩食品有限公司'},
  {id: 2, name: '四川芊村道食品有限公司'},
  {id: 3, name: '顶呱呱食品有限公司'},
];
storage.save("customers", customers);
storage.save("appliers", appliers);


