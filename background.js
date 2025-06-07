const TARGET_URL_PATTERN = 'https://www.toutiao.com/article/*';
const TARGET_URL_PREFIX = 'https://www.toutiao.com/article/';

chrome.runtime.onInstalled.addListener(() => {
    console.log('头条助手: Extension installed or updated.');
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'copy-image',
            title: '复制图片',
            contexts: ['image'],
            documentUrlPatterns: [TARGET_URL_PATTERN],
        });
        chrome.contextMenus.create({
            id: 'copy-article',
            title: '复制文章',
            contexts: ['page'],
            documentUrlPatterns: [TARGET_URL_PATTERN],
        });
        chrome.contextMenus.create({
            id: 'copy-all-images',
            title: '复制所有图片',
            contexts: ['page'],
            documentUrlPatterns: [TARGET_URL_PATTERN],
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith(TARGET_URL_PREFIX)) {
        return;
    }

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ['content-helpers.js'],
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(`注入脚本失败: ${chrome.runtime.lastError.message}`);
                return;
            }

            if (info.menuItemId === 'copy-image') {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: copySingleImage,
                    args: [info.srcUrl],
                });
            }

            if (info.menuItemId === 'copy-all-images') {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: copyAllImages,
                });
            }

            if (info.menuItemId === 'copy-article') {
                chrome.storage.sync.get(
                    ['customTailEnabled', 'redirectEnabled', 'redirectUrl'],
                    syncItems => {
                        chrome.storage.local.get(['customTail'], localItems => {
                            const settings = { ...syncItems, ...localItems };

                            chrome.scripting.executeScript(
                                {
                                    target: { tabId: tab.id },
                                    func: copyArticle,
                                    args: [settings],
                                },
                                results => {
                                    if (
                                        results &&
                                        results[0] &&
                                        results[0].result &&
                                        settings.redirectEnabled
                                    ) {
                                        handleRedirect(tab, settings.redirectUrl);
                                    }
                                },
                            );
                        });
                    },
                );
            }
        },
    );
});

// 为了代码清晰，将注入的函数提取出来
// 这些函数将在页面环境中被 toString() 并执行

function copySingleImage(imgUrl) {
    if (!imgUrl) {
        showMessage('未找到图片链接', 'error');
        return;
    }
    try {
        showMessage('正在裁剪图片...', 'info');
        cropImage(imgUrl).then(dataUrl => {
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    navigator.clipboard
                        .write([new window.ClipboardItem({ 'image/png': blob })])
                        .then(() => showMessage('复制成功', 'success'))
                        .catch(e => showMessage(`复制失败: ${e.message}`, 'error'));
                });
        });
    } catch (e) {
        showMessage('复制失败：' + e.message, 'error');
        console.error('Single image copy error:', e);
    }
}

function copyAllImages() {
    const imageSelector = '.article-content .pgc-img img';
    const imageElements = document.querySelectorAll(imageSelector);

    if (!imageElements || imageElements.length === 0) {
        showMessage('未找到任何图片', 'error');
        return;
    }
    showMessage(`找到 ${imageElements.length} 张图片，正在裁剪处理...`, 'info');
    const imagePromises = Array.from(imageElements).map(img => {
        if (!img.src) return Promise.resolve(null);
        return cropImage(img.src)
            .then(dataUrl => `<img src="${dataUrl}"><br>`)
            .catch(err => null);
    });

    Promise.all(imagePromises)
        .then(imageHtmls => {
            const finalHtml = imageHtmls.filter(Boolean).join('');
            if (!finalHtml) throw new Error('所有图片处理失败');
            const blob = new Blob([finalHtml], { type: 'text/html' });
            navigator.clipboard
                .write([new ClipboardItem({ 'text/html': blob })])
                .then(() => showMessage('复制成功', 'success'))
                .catch(e => showMessage(`复制失败: ${e.message}`, 'error'));
        })
        .catch(error => {
            showMessage(`复制失败: ${error.message}`, 'error');
        });
}

function copyArticle(settings) {
    const title =
        document.querySelector('.article-content h1')?.innerText ||
        document.querySelector('h1.article-title')?.innerText ||
        document.title;
    const pSelector = '.article-content p';
    const ps = document.querySelectorAll(pSelector);

    let content = '';
    if (ps.length > 0) {
        ps.forEach(p => {
            const pText = p.innerText?.trim();
            if (pText && !p.closest('.share-list-container') && !p.closest('.pgc-enhance-card')) {
                content += pText + '\n';
            }
        });
    }

    if (content.trim() === '') {
        showMessage('未能提取到文章内容', 'error');
        return false;
    }

    let articleTextToCopy = title.trim() + '\n\n' + content.trim();
    if (settings.customTailEnabled && settings.customTail && settings.customTail.trim() !== '') {
        articleTextToCopy += '\n\n' + settings.customTail.trim();
    }

    navigator.clipboard
        .writeText(articleTextToCopy)
        .then(() => showMessage('复制成功', 'success'))
        .catch(e => showMessage('复制失败：' + e.message, 'error'));

    return true;
}

async function handleRedirect(originalTab, redirectUrl) {
    if (!originalTab || !originalTab.id) return;
    const urlsToOpen = [originalTab.url];
    if (redirectUrl && redirectUrl.trim() !== '') {
        urlsToOpen.push(
            ...redirectUrl
                .split(',')
                .map(url => url.trim())
                .filter(Boolean),
        );
    }
    try {
        const newTabs = await Promise.all(
            urlsToOpen.map(url => chrome.tabs.create({ url, active: false })),
        );
        const tabIds = newTabs.map(t => t.id).filter(Boolean);
        if (tabIds.length > 0) {
            const groupId = await chrome.tabs.group({ tabIds });
            await chrome.tabGroups.update(groupId, { title: '头条助手', color: 'blue' });
            await chrome.tabs.update(tabIds[1] || tabIds[0], { active: true });
            await chrome.tabs.remove(originalTab.id);
        }
    } catch (e) {
        console.error('头条助手: 创建/分组标签页或关闭原始标签页时出错:', e);
    }
}

chrome.action.onClicked.addListener(tab => {
    chrome.runtime.openOptionsPage();
});
