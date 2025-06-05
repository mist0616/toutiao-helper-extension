// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-image',
    title: '复制图片',
    contexts: ['image']
  });
  chrome.contextMenus.create({
    id: 'copy-article',
    title: '复制文章',
    contexts: ['page']
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copy-image') {
    // 注入裁剪并复制图片的函数到当前页面
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (imgUrl) => {
        // 通用 message 弹窗
        function showMessage(msg, type = 'info') {
          const exist = document.getElementById('toutiao_helper_message');
          if (exist) exist.remove();
          const div = document.createElement('div');
          div.id = 'toutiao_helper_message';
          div.textContent = msg;
          div.style.cssText = `
            position: fixed;
            z-index: 999999;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            max-width: 200px;
            padding: 6px 14px;
            color: #fff;
            background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#333'};
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            font-size: 13px;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
          `;
          document.body.appendChild(div);
          setTimeout(() => { div.style.opacity = '1'; }, 10);
          setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
          }, 3000);
        }
    
        // 裁剪并复制图片函数
        async function cropAndCopyImage(url) {
          try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            const width = img.width;
            const height = img.height;
            const cropHeight = Math.max(0, Math.round(height * 0.9));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = cropHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, cropHeight, 0, 0, width, cropHeight);
            canvas.toBlob(async (blob) => {
              try {
                await navigator.clipboard.write([
                  new window.ClipboardItem({ 'image/png': blob })
                ]);
                showMessage('复制成功', 'success');
              } catch (e) {
                showMessage('复制失败：' + e.message, 'error');
                console.log('e.message', e.message);
              }
            }, 'image/png');
          } catch (e) {
            showMessage('图片加载失败：' + e.message, 'error');
            console.log('e.message', e.message);
          }
        }
        cropAndCopyImage(imgUrl);
      },
      args: [info.srcUrl]
    });
  }
  if (info.menuItemId === 'copy-article') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        function showMessage(msg, type = 'info') {
          const exist = document.getElementById('toutiao_helper_message');
          if (exist) exist.remove();
          const div = document.createElement('div');
          div.id = 'toutiao_helper_message';
          div.textContent = msg;
          div.style.cssText = `
            position: fixed;
            z-index: 999999;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            max-width: 200px;
            padding: 6px 14px;
            color: #fff;
            background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#333'};
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            font-size: 13px;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
          `;
          document.body.appendChild(div);
          setTimeout(() => { div.style.opacity = '1'; }, 10);
          setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
          }, 3000);
        }
        // 复制文章内容
        const title = document.querySelector('.article-content h1')?.innerText || '';
        const ps = document.querySelectorAll('.article-content article p');
        let content = '';
        ps.forEach(p => {
          content += p.innerText + '\n';
        });
        const text = title + '\n\n' + content;
        navigator.clipboard.writeText(text).then(() => {
          showMessage('复制成功', 'success');
        }).catch(e => {
          showMessage('复制失败：' + e.message, 'error');
          console.log('e.message', e.message);
        });
      }
    });
  }
}); 