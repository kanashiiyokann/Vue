// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import billInfo from './components/bill/billInfo'
import billListPage from './components/bill/billListPage'
import imageViewer from './components/bill/imageViewer'
import el from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import storage from './modules/storage.js'

Vue.config.productionTip = false
Vue.use(el);

let customers = [
  {id: 1, code: "001", name: '孙上峰'},
  {id: 2, code: "002", name: '孙胜腾'},
  {id: 3, code: "003", name: '赵友文'},
];
let appliers = [
  {id: 1, code: "001",name: '成都膳轩食品有限公司名字很长的那种公司成都膳轩食品有限公司名字很长的那种公司'},
  {id: 2,code: "002", name: '四川芊村道食品有限公司'},
  {id: 3,code: "003", name: '顶呱呱食品有限公司'},
];
storage.save("customers", customers);
storage.save("appliers", appliers);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  data() {
    return {img:'https://testdggoss1.oss-cn-beijing.aliyuncs.com/86feca9b-cc55-44e9-8381-857559dc75e1.jpg'};
  },
  components: {billInfo, imageViewer,billListPage},
  template: '<imageViewer :data="img" :scale="1.5"/>'
})



