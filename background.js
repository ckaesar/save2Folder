// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveText',
    title: '保存选中文本',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'saveImage',
    title: '保存图片',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'saveLink',
    title: '保存文件',
    contexts: ['link']
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'saveText':
      handleSaveText(info.selectionText);
      break;
    case 'saveImage':
      handleSaveImage(info.srcUrl);
      break;
    case 'saveLink':
      handleSaveFile(info.linkUrl);
      break;
  }
});

// 保存文本内容
async function handleSaveText(text) {
  console.log('开始保存文本:', text);
  try {
    const { saveDirectory } = await chrome.storage.sync.get(['saveDirectory']);
    if (!saveDirectory) {
      console.log('未设置保存目录，打开设置页面');
      chrome.runtime.openOptionsPage();
      return;
    }

    // 转换路径格式，确保路径格式正确
    let normalizedPath = saveDirectory
      .replace(/^[A-Za-z]:\?/, '') // 移除驱动器号（如 C:\）
      .replace(/^[/]+/, '') // 移除开头的斜杠或反斜杠
      .replace(/\\/g, '/') // 将反斜杠转换为正斜杠
      .trim(); // 移除首尾空格

    // 确保路径不以斜杠开头或结尾
    normalizedPath = normalizedPath.replace(/^\/?|\/$/, '');

    // 使用固定文件名
    const filename = 'saved_text.txt';
    const timestamp = new Date().toLocaleString();

    // 构建完整的下载路径
    const downloadPath = normalizedPath ? `${normalizedPath}/${filename}` : filename;

    // 构建要保存的内容
    const content = `[${timestamp}]\n${text}\n---\n`;

    // 使用TextEncoder和base64编码处理文本内容
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(content);
    const base64Data = 'data:text/plain;base64,' + btoa(String.fromCharCode.apply(null, uint8Array));
    
    console.log('准备下载文件:', downloadPath);
    chrome.downloads.download({
      url: base64Data,
      filename: downloadPath,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '保存失败',
          message: `文件保存失败: ${chrome.runtime.lastError.message}`
        });
      } else {
        console.log('开始下载，ID:', downloadId);
      }
    });
  } catch (error) {
    console.error('保存文件时出错:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '保存失败',
      message: `文件保存失败: ${error.message}`
    });
  }
}

// 保存图片
async function handleSaveImage(imageUrl) {
  const { saveDirectory } = await chrome.storage.sync.get(['saveDirectory']);
  if (!saveDirectory) {
    chrome.runtime.openOptionsPage();
    return;
  }

  // 转换路径格式，确保路径格式正确
  let normalizedPath = saveDirectory
    .replace(/^[A-Za-z]:\\?/, '') // 移除驱动器号（如 C:\）
    .replace(/^[\\/?]+/, '') // 移除开头的斜杠或反斜杠
    .replace(/\\/g, '/') // 将反斜杠转换为正斜杠
    .trim(); // 移除首尾空格

  // 确保路径不以斜杠开头或结尾
  normalizedPath = normalizedPath.replace(/^\/|\/$/, '');

  // 从URL中提取文件名，并移除查询参数
  let filename = '';
  try {
    const url = new URL(imageUrl);
    filename = decodeURIComponent(url.pathname.split('/').pop() || '');
  } catch (e) {
    filename = decodeURIComponent(imageUrl.split('/').pop().split('?')[0]);
  }

  // 如果文件名为空或无效，使用时间戳作为文件名
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.trim() === '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    filename = `image-${timestamp}.png`;
  }

  // 构建完整的下载路径
  const downloadPath = normalizedPath ? `${normalizedPath}/${filename}` : filename;

  try {
    console.log('准备下载图片:', downloadPath);
    chrome.downloads.download({
      url: imageUrl,
      filename: downloadPath,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '保存失败',
          message: `图片保存失败: ${chrome.runtime.lastError.message}`
        });
      } else {
        console.log('开始下载，ID:', downloadId);
      }
    });
  } catch (error) {
    console.error('保存图片时出错:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '保存失败',
      message: `图片保存失败: ${error.message}`
    });
  }
}

// 保存文件
async function handleSaveFile(fileUrl) {
  try {
    const { saveDirectory } = await chrome.storage.sync.get(['saveDirectory']);
    if (!saveDirectory) {
      chrome.runtime.openOptionsPage();
      return;
    }

    // 验证URL的有效性
    let validUrl;
    try {
      validUrl = new URL(fileUrl);
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('不支持的URL协议');
      }
    } catch (e) {
      throw new Error('无效的URL地址');
    }

    // 转换路径格式，确保路径格式正确
    let normalizedPath = saveDirectory
      .replace(/^[A-Za-z]:\\?/, '') // 移除驱动器号（如 C:\）
      .replace(/^[\\/?]+/, '') // 移除开头的斜杠或反斜杠
      .replace(/\\/g, '/') // 将反斜杠转换为正斜杠
      .trim(); // 移除首尾空格

    // 确保路径不以斜杠开头或结尾
    normalizedPath = normalizedPath.replace(/^\/|\/$/, '');

    // 从URL中提取文件名，并进行安全处理
    let filename = '';
    try {
      const urlPath = validUrl.pathname;
      const rawFilename = urlPath.split('/').pop() || '';
      filename = decodeURIComponent(rawFilename)
        .replace(/[\\/:*?"<>|]/g, '_') // 替换Windows不允许的字符
        .trim();

      // 如果文件名中没有扩展名，尝试从Content-Disposition或URL参数中获取
      if (!filename.includes('.')) {
        const extension = validUrl.pathname.split('.').pop();
        if (extension && extension !== filename) {
          filename += '.' + extension;
        }
      }
    } catch (e) {
      console.error('文件名解析错误:', e);
      filename = '';
    }

    // 如果文件名为空或无效，使用时间戳作为文件名
    if (!filename || filename === '') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = validUrl.pathname.split('.').pop();
      filename = `file-${timestamp}${extension ? '.' + extension : ''}`;
    }

    // 构建完整的下载路径
    const downloadPath = normalizedPath ? `${normalizedPath}/${filename}` : filename;

    console.log('准备下载文件:', downloadPath);
    console.log('下载URL:', validUrl.href);

    // 确保URL是有效的
    if (!validUrl.href) {
      throw new Error('无效的下载URL');
    }

    chrome.downloads.download({
      url: validUrl.href,
      filename: downloadPath,
      saveAs: false,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '保存失败',
          message: `文件保存失败: ${chrome.runtime.lastError.message}`
        });
      } else {
        console.log('开始下载，ID:', downloadId);
      }
    });
  } catch (error) {
    console.error('保存文件时出错:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '保存失败',
      message: `文件保存失败: ${error.message}`
    });
  }
}