function createTailElement(index, tailData, isChecked) {
    const div = document.createElement('div');
    div.className = 'tail-item';
    // 优化: 使用更表意的SVG图标替换文字
    div.innerHTML = `
        <div class="tail-radio">
            <input type="radio" name="activeTail" value="${index}" ${isChecked ? 'checked' : ''}>
        </div>
        <div class="tail-content">
            <textarea class="tail-textarea" rows="10" placeholder="输入小尾巴内容...">${
                tailData.text
            }</textarea>
        </div>
        <button class="tail-delete" title="删除此项">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7L14.7294 5.18807C14.4671 3.86399 13.3055 3 12 3C10.6945 3 9.53292 3.86399 9.27059 5.18807L9 7H15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;

    // **重要**: 事件监听器现在加在SVG图标所在的按钮上
    div.querySelector('.tail-delete').addEventListener('click', function () {
        // 防止事件冒泡（如果需要）
        event.stopPropagation();

        const itemToRemove = this.closest('.tail-item');

        // 可选：添加一个删除动画
        itemToRemove.style.transition = 'all 0.3s ease';
        itemToRemove.style.opacity = '0';
        itemToRemove.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            itemToRemove.remove();

            // After removing, re-check if a radio button needs to be selected
            const container = document.getElementById('tails-list-container');
            const remainingRadios = container.querySelectorAll('input[type="radio"]');
            if (
                remainingRadios.length > 0 &&
                !container.querySelector('input[type="radio"]:checked')
            ) {
                remainingRadios[0].checked = true; // Select the first one if the active one was deleted
            }
            updatePlaceholderVisibility();
        }, 300);
    });

    return div;
}

function updatePlaceholderVisibility() {
    const container = document.getElementById('tails-list-container');
    const emptyState = container.querySelector('.empty-state');
    const hasItems = container.querySelector('.tail-item');

    if (!hasItems && !emptyState) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7H21M6 7H18V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V7ZM10 11V16M14 11V16M10 4H14M4 7H20" stroke="#8E8E93" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>暂无小尾巴，点击下方添加新项</p>
        `;
        container.appendChild(emptyDiv);
    } else if (hasItems && emptyState) {
        emptyState.remove();
    }
}

// --- Main Functions ---
function saveOptions() {
    const customTailEnabled = document.getElementById('customTailEnabled').checked;

    const tailsContainer = document.getElementById('tails-list-container');
    const tailItems = tailsContainer.querySelectorAll('.tail-item');

    const customTails = [];
    let activeTailIndex = -1;

    tailItems.forEach((item, index) => {
        const text = item.querySelector('textarea').value;
        customTails.push({ text: text });

        if (item.querySelector('input[type="radio"]').checked) {
            activeTailIndex = index;
        }
    });

    // If no tail is selected but there are tails, default to the first one
    if (activeTailIndex === -1 && customTails.length > 0) {
        activeTailIndex = 0;
    }

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
                () => {
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
        let errorMessage = `保存 ${storageArea} 失败: ${error ? error.message : '未知错误'}`;
        status.textContent = errorMessage;
        status.className = 'status-message error';
        console.error(`Error saving to ${storageArea}:`, error);
    }

    chrome.storage.local.set({ customTails: customTails }, function () {
        if (chrome.runtime.lastError) {
            handleError('小尾巴列表 (本地)', chrome.runtime.lastError);
        }
        finalizeSave();
    });

    chrome.storage.sync.set({ customTailEnabled, activeTailIndex }, function () {
        if (chrome.runtime.lastError) {
            handleError('启用状态和选择 (同步)', chrome.runtime.lastError);
        }
        finalizeSave();
    });
}

function restoreOptions() {
    chrome.storage.local.get({ customTails: [] }, function (localItems) {
        if (chrome.runtime.lastError) {
            console.error('Error restoring from local storage:', chrome.runtime.lastError.message);
            return;
        }

        chrome.storage.sync.get(
            { customTailEnabled: false, activeTailIndex: 0 },
            function (syncItems) {
                if (chrome.runtime.lastError) {
                    console.error(
                        'Error restoring from sync storage:',
                        chrome.runtime.lastError.message,
                    );
                    return;
                }

                document.getElementById('customTailEnabled').checked = syncItems.customTailEnabled;

                const container = document.getElementById('tails-list-container');
                container.innerHTML = ''; // Clear previous items

                const tails = localItems.customTails || [];
                if (tails.length > 0) {
                    tails.forEach((tail, index) => {
                        const isChecked = index === syncItems.activeTailIndex;
                        const tailElement = createTailElement(index, tail, isChecked);
                        container.appendChild(tailElement);
                    });
                }
                updatePlaceholderVisibility();
            },
        );
    });
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    restoreOptions();

    // 添加事件监听器
    document.getElementById('save').addEventListener('click', saveOptions);

    document.getElementById('addTail').addEventListener('click', function () {
        const container = document.getElementById('tails-list-container');
        const existingTailsCount = container.querySelectorAll('.tail-item').length;

        const isFirstTail = existingTailsCount === 0;
        const newTailElement = createTailElement(existingTailsCount, { text: '' }, isFirstTail);

        // Remove empty state if present
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        container.appendChild(newTailElement);
        newTailElement.querySelector('textarea').focus();
    });
});
