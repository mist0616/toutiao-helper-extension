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
        default:
            backgroundColor = 'rgba(242, 242, 247, 0.75)';
            textColor = '#1d1d1f';
            break;
    }
    div.style.cssText = `position: fixed; z-index: 2147483647; left: 50%; top: 25px; transform: translateX(-50%); max-width: 320px; padding: 12px 22px; color: ${textColor}; background-color: ${backgroundColor}; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18), 0 5px 12px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; font-weight: 500; line-height: 1.45; opacity: 0; transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); text-align: center;`;
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
    }, 4000);
}

async function cropImage(url) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const pixelsToCrop = Math.max(Math.round(height * 0.1), 100);
            const cropHeight = height - pixelsToCrop;
            if (cropHeight <= 0) {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = cropHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, cropHeight, 0, 0, width, cropHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = err => reject(new Error('Image load error: ' + url));
    });
}
