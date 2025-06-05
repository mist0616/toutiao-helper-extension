// background.js

const TARGET_URL_PATTERN = 'https://www.toutiao.com/article/*';
const TARGET_URL_PREFIX = 'https://www.toutiao.com/article/';

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
                            backgroundColor = 'rgba(52, 199, 89, 0.75)';
                            textColor = '#ffffff';
                            break;
                        case 'error':
                            backgroundColor = 'rgba(255, 59, 48, 0.75)';
                            textColor = '#ffffff';
                            break;
                        case 'info':
                        default:
                            backgroundColor = 'rgba(242, 242, 247, 0.75)';
                            textColor = '#1d1d1f';
                            break;
                    }
                    div.style.cssText = `
                        position: fixed; z-index: 2147483647; left: 50%; top: 25px; transform: translateX(-50%);
                        max-width: 320px; padding: 12px 22px; color: ${textColor}; background-color: ${backgroundColor};
                        border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.15);
                        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18), 0 5px 12px rgba(0,0,0,0.15);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 14.5px; font-weight: 500; line-height: 1.45; opacity: 0;
                        transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                        pointer-events: none; -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); text-align: center;`;
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
                    console.warn('头条助手: No image URL for copy-toutiao-image.');
                }
            },
            args: [info.srcUrl],
        });
    }

    if (info.menuItemId === 'copy-toutiao-article') {
        chrome.scripting
            .executeScript({
                target: { tabId: tab.id },
                func: () => {
                    return new Promise(resolveScript => {
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
                                    backgroundColor = 'rgba(52, 199, 89, 0.75)';
                                    textColor = '#ffffff';
                                    break;
                                case 'error':
                                    backgroundColor = 'rgba(255, 59, 48, 0.75)';
                                    textColor = '#ffffff';
                                    break;
                                case 'info':
                                default:
                                    backgroundColor = 'rgba(242, 242, 247, 0.75)';
                                    textColor = '#1d1d1f';
                                    break;
                            }
                            div.style.cssText = `
                            position: fixed; z-index: 2147483647; left: 50%; top: 25px; transform: translateX(-50%);
                            max-width: 320px; padding: 12px 22px; color: ${textColor}; background-color: ${backgroundColor};
                            border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.15);
                            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18), 0 5px 12px rgba(0,0,0,0.15);
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            font-size: 14.5px; font-weight: 500; line-height: 1.45; opacity: 0;
                            transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                            pointer-events: none; -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); text-align: center;`;
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
                            resolveScript(false);
                            return;
                        }

                        let combinedSettings = {};
                        chrome.storage.local.get(['customTail'], function (localItems) {
                            if (chrome.runtime.lastError) {
                                console.error(
                                    '头条助手: Error getting customTail from local storage:',
                                    chrome.runtime.lastError.message,
                                );
                                showMessage('复制失败：无法读取小尾巴内容(L)', 'error');
                                resolveScript(false);
                                return;
                            }
                            combinedSettings.customTail = localItems.customTail;

                            chrome.storage.sync.get(['customTailEnabled'], function (syncItems) {
                                if (chrome.runtime.lastError) {
                                    console.error(
                                        '头条助手: Error getting customTailEnabled from sync storage:',
                                        chrome.runtime.lastError.message,
                                    );
                                    showMessage('复制失败：无法读取小尾巴状态(S)', 'error');
                                    resolveScript(false);
                                    return;
                                }
                                combinedSettings.customTailEnabled = syncItems.customTailEnabled;

                                let articleTextToCopy = title.trim() + '\n\n' + content.trim();
                                const savedTail = combinedSettings.customTail;
                                const tailEnabled =
                                    combinedSettings.customTailEnabled === undefined
                                        ? true
                                        : combinedSettings.customTailEnabled;

                                if (tailEnabled && savedTail && savedTail.trim() !== '') {
                                    articleTextToCopy += '\n\n' + savedTail.trim();
                                }

                                navigator.clipboard
                                    .writeText(articleTextToCopy)
                                    .then(() => {
                                        showMessage('复制成功', 'success');
                                        resolveScript(true); // Signal success for redirection
                                    })
                                    .catch(e => {
                                        showMessage('复制失败：' + e.message, 'error');
                                        console.error('Clipboard writeText error:', e);
                                        resolveScript(false); // Signal failure
                                    });
                            });
                        });
                    });
                },
            })
            .then(injectionResults => {
                if (chrome.runtime.lastError) {
                    console.error(
                        '头条助手: Script injection failed: ',
                        chrome.runtime.lastError.message,
                    );
                    return;
                }

                if (
                    injectionResults &&
                    injectionResults[0] &&
                    injectionResults[0].result === true // Check if script signaled success
                ) {
                    chrome.storage.sync.get(['redirectEnabled', 'redirectUrl'], settings => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                '头条助手: Error getting redirect settings:',
                                chrome.runtime.lastError.message,
                            );
                            return;
                        }

                        if (
                            settings.redirectEnabled &&
                            settings.redirectUrl &&
                            settings.redirectUrl.trim() !== ''
                        ) {
                            const urlsToOpen = settings.redirectUrl
                                .split(',')
                                .map(url => url.trim())
                                .filter(url => url !== ''); // Clean up and filter empty strings

                            if (urlsToOpen.length > 0) {
                                console.log(
                                    `头条助手: 复制成功，准备打开 ${urlsToOpen.length} 个链接.`,
                                );

                                // Open the first URL as the active tab
                                const firstUrl = urlsToOpen.shift(); // Get and remove the first URL
                                console.log(`头条助手: 打开当前标签页: ${firstUrl}`);
                                chrome.tabs.create({ url: firstUrl, active: true }, newTab => {
                                    if (chrome.runtime.lastError) {
                                        console.warn(
                                            `头条助手: 创建新标签页失败 (active): ${firstUrl}`,
                                            chrome.runtime.lastError.message,
                                        );
                                    } else {
                                        console.log(
                                            `头条助手: 新标签页已打开 (active): ${newTab.id} for ${firstUrl}`,
                                        );
                                    }
                                });

                                // Open remaining URLs in background tabs
                                urlsToOpen.forEach(url => {
                                    console.log(`头条助手: 打开后台标签页: ${url}`);
                                    chrome.tabs.create({ url: url, active: false }, newTab => {
                                        if (chrome.runtime.lastError) {
                                            console.warn(
                                                `头条助手: 创建新标签页失败 (background): ${url}`,
                                                chrome.runtime.lastError.message,
                                            );
                                        } else {
                                            console.log(
                                                `头条助手: 新标签页已打开 (background): ${newTab.id} for ${url}`,
                                            );
                                        }
                                    });
                                });
                            } else {
                                console.log('头条助手: 复制成功，但未配置有效的目标链接。');
                            }
                        } else {
                            console.log('头条助手: 复制成功，但跳转未启用或未设置目标链接。');
                        }
                    });
                } else {
                    // console.log("头条助手: 复制操作未成功或未发出跳转信号。");
                }
            })
            .catch(err => {
                console.error('头条助手: 执行脚本或后续跳转逻辑时出错: ', err);
            });
    }
});

chrome.action.onClicked.addListener(tab => {
    chrome.runtime.openOptionsPage();
});
