const TARGET_URL_PATTERN = 'https://www.toutiao.com/article/*';
const TARGET_URL_PREFIX = 'https://www.toutiao.com/article/';

function updateActionIconState(tabId, url) {
    if (url && url.startsWith(TARGET_URL_PREFIX)) {
        chrome.action.enable(tabId);
    } else {
        chrome.action.disable(tabId);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('头条助手: Extension installed or updated.');
    chrome.contextMenus.create({
        id: 'copy-toutiao-image',
        title: '复制头条图片',
        contexts: ['image'],
        documentUrlPatterns: [TARGET_URL_PATTERN],
    });
    chrome.contextMenus.create({
        id: 'copy-toutiao-article',
        title: '复制头条文章',
        contexts: ['page'],
        documentUrlPatterns: [TARGET_URL_PATTERN],
    });

    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.id && tab.url) {
                updateActionIconState(tab.id, tab.url);
            }
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith(TARGET_URL_PREFIX)) {
        console.warn('头条助手: Context menu clicked on non-target page. Info:', info);
        return;
    }

    if (info.menuItemId === 'copy-toutiao-image') {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: imgUrl => {
                function showMessage(msg, type = 'info') {
                    const exist = document.getElementById('toutiao_helper_message');
                    if (exist) exist.remove();
                    const div = document.createElement('div');
                    div.id = 'toutiao_helper_message';
                    div.textContent = msg;

                    let backgroundColor;
                    let textColor = '#1d1d1f';

                    switch (type) {
                        case 'success':
                            backgroundColor = 'rgba(52, 199, 89, 0.85)';
                            textColor = '#ffffff';
                            break;
                        case 'error':
                            backgroundColor = 'rgba(255, 59, 48, 0.85)';
                            textColor = '#ffffff';
                            break;
                        case 'info':
                        default:
                            backgroundColor = 'rgba(229, 229, 234, 0.85)';
                            break;
                    }

                    div.style.cssText = `
                        position: fixed;
                        z-index: 2147483647;
                        left: 50%;
                        top: 25px;
                        transform: translateX(-50%);
                        max-width: 300px;
                        padding: 12px 20px;
                        color: ${textColor};
                        background-color: ${backgroundColor};
                        border-radius: 14px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                        font-size: 14px;
                        font-weight: 500;
                        line-height: 1.4;
                        opacity: 0;
                        transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                        pointer-events: none;
                        -webkit-backdrop-filter: blur(18px);
                        backdrop-filter: blur(18px);
                        text-align: center;
                    `;
                    div.style.transform = 'translateX(-50%) translateY(-20px)';

                    document.body.appendChild(div);

                    setTimeout(() => {
                        div.style.opacity = '1';
                        div.style.transform = 'translateX(-50%) translateY(0)';
                    }, 10);

                    setTimeout(() => {
                        div.style.opacity = '0';
                        div.style.transform = 'translateX(-50%) translateY(-20px)';
                        setTimeout(() => div.remove(), 350);
                    }, 3000);
                }

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
                        canvas.toBlob(async blob => {
                            if (!blob) {
                                showMessage('图片处理失败 (blob is null)', 'error');
                                console.error('Canvas toBlob resulted in null blob.');
                                return;
                            }
                            try {
                                await navigator.clipboard.write([
                                    new window.ClipboardItem({ 'image/png': blob }),
                                ]);
                                showMessage('复制成功', 'success');
                            } catch (e) {
                                showMessage('复制失败：' + e.message, 'error');
                                console.error('Clipboard write error:', e);
                            }
                        }, 'image/png');
                    } catch (e) {
                        showMessage('图片加载失败：' + e.message, 'error');
                        console.error('Image load error:', e);
                    }
                }
                if (imgUrl) {
                    cropAndCopyImage(imgUrl);
                } else {
                    showMessage('未找到图片链接', 'error');
                    console.warn('头条助手: No image URL provided for copy-toutiao-image.');
                }
            },
            args: [info.srcUrl],
        });
    }

    if (info.menuItemId === 'copy-toutiao-article') {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                function showMessage(msg, type = 'info') {
                    const exist = document.getElementById('toutiao_helper_message');
                    if (exist) exist.remove();
                    const div = document.createElement('div');
                    div.id = 'toutiao_helper_message';
                    div.textContent = msg;

                    let backgroundColor;
                    let textColor = '#1d1d1f';

                    switch (type) {
                        case 'success':
                            backgroundColor = 'rgba(52, 199, 89, 0.85)';
                            textColor = '#ffffff';
                            break;
                        case 'error':
                            backgroundColor = 'rgba(255, 59, 48, 0.85)';
                            textColor = '#ffffff';
                            break;
                        case 'info':
                        default:
                            backgroundColor = 'rgba(229, 229, 234, 0.85)';
                            break;
                    }

                    div.style.cssText = `
                        position: fixed;
                        z-index: 2147483647;
                        left: 50%;
                        top: 25px;
                        transform: translateX(-50%);
                        max-width: 300px;
                        padding: 12px 20px;
                        color: ${textColor};
                        background-color: ${backgroundColor};
                        border-radius: 14px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                        font-size: 14px;
                        font-weight: 500;
                        line-height: 1.4;
                        opacity: 0;
                        transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                        pointer-events: none;
                        -webkit-backdrop-filter: blur(18px);
                        backdrop-filter: blur(18px);
                        text-align: center;
                    `;
                    div.style.transform = 'translateX(-50%) translateY(-20px)';

                    document.body.appendChild(div);

                    setTimeout(() => {
                        div.style.opacity = '1';
                        div.style.transform = 'translateX(-50%) translateY(0)';
                    }, 10);

                    setTimeout(() => {
                        div.style.opacity = '0';
                        div.style.transform = 'translateX(-50%) translateY(-20px)';
                        setTimeout(() => div.remove(), 350);
                    }, 3000);
                }

                const title =
                    document.querySelector('.article-content h1')?.innerText ||
                    document.querySelector('h1.article-title')?.innerText ||
                    document.title;
                const articleBodySelectors = [
                    '.article-content article p',
                    'article#article-content p',
                    '.article-container .article-content p',
                    '.tt-article-content p',
                    'div[data-testid="article-content"] p',
                ];
                let ps;
                for (const selector of articleBodySelectors) {
                    ps = document.querySelectorAll(selector);
                    if (ps && ps.length > 0) break;
                }
                if (!ps || ps.length === 0) {
                    const articleMain =
                        document.querySelector('article') ||
                        document.querySelector('[role="article"]') ||
                        document.querySelector('.article-content') ||
                        document.body;
                    ps = articleMain.querySelectorAll('p');
                }

                let content = '';
                if (ps) {
                    ps.forEach(p => {
                        const pText = p.innerText?.trim();
                        if (pText) {
                            if (
                                !p.closest('.share-list-container') &&
                                !p.closest('.pgc-enhance-card')
                            ) {
                                content += pText + '\n';
                            }
                        }
                    });
                }

                if (content.trim() === '') {
                    showMessage('未能提取到文章内容', 'error');
                    console.warn('头条助手: Content extraction failed. Title:', title);
                    return;
                }

                const text = title.trim() + '\n\n' + content.trim();
                navigator.clipboard
                    .writeText(text)
                    .then(() => {
                        showMessage('复制成功', 'success');
                    })
                    .catch(e => {
                        showMessage('复制失败：' + e.message, 'error');
                        console.error('Clipboard writeText error:', e);
                    });
            },
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || (changeInfo.status === 'complete' && tab.url)) {
        updateActionIconState(tabId, tab.url || changeInfo.url);
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (chrome.runtime.lastError) {
            console.warn(
                `头条助手: Error getting tab ${activeInfo.tabId}: ${chrome.runtime.lastError.message}`,
            );
            return;
        }
        if (tab && tab.id && tab.url) {
            updateActionIconState(tab.id, tab.url);
        }
    });
});
