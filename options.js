// 获取DOM元素
const directoryInput = document.getElementById('directory');
const saveButton = document.getElementById('save');
const statusMessage = document.getElementById('status');

// 加载已保存的目录设置
chrome.storage.sync.get(['saveDirectory'], (result) => {
  if (result.saveDirectory) {
    directoryInput.value = result.saveDirectory;
  }
});

// 保存设置
saveButton.addEventListener('click', () => {
  const directory = directoryInput.value.trim();
  
  if (!directory) {
    alert('请输入保存目录');
    return;
  }

  // 移除路径中的驱动器号和开头的斜杠
  const normalizedDirectory = directory
    .replace(/^[A-Za-z]:\\?/, '') // 移除驱动器号（如 C:）
    .replace(/^[\\/]+/, '') // 移除开头的斜杠
    .replace(/\\/g, '/'); // 将反斜杠转换为正斜杠

  chrome.storage.sync.set({ saveDirectory: normalizedDirectory }, () => {
    statusMessage.style.display = 'block';
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 2000);
  });
});