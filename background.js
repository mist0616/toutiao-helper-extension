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

                                if (
                                    combinedSettings.customTailEnabled &&
                                    savedTail &&
                                    savedTail.trim() !== ''
                                ) {
                                    articleTextToCopy += '\n\n' + savedTail.trim();
                                }

                                navigator.clipboard
                                    .writeText(articleTextToCopy)
                                    .then(() => {
                                        showMessage('复制成功', 'success');
                                        resolveScript(true);
                                    })
                                    .catch(e => {
                                        showMessage('复制失败：' + e.message, 'error');
                                        console.error('Clipboard writeText error:', e);
                                        resolveScript(false);
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
                    injectionResults[0].result === true // 检查脚本是否成功
                ) {
                    // 使用 async 函数以便使用 await
                    chrome.storage.sync.get(['redirectEnabled', 'redirectUrl'], async settings => {
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
                                .filter(url => url);

                            if (urlsToOpen.length > 0) {
                                console.log(
                                    `头条助手: 复制成功，准备打开 ${urlsToOpen.length} 个链接并分组。`,
                                );

                                try {
                                    const newTabs = await Promise.all(
                                        urlsToOpen.map(url =>
                                            chrome.tabs.create({ url, active: false }),
                                        ),
                                    );

                                    const tabIds = newTabs.map(tab => tab.id).filter(id => id);

                                    if (tabIds.length > 0) {
                                        const groupId = await chrome.tabs.group({ tabIds });

                                        await chrome.tabGroups.update(groupId, {
                                            title: '头条助手',
                                            color: 'blue',
                                        });

                                        await chrome.tabs.update(tabIds[0], { active: true });

                                        console.log(
                                            `头条助手: 已将 ${tabIds.length} 个标签页放入分组 ${groupId}。`,
                                        );
                                    }
                                } catch (e) {
                                    console.error('头条助手: 创建标签页或分组时出错:', e);
                                }
                            } else {
                                console.log('头条助手: 复制成功，但未配置有效的目标链接。');
                            }
                        } else {
                            console.log('头条助手: 复制成功，但跳转未启用或未设置目标链接。');
                        }
                    });
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
