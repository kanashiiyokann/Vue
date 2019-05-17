<template>
  <div>
    <div v-viewer ref="body" class="body" style="margin: 50px;">
      <div class="left" ref="left">
        <div class="container">
          <div class="mask"></div>
          <img class="image" :src="data" style="border:1px solid red;">
        </div>
      </div>
      <div class="right" ref="right">
        <img class="popover" :src="data">
      </div>
    </div>
    fuck you
  </div>
</template>

<script>


  export default {
    name: 'imageViewer',
    props: {
      data: {type: String, required: true},
      scale: {type: Number, default: 1},
      width: {type: Number, default: 720},
      height: {type: Number, default: 420},
      space: {type: Number, default: 10}
    },
    data() {
      return {
        right: {visible: false},
        mask: {visible: false}
      };
    },
    mounted() {
      //初始化大小
      this.$refs.body.style.width = this.width + 'px';
      this.$refs.body.style.marginRight = this.space + 'px';
      this.$refs.body.style.height = this.height + 'px';
      this.$refs.left.style.width = this.width + 'px';
      this.$refs.left.style.marginRight = this.space + 'px';
      this.$refs.right.style.width = this.width / 2 + 'px';
      this.$refs.right.style.left = (this.width + this.space) + 'px';
    },
    directives: {
      viewer: {
        bind(el) {
          //组件元素
          let $body = el;
          let $container = $(".container");
          let $mask = $('.mask');
          let $right = $('.right');
          let $image = $(".image");
          let $popover = $('.popover');
          let scale = 1;
          //鼠标事件
          /**
           *  鼠标按下
           * */
          $container.addEventListener('mousedown', function (e) {
            switchControls("none");
          });
          /**
           *  鼠标弹起
           * */
          $container.addEventListener('mouseup', function () {
            switchControls("inline-block");
          });
          /**鼠标进入 */
          $container.addEventListener('mouseenter', function () {
            switchControls('inline-block');
          });
          /**鼠标离开 */
          $container.addEventListener('mouseleave', function () {
            switchControls('none');
          });

          /**鼠标移动 */
          $container.addEventListener('mousemove', function (e) {
            e = e || window.event;
            //which等于1表示左键按下
            if (e.which === 0) {
              locateMask();
            }
            e.preventDefault();
          });

          /**
           * 切换mask,right的显隐状态
           * @param state
           */
          function switchControls(state) {
            if (!state) {
              state = $mask.style.display === 'none' ? 'inline-block' : 'none';
            }
            $mask.style.display = state;
            $right.style.display = state;
          }

          /**
           * 重新定位mask的绝对位置
           */
          function locateMask() {
            let e = event || window.event;

            if ($mask.style.display === 'none') {
              switchControls();
            }
            //判断鼠标是否在image范围内


            if ($mask.style.display !== 'none') {
              //mask跟随鼠标移动
              let left, top;
              top = e.clientY - $body.getBoundingClientRect().top - $mask.clientHeight / 2;
              top = top < 0 ? 0 : top;
              top = top > $image.clientHeight - $mask.clientHeight ? $image.clientHeight - $mask.clientHeight : top;
              left = e.clientX - $body.getBoundingClientRect().left - $mask.clientWidth / 2;
              left = left > $image.clientWidth - $mask.clientWidth ? $image.clientWidth - $mask.clientWidth : left;
              left = left < 0 ? 0 : left;


              $mask.style.left = left + 'px';
              $mask.style.top = top + 'px';
              //右边图片随鼠标移动边距变化

              left = (e.clientX - $image.getBoundingClientRect().left - $image.clientWidth / 2) * scale ;
              top = (e.clientY - $image.getBoundingClientRect().top - $image.clientHeight/2) * scale ;

              $popover.style.top = ( top*-1) + 'px';
              $popover.style.left = (left*-1-$right.clientWidth) + 'px';
            }

          }

          /**
           *选择元素
           * @param selector
           * @returns {Element | any}
           */
          function $(selector) {
            return el.querySelector(selector);
          }
        }
      }
    }
  }
</script>

<style scoped>

  .body {
    position: relative;
  }

  div {
    display: inline-block;
  }

  .left {
    height: 100%;
    overflow: hidden;
    position: relative;
    z-index: 100;
    border: 1px solid #DCDFE6;
  }

  .right {
    height: 100%;
    border: 1px solid #DCDFE6;
    background: #ffffff;
    position: absolute;
    top: 0;
    overflow: hidden;
    z-index: 9999;
  }

  .mask {
    width: 100px;
    height: 100px;
    display: none;
    position: absolute;
    cursor: move;
    top: 0;
    left: 0;
    background: rgba(50, 153, 248, 0.4);
    z-index: 1000;
  }

  .body .image {
    display: block;
    height: 100%;

  }


  .body .right .popover {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
  }

  .container {
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 100;
    overflow: hidden;
  }

  .body img {
    transform-origin: center center;
    -ms-transform-origin: center center; /* IE 9 */
    -webkit-transform-origin: center center; /* Safari 和 Chrome */
    -moz-transform-origin: center center; /* Firefox */
    -o-transform-origin: center center; /* Opera */
  }
</style>
