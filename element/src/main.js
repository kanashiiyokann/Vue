import Vue from 'vue'
import el from 'element-ui'
import timer from './components/common/Timer'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
Vue.use(el);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  data() {
    return {};
  },
  components: {timer},
  template: '<timer :time="60"/>'
})



