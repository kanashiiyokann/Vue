// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import el from 'element-ui'
import login from './components/login/Login'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
Vue.use(el);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  data() {
    return {
      img1: 'https://testdggoss1.oss-cn-beijing.aliyuncs.com/86feca9b-cc55-44e9-8381-857559dc75e1.jpg',
      img2: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1558779551&di=0db67f52a2d664fb17ff1d2ea741e3bc&imgtype=jpg&er=1&src=http%3A%2F%2Fi0.hdslb.com%2Fbfs%2Farticle%2Fdaae29cad3d6a36f5619a692f0450f0501c76a4e.png'
    };
  },
  components: {login},
  template: '<login />'
})



