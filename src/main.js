import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'


// import ElementUI from 'element-ui';
// Vue.use(ElementUI);
import 'element-ui/lib/theme-chalk/index.css';

import { Button, Select, Input, Progress, Card, Col,Row,Message} from 'element-ui';
Vue.use(Button)
Vue.use(Select)
Vue.use(Input)
Vue.use(Progress)
Vue.use(Card)
Vue.use(Col)
Vue.use(Row)
// Vue.use(Message)
Vue.prototype.$message = Message
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
