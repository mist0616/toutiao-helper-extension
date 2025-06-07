function saveOptions() {
    const customTailText = document.getElementById('customTail').value;
    const customTailEnabled = document.getElementById('customTailEnabled').checked;
    const redirectUrl = document.getElementById('redirectUrl').value;
    const redirectEnabled = document.getElementById('redirectEnabled').checked;

    let operationsCompleted = 0;
    const totalOperations = 2;
    let G_HAS_ERROR = false;

    function finalizeSave() {
        operationsCompleted++;
        if (operationsCompleted === totalOperations) {
            const status = document.getElementById('status');
            if (!G_HAS_ERROR) {
                status.textContent = '设置已保存！';
                status.className = 'status-message success';
            }
            setTimeout(
                function () {
                    status.textContent = '';
                    status.className = 'status-message';
                },
                G_HAS_ERROR ? 4000 : 2500,
            );
            G_HAS_ERROR = false;
        }
    }

    function handleError(storageArea, error) {
        G_HAS_ERROR = true;
        const status = document.getElementById('status');
        let errorMessage = `保存 ${storageArea} 失败`;
        if (error && error.message) {
            if (
                storageArea.includes('sync') &&
                (error.message.includes('QUOTA_BYTES_PER_ITEM') ||
                    error.message.includes('QUOTA_BYTES'))
            ) {
                errorMessage = '同步设置失败：可能超出总存储限制。';
            } else {
                errorMessage += `: ${error.message}`;
            }
        } else if (error) {
            errorMessage += `: ${String(error)}`;
        }
        status.textContent = errorMessage;
        status.className = 'status-message error';
        console.error(`Error saving to ${storageArea}:`, error);
    }

    chrome.storage.local.set(
        {
            customTail: customTailText,
        },
        function () {
            if (chrome.runtime.lastError) {
                handleError('小尾巴内容 (本地)', chrome.runtime.lastError);
            } else {
                console.log('Custom tail saved to local storage.');
            }
            finalizeSave();
        },
    );

    chrome.storage.sync.set(
        {
            customTailEnabled: customTailEnabled,
            redirectUrl: redirectUrl,
            redirectEnabled: redirectEnabled,
        },
        function () {
            if (chrome.runtime.lastError) {
                handleError('其他设置 (同步)', chrome.runtime.lastError);
            } else {
                console.log('Other settings saved to sync storage.');
            }
            finalizeSave();
        },
    );
}

function restoreOptions() {
    chrome.storage.local.get(
        {
            customTail: '',
        },
        function (localItems) {
            if (chrome.runtime.lastError) {
                console.error(
                    'Error restoring customTail from local storage:',
                    chrome.runtime.lastError.message,
                );
            } else {
                if (document.getElementById('customTail')) {
                    document.getElementById('customTail').value = localItems.customTail || '';
                }
            }
        },
    );

    chrome.storage.sync.get(
        {
            customTailEnabled: false,
            redirectUrl: '',
            redirectEnabled: false,
        },
        function (syncItems) {
            if (chrome.runtime.lastError) {
                console.error(
                    'Error restoring settings from sync storage:',
                    chrome.runtime.lastError.message,
                );
            } else {
                if (document.getElementById('customTailEnabled')) {
                    document.getElementById('customTailEnabled').checked =
                        syncItems.customTailEnabled;
                }
                if (document.getElementById('redirectUrl')) {
                    document.getElementById('redirectUrl').value = syncItems.redirectUrl || '';
                }
                if (document.getElementById('redirectEnabled')) {
                    document.getElementById('redirectEnabled').checked = syncItems.redirectEnabled;
                }
            }
        },
    );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
