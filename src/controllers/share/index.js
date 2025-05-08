import { appHost } from '../../components/apphost';
import globalize from '../../lib/globalize';
import artplayer from "./artplayer"

export default function (view, params) {
  console.log("params", params)
  console.log("artplayer", artplayer)
  const item_id = params.itemId
  const seconds = params.seconds

  const api_key = '28acc80efa3f4fdd9c54493b4641f8cc'
  const server = 'http://localhost:8096'

  view.addEventListener('viewshow', function () {
    let stream_video = `${server}/Items/${item_id}/Download?api_key=${api_key}`

    // 初始化页面
    init(stream_video, seconds);
  });

  function init(url, seconds) {
    // TODO: 在这里添加页面初始化逻辑
    const art = new Artplayer({
      container: '.artplayer-app',
      url: url,
      autoplay: false,
      type: 'mp4', // 明确指定类型为 mp4（可选）
    });

    art.on('ready', () => {
      console.info(art.duration);
      console.info(art.currentTime);
      art.currentTime = seconds;
      console.info(art.currentTime);
    });
  }
} 