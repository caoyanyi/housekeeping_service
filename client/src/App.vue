<script>
export default {
  onLaunch() {
    console.log('App Launch');
  },

  onShow() {
    console.log('App Show');
  },

  onHide() {
    console.log('App Hide');
  }
};
</script>

<style>
@import './static/style.css';

page,
view,
text,
image,
button,
input,
textarea,
scroll-view,
swiper,
swiper-item {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

page {
  font-size: 14px;
  color: #333;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
}
</style>
