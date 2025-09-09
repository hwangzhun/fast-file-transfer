// 全局变量
let currentFileData = null;
let selectedFiles = [];
let uploadedFiles = [];

// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadSection = document.getElementById('uploadSection');
const resultSection = document.getElementById('resultSection');
const downloadForm = document.getElementById('downloadForm');
const filePreview = document.getElementById('filePreview');
const toast = document.getElementById('toast');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 文件输入变化
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', (e) => {
        // 如果点击的是按钮，不触发文件选择（避免重复触发）
        if (e.target.closest('.upload-btn')) {
            return;
        }
        fileInput.click();
    });
    
    // 下载表单提交
    downloadForm.addEventListener('submit', handleDownloadSubmit);
}

// 处理拖拽悬停
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 处理文件拖放
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// 处理文件选择
function handleFiles(files) {
    if (files.length === 0) return;
    
    // 检查每个文件
    const maxSize = 100 * 1024 * 1024; // 100MB
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查文件大小
        if (file.size > maxSize) {
            showToast(`文件 "${file.name}" 大小超过100MB限制`, 'error');
            continue;
        }
        
        // 检查是否已存在相同文件
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (exists) {
            showToast(`文件 "${file.name}" 已存在`, 'warning');
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
        // 添加到已选择文件列表
        selectedFiles.push(...validFiles);
        showSelectedFilesSection();
        showToast(`已添加 ${validFiles.length} 个文件`, 'success');
    }
}


// 获取文件图标
function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'fa-image';
    if (fileType.startsWith('video/')) return 'fa-video';
    if (fileType.startsWith('audio/')) return 'fa-music';
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fa-file-powerpoint';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return 'fa-file-archive';
    return 'fa-file';
}

// 显示已选择文件区域
function showSelectedFilesSection() {
    const fileListSection = document.getElementById('fileListSection');
    const downloadSection = document.getElementById('downloadSection');
    
    // 显示文件列表区域，隐藏下载区域
    fileListSection.style.display = 'block';
    downloadSection.style.display = 'none';
    
    // 更新主文件列表
    updateMainSelectedFilesList();
}

// 隐藏已选择文件区域
function hideSelectedFilesSection() {
    const fileListSection = document.getElementById('fileListSection');
    const downloadSection = document.getElementById('downloadSection');
    
    // 隐藏文件列表区域，显示下载区域
    fileListSection.style.display = 'none';
    downloadSection.style.display = 'block';
}

// 移除文件
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateMainSelectedFilesList();
    
    if (selectedFiles.length === 0) {
        hideSelectedFilesSection();
    }
    
    showToast('文件已移除', 'success');
}

// 清空已选择文件
function clearSelectedFiles() {
    selectedFiles = [];
    updateMainSelectedFilesList();
    hideSelectedFilesSection();
    showToast('已清空文件列表', 'success');
}

// 上传所有文件
async function uploadAllFiles() {
    if (selectedFiles.length === 0) {
        showToast('请先选择要上传的文件', 'error');
        return;
    }
    
    // 显示上传进度
    showUploadProgress();
    
    try {
        const uploadPromises = selectedFiles.map(async (file, index) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新进度
                const progress = ((index + 1) / selectedFiles.length) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = `上传中... ${index + 1}/${selectedFiles.length}`;
                
                return result.data;
            } else {
                throw new Error(result.message);
            }
        });
        
        const results = await Promise.all(uploadPromises);
        
        // 保存所有上传的文件信息
        uploadedFiles = results;
        
        // 显示上传结果
        if (results.length > 0) {
            currentFileData = results[0];
            showUploadResult(results);
        }
        
        // 清空已选择文件列表
        clearSelectedFiles();
        
    } catch (error) {
        console.error('批量上传失败:', error);
        showToast('上传失败: ' + error.message, 'error');
        hideUploadProgress();
    }
}

// 显示上传进度
function showUploadProgress() {
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '准备上传...';
}

// 隐藏上传进度
function hideUploadProgress() {
    uploadProgress.style.display = 'none';
}

// 模拟上传进度
function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = `上传中... ${Math.round(progress)}%`;
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
}

// 显示上传结果
function showUploadResult(filesData) {
    // 确保filesData是数组
    const files = Array.isArray(filesData) ? filesData : [filesData];
    
    // 更新文件列表显示
    updateUploadedFilesList(files);
    
    // 更新汇总信息
    updateUploadSummary(files);
    
    // 使用第一个文件的信息作为主要分享信息
    const firstFile = files[0];
    document.getElementById('accessCode').value = firstFile.accessCode;
    
    // 生成完整的分享链接
    const shareUrl = window.location.origin + '/download/' + firstFile.shareCode + '?accessCode=' + firstFile.accessCode;
    document.getElementById('shareUrl').value = shareUrl;
    
    // 调试信息
    console.log('生成的分享链接:', shareUrl);
    console.log('验证码:', firstFile.accessCode);
    
    // 完成进度条
    progressFill.style.width = '100%';
    progressText.textContent = '上传完成！';
    
    // 延迟显示结果
    setTimeout(() => {
        hideUploadProgress();
        uploadSection.style.display = 'none';
        resultSection.style.display = 'block';
        showToast('文件上传成功！', 'success');
    }, 1000);
}

// 处理下载表单提交
async function handleDownloadSubmit(e) {
    e.preventDefault();
    
    const shareCode = document.getElementById('downloadShareCode').value.trim();
    const accessCode = document.getElementById('downloadAccessCode').value.trim();
    
    if (!shareCode || !accessCode) {
        showToast('请输入分享码和验证码', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/download/info/${shareCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessCode })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showFilePreview(result.data, shareCode, accessCode);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('获取文件信息失败:', error);
        showToast('获取文件信息失败: ' + error.message, 'error');
    }
}

// 更新主文件列表显示
function updateMainSelectedFilesList() {
    const filesList = document.getElementById('mainSelectedFilesList');
    
    if (selectedFiles.length === 0) {
        filesList.innerHTML = `
            <div class="empty-files">
                <i class="fas fa-folder-open"></i>
                <p>暂无选择的文件</p>
            </div>
        `;
        return;
    }
    
    filesList.innerHTML = selectedFiles.map((file, index) => `
        <div class="selected-file-item">
            <div class="file-icon">
                <i class="fas ${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <div class="file-actions">
                <button class="remove-file-btn" onclick="removeFile(${index})" title="移除文件">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 添加更多文件
function addMoreFiles() {
    document.getElementById('fileInput').click();
}

// 更新已上传文件列表显示
function updateUploadedFilesList(files) {
    const filesList = document.getElementById('uploadedFilesList');
    
    if (files.length === 0) {
        filesList.innerHTML = `
            <div class="empty-files">
                <i class="fas fa-folder-open"></i>
                <p>暂无上传的文件</p>
            </div>
        `;
        return;
    }
    
    filesList.innerHTML = files.map((file, index) => `
        <div class="uploaded-file-item">
            <div class="uploaded-file-icon">
                <i class="fas ${getFileIcon(file.fileName.split('.').pop())}"></i>
            </div>
            <div class="uploaded-file-info">
                <div class="uploaded-file-name" title="${file.fileName}">${file.fileName}</div>
                <div class="uploaded-file-size">${file.fileSize}</div>
            </div>
        </div>
    `).join('');
}

// 更新上传汇总信息
function updateUploadSummary(files) {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => {
        // 从fileSize字符串中提取数字（假设格式为 "1.2 MB"）
        const sizeStr = file.fileSize;
        const sizeMatch = sizeStr.match(/([\d.]+)\s*([KMGT]?B)/i);
        if (sizeMatch) {
            const value = parseFloat(sizeMatch[1]);
            const unit = sizeMatch[2].toUpperCase();
            const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024, 'TB': 1024*1024*1024*1024 };
            return sum + (value * (multipliers[unit] || 1));
        }
        return sum;
    }, 0);
    
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalSize').textContent = formatFileSize(totalSize);
    document.getElementById('expireTime').textContent = formatDate(files[0].expireTime);
}

// 显示文件预览
function showFilePreview(fileInfo, shareCode, accessCode) {
    document.getElementById('previewFileName').textContent = fileInfo.fileName;
    document.getElementById('previewFileSize').textContent = `大小: ${formatFileSize(fileInfo.fileSize)}`;
    document.getElementById('previewFileType').textContent = `类型: ${fileInfo.fileType}`;
    
    // 存储当前下载信息
    currentFileData = { shareCode, accessCode };
    
    filePreview.style.display = 'block';
    showToast('文件信息获取成功', 'success');
}

// 下载文件
function downloadFile() {
    if (!currentFileData) {
        showToast('请先获取文件信息', 'error');
        return;
    }
    
    const { shareCode, accessCode } = currentFileData;
    const downloadUrl = `/download/${shareCode}?accessCode=${encodeURIComponent(accessCode)}`;
    
    // 创建隐藏的下载链接
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('开始下载文件', 'success');
}

// 复制到剪贴板
async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value;
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板', 'success');
    } catch (error) {
        // 降级方案
        element.select();
        document.execCommand('copy');
        showToast('已复制到剪贴板', 'success');
    }
}

// 复制分享信息
async function copyShareInfo() {
    if (!currentFileData) return;
    
    const shareInfo = `
文件分享信息：
文件名：${currentFileData.fileName}
文件大小：${currentFileData.fileSize}
分享码：${currentFileData.shareCode}
验证码：${currentFileData.accessCode}
分享链接：${window.location.origin}/download/${currentFileData.shareCode}?accessCode=${currentFileData.accessCode}
过期时间：${formatDate(currentFileData.expireTime)}
    `.trim();
    
    try {
        await navigator.clipboard.writeText(shareInfo);
        showToast('分享信息已复制到剪贴板', 'success');
    } catch (error) {
        showToast('复制失败，请手动复制', 'error');
    }
}

// 上传新文件
function uploadAnother() {
    // 重置表单
    fileInput.value = '';
    downloadForm.reset();
    
    // 隐藏结果和预览
    resultSection.style.display = 'none';
    filePreview.style.display = 'none';
    
    // 显示上传区域
    uploadSection.style.display = 'block';
    
    // 清空数据
    currentFileData = null;
    selectedFiles = [];
    uploadedFiles = [];
    updateMainSelectedFilesList();
    hideSelectedFilesSection();
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toastElement = document.getElementById('toast');
    const messageElement = document.getElementById('toastMessage');
    const iconElement = toastElement.querySelector('i');
    
    // 更新消息和图标
    messageElement.textContent = message;
    
    if (type === 'error') {
        toastElement.style.background = '#dc3545';
        iconElement.className = 'fas fa-exclamation-circle';
    } else {
        toastElement.style.background = '#28a745';
        iconElement.className = 'fas fa-check-circle';
    }
    
    // 显示提示
    toastElement.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    console.log('文件快传系统已加载完成');
});
