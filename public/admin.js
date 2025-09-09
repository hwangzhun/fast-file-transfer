// 管理面板JavaScript
let currentPage = 1;
let totalPages = 1;
let currentFiles = [];
let isLoggedIn = false;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已经登录
    checkLoginStatus();
    initializeEventListeners();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // 验证token是否有效
        verifyToken(token);
    } else {
        showLoginForm();
    }
}

// 显示登录表单
function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminContainer').style.display = 'none';
    
    // 添加登录表单事件监听器
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
}

// 显示管理界面
function showAdminPanel() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'block';
    isLoggedIn = true;
    
    // 加载数据
    loadFiles();
    loadStats();
    loadSettings();
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const loginBtn = document.querySelector('.btn-login');
    
    // 显示加载状态
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 保存token
            localStorage.setItem('adminToken', result.token);
            showToast('登录成功', 'success');
            showAdminPanel();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('登录失败:', error);
        showToast('登录失败: ' + error.message, 'error');
    } finally {
        // 恢复按钮状态
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
    }
}

// 验证token
async function verifyToken(token) {
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAdminPanel();
        } else {
            localStorage.removeItem('adminToken');
            showLoginForm();
        }
        
    } catch (error) {
        console.error('Token验证失败:', error);
        localStorage.removeItem('adminToken');
        showLoginForm();
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('adminToken');
        isLoggedIn = false;
        showLoginForm();
        showToast('已退出登录', 'success');
    }
}

// 切换密码显示
function togglePassword() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            if (isLoggedIn) {
                switchSection(this.dataset.section);
            }
        });
    });

    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // 地域输入框实时验证
    document.querySelectorAll('input[data-validate="region"]').forEach(input => {
        input.addEventListener('input', debounce(validateRegionInput, 500));
        input.addEventListener('blur', validateRegionInput);
    });
}

// 验证地域输入
function validateRegionInput(event) {
    const input = event.target;
    const platform = input.dataset.platform;
    const region = input.value.trim();
    
    if (!region) {
        clearRegionValidation(input);
        return;
    }
    
    const isValid = validateRegionFormat(platform, region);
    updateRegionValidation(input, isValid);
}

// 更新地域验证状态
function updateRegionValidation(input, isValid) {
    input.classList.remove('valid', 'invalid');
    
    if (isValid) {
        input.classList.add('valid');
    } else {
        input.classList.add('invalid');
    }
}

// 清除地域验证状态
function clearRegionValidation(input) {
    input.classList.remove('valid', 'invalid');
}

// 切换页面部分
function switchSection(sectionName) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // 更新内容区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');

    // 更新页面标题
    const titles = {
        files: '文件管理',
        stats: '统计信息',
        settings: '系统设置'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];

    // 根据页面加载相应数据
    if (sectionName === 'files') {
        loadFiles();
    } else if (sectionName === 'stats') {
        loadStats();
    } else if (sectionName === 'settings') {
        loadSettings();
    }
}

// 加载文件列表
async function loadFiles(page = 1) {
    try {
        showLoading();
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/files?page=${page}&limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        
        if (result.success) {
            currentFiles = result.data;
            totalPages = Math.ceil(result.pagination.total / result.pagination.limit);
            currentPage = page;
            
            renderFilesTable();
            updatePagination();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('加载文件列表失败:', error);
        showToast('加载文件列表失败: ' + error.message, 'error');
        hideLoading();
    }
}

// 渲染文件表格
function renderFilesTable() {
    const tbody = document.getElementById('filesTableBody');
    
    if (currentFiles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <i class="fas fa-folder-open"></i>
                    暂无文件
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentFiles.map(file => `
        <tr>
            <td>
                <i class="fas ${getFileIcon(file.file_type)}"></i>
                ${file.original_name}
            </td>
            <td>${formatFileSize(file.file_size)}</td>
            <td>${file.file_type}</td>
            <td>${formatDate(file.upload_time)}</td>
            <td>${formatDate(file.expire_time)}</td>
            <td>${file.download_count || 0}</td>
            <td>
                <code>${file.share_code || 'N/A'}</code>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewFileDetails('${file.file_id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteFile('${file.file_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    hideLoading();
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

// 更新分页
function updatePagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
}

// 上一页
function previousPage() {
    if (currentPage > 1) {
        loadFiles(currentPage - 1);
    }
}

// 下一页
function nextPage() {
    if (currentPage < totalPages) {
        loadFiles(currentPage + 1);
    }
}

// 搜索处理
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredFiles = currentFiles.filter(file => 
        file.original_name.toLowerCase().includes(searchTerm)
    );
    
    // 这里可以实现客户端搜索，或者发送到服务器
    console.log('搜索:', searchTerm, filteredFiles.length);
}

// 查看文件详情
async function viewFileDetails(fileId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/stats?fileId=${fileId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        
        if (result.success) {
            showFileModal(result.data);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('获取文件详情失败:', error);
        showToast('获取文件详情失败: ' + error.message, 'error');
    }
}

// 显示文件详情模态框
function showFileModal(fileData) {
    const modal = document.getElementById('fileModal');
    const modalBody = document.getElementById('fileModalBody');
    
    modalBody.innerHTML = `
        <div class="file-details">
            <div class="detail-item">
                <label>文件名:</label>
                <span>${fileData.original_name || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <label>文件大小:</label>
                <span>${formatFileSize(fileData.file_size || 0)}</span>
            </div>
            <div class="detail-item">
                <label>文件类型:</label>
                <span>${fileData.file_type || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <label>上传时间:</label>
                <span>${formatDate(fileData.upload_time)}</span>
            </div>
            <div class="detail-item">
                <label>过期时间:</label>
                <span>${formatDate(fileData.expire_time)}</span>
            </div>
            <div class="detail-item">
                <label>下载次数:</label>
                <span>${fileData.download_count || 0}</span>
            </div>
            <div class="detail-item">
                <label>访问次数:</label>
                <span>${fileData.access_count || 0}</span>
            </div>
            <div class="detail-item">
                <label>最后访问:</label>
                <span>${fileData.last_access_time ? formatDate(fileData.last_access_time) : '从未访问'}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('fileModal').style.display = 'none';
}

// 删除文件
async function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        // 这里需要实现删除API
        showToast('删除功能待实现', 'warning');
    } catch (error) {
        console.error('删除文件失败:', error);
        showToast('删除文件失败: ' + error.message, 'error');
    }
}

// 加载统计信息
async function loadStats() {
    try {
        // 这里可以实现统计API
        document.getElementById('totalFiles').textContent = currentFiles.length;
        document.getElementById('totalDownloads').textContent = currentFiles.reduce((sum, file) => sum + (file.download_count || 0), 0);
        document.getElementById('totalSize').textContent = formatFileSize(currentFiles.reduce((sum, file) => sum + (file.file_size || 0), 0));
        document.getElementById('activeFiles').textContent = currentFiles.filter(file => {
            const expireTime = new Date(file.expire_time);
            return expireTime > new Date();
        }).length;
        
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载系统设置
async function loadSettings() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        
        if (result.success) {
            const settings = result.data;
            
            // 填充表单数据
            document.getElementById('uploadLocation').value = settings.uploadLocation || 'local';
            document.getElementById('maxFileSize').value = settings.maxFileSize || 100;
            document.getElementById('fileExpireDays').value = settings.fileExpireDays || 7;
            document.getElementById('uploadLimit').value = settings.uploadLimit || 10;
            document.getElementById('downloadLimit').value = settings.downloadLimit || 20;
            
            // 填充OSS配置
            if (settings.ossConfig) {
                document.getElementById('ossSecretId').value = settings.ossConfig.secretId || '';
                document.getElementById('ossSecretKey').value = settings.ossConfig.secretKey || '';
                document.getElementById('ossRegion').value = settings.ossConfig.region || 'ap-beijing';
                document.getElementById('ossBucket').value = settings.ossConfig.bucket || '';
            }
            
            // 显示/隐藏OSS配置区域
            toggleOSSConfig();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('加载系统设置失败:', error);
        showToast('加载系统设置失败: ' + error.message, 'error');
    }
}

// 切换OSS配置显示
function toggleOSSConfig() {
    const uploadLocation = document.getElementById('uploadLocation').value;
    const ossPlatformSection = document.getElementById('ossPlatformSection');
    const ossConfig = document.getElementById('ossConfig');
    
    if (uploadLocation === 'oss') {
        ossPlatformSection.style.display = 'block';
        ossConfig.style.display = 'block';
        onOssPlatformChange(); // 显示当前平台的配置
    } else {
        ossPlatformSection.style.display = 'none';
        ossConfig.style.display = 'none';
    }
}

// 上传位置变化处理
function onUploadLocationChange() {
    toggleOSSConfig();
}

// 获取当前OSS配置
function getCurrentOSSConfig() {
    const platform = document.getElementById('ossPlatform').value;
    
    if (platform === 'tencent') {
        return {
            accessKeyId: document.getElementById('tencentSecretId').value,
            accessKeySecret: document.getElementById('tencentSecretKey').value,
            bucket: document.getElementById('tencentBucket').value,
            region: document.getElementById('tencentRegion').value
        };
    } else if (platform === 'aliyun') {
        return {
            accessKeyId: document.getElementById('aliyunAccessKeyId').value,
            accessKeySecret: document.getElementById('aliyunAccessKeySecret').value,
            bucket: document.getElementById('aliyunBucket').value,
            region: document.getElementById('aliyunRegion').value
        };
    } else if (platform === 'huawei') {
        return {
            accessKeyId: document.getElementById('huaweiAccessKey').value,
            accessKeySecret: document.getElementById('huaweiSecretKey').value,
            bucket: document.getElementById('huaweiBucket').value,
            region: document.getElementById('huaweiRegion').value
        };
    } else if (platform === 'qiniu') {
        return {
            accessKeyId: document.getElementById('qiniuAccessKey').value,
            accessKeySecret: document.getElementById('qiniuSecretKey').value,
            bucket: document.getElementById('qiniuBucket').value,
            region: document.getElementById('qiniuRegion').value,
            domain: document.getElementById('qiniuDomain').value
        };
    }
    
    return null;
}

// 验证OSS配置
function validateOSSConfig(platform, config) {
    if (!config) return false;
    
    // 基本字段验证
    if (!config.accessKeyId || !config.accessKeySecret || !config.bucket || !config.region) {
        return false;
    }
    
    // 七牛云需要额外验证域名
    if (platform === 'qiniu' && !config.domain) {
        return false;
    }
    
    // 地域格式验证
    if (!validateRegionFormat(platform, config.region)) {
        showToast('地域格式不正确，请检查输入', 'warning');
        return false;
    }
    
    return true;
}

// 验证地域格式
function validateRegionFormat(platform, region) {
    if (!region) return false;
    
    const patterns = {
        'tencent': /^ap-|na-|eu-|ap-.*-fsi$/,
        'aliyun': /^oss-cn-|oss-us-|oss-ap-|oss-eu-|oss-me-/,
        'huawei': /^cn-|ap-|af-|la-|na-|sa-/,
        'qiniu': /^z[0-9]$/
    };
    
    const pattern = patterns[platform];
    return pattern ? pattern.test(region) : true;
}

// OSS平台变化处理
function onOssPlatformChange() {
    const platform = document.getElementById('ossPlatform').value;
    const configTitle = document.getElementById('ossConfigTitle');
    
    // 隐藏所有平台配置
    document.querySelectorAll('.platform-config').forEach(config => {
        config.style.display = 'none';
    });
    
    // 显示当前平台配置
    const currentConfig = document.getElementById(platform + 'Config');
    if (currentConfig) {
        currentConfig.style.display = 'block';
    }
    
    // 更新配置标题
    const platformNames = {
        'tencent': '腾讯云COS',
        'aliyun': '阿里云OSS',
        'huawei': '华为云OBS',
        'qiniu': '七牛云Kodo',
        'aws': 'AWS S3'
    };
    configTitle.textContent = platformNames[platform] + '配置';
}

// 测试OSS连接
async function testOssConnection() {
    const platform = document.getElementById('ossPlatform').value;
    const config = getCurrentPlatformConfig(platform);
    
    if (!config) {
        showToast('请填写完整的OSS配置信息', 'warning');
        return;
    }
    
    const testBtn = document.querySelector('button[onclick="testOssConnection()"]');
    const testResult = document.getElementById('ossTestResult');
    const originalText = testBtn.innerHTML;
    
    // 显示加载状态
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';
    testResult.textContent = '';
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/test-oss', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                platform,
                ...config
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('OSS连接测试成功', 'success');
            testResult.textContent = '连接成功';
            testResult.className = 'test-result success';
        } else {
            showToast('OSS连接测试失败: ' + result.message, 'error');
            testResult.textContent = '连接失败';
            testResult.className = 'test-result error';
        }
        
    } catch (error) {
        console.error('OSS连接测试失败:', error);
        showToast('OSS连接测试失败: ' + error.message, 'error');
        testResult.textContent = '连接失败';
        testResult.className = 'test-result error';
    } finally {
        // 恢复按钮状态
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
    }
}

// 获取当前平台配置
function getCurrentPlatformConfig(platform) {
    const configs = {
        'tencent': {
            secretId: document.getElementById('tencentSecretId').value,
            secretKey: document.getElementById('tencentSecretKey').value,
            region: document.getElementById('tencentRegion').value,
            bucket: document.getElementById('tencentBucket').value
        },
        'aliyun': {
            accessKeyId: document.getElementById('aliyunAccessKeyId').value,
            accessKeySecret: document.getElementById('aliyunAccessKeySecret').value,
            region: document.getElementById('aliyunRegion').value,
            bucket: document.getElementById('aliyunBucket').value
        },
        'huawei': {
            accessKey: document.getElementById('huaweiAccessKey').value,
            secretKey: document.getElementById('huaweiSecretKey').value,
            region: document.getElementById('huaweiRegion').value,
            bucket: document.getElementById('huaweiBucket').value
        },
        'qiniu': {
            accessKey: document.getElementById('qiniuAccessKey').value,
            secretKey: document.getElementById('qiniuSecretKey').value,
            region: document.getElementById('qiniuRegion').value,
            bucket: document.getElementById('qiniuBucket').value
        },
        'aws': {
            accessKeyId: document.getElementById('awsAccessKeyId').value,
            secretAccessKey: document.getElementById('awsSecretAccessKey').value,
            region: document.getElementById('awsRegion').value,
            bucket: document.getElementById('awsBucket').value
        }
    };
    
    const config = configs[platform];
    if (!config) return null;
    
    // 检查必填字段
    const requiredFields = Object.values(config);
    if (requiredFields.some(field => !field)) {
        return null;
    }
    
    return config;
}

// 清理过期文件
async function cleanExpiredFiles() {
    if (!confirm('确定要清理所有过期文件吗？')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/cleanup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        
        if (result.success) {
            showToast(`成功清理了 ${result.data.cleanedCount} 个过期文件`, 'success');
            loadFiles(currentPage);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('清理过期文件失败:', error);
        showToast('清理过期文件失败: ' + error.message, 'error');
    }
}

// 上传位置改变处理
function onUploadLocationChange() {
    const uploadLocation = document.getElementById('uploadLocation').value;
    const ossConfig = document.getElementById('ossConfig');
    
    if (uploadLocation === 'oss') {
        ossConfig.style.display = 'block';
    } else {
        ossConfig.style.display = 'none';
    }
}

// 测试OSS连接
async function testOssConnection() {
    const platform = document.getElementById('ossPlatform').value;
    const config = getCurrentOSSConfig();
    
    if (!config || !validateOSSConfig(platform, config)) {
        showToast('请填写完整的OSS配置信息', 'warning');
        return;
    }
    
    const testBtn = document.querySelector('button[onclick="testOssConnection()"]');
    const originalText = testBtn.innerHTML;
    
    try {
        testBtn.disabled = true;
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/test-oss', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                secretId,
                secretKey,
                region,
                bucket
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('OSS连接测试成功', 'success');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('OSS连接测试失败:', error);
        showToast('OSS连接测试失败: ' + error.message, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
    }
}

// 保存设置
async function saveSettings() {
    const settings = {
        uploadLocation: document.getElementById('uploadLocation').value,
        maxFileSize: document.getElementById('maxFileSize').value,
        fileExpireDays: document.getElementById('fileExpireDays').value,
        uploadLimit: document.getElementById('uploadLimit').value,
        downloadLimit: document.getElementById('downloadLimit').value
    };
    
    // 如果是OSS存储，添加OSS配置
    if (settings.uploadLocation === 'oss') {
        const platform = document.getElementById('ossPlatform').value;
        const ossConfig = getCurrentPlatformConfig(platform);
        
        if (!ossConfig) {
            showToast('请填写完整的OSS配置信息', 'warning');
            return;
        }
        
        settings.ossPlatform = platform;
        settings.ossConfig = ossConfig;
    }
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('设置保存成功', 'success');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('保存设置失败:', error);
        showToast('保存设置失败: ' + error.message, 'error');
    }
}

// 加载设置
async function loadSettings() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const settings = result.data;
            
            // 填充表单
            document.getElementById('uploadLocation').value = settings.uploadLocation || 'local';
            document.getElementById('maxFileSize').value = settings.maxFileSize || 100;
            document.getElementById('fileExpireDays').value = settings.fileExpireDays || 7;
            document.getElementById('uploadLimit').value = settings.uploadLimit || 10;
            document.getElementById('downloadLimit').value = settings.downloadLimit || 20;
            
            // 如果是OSS存储，填充OSS配置
            if (settings.uploadLocation === 'oss' && settings.ossConfig) {
                document.getElementById('ossSecretId').value = settings.ossConfig.secretId || '';
                document.getElementById('ossSecretKey').value = settings.ossConfig.secretKey || '';
                document.getElementById('ossRegion').value = settings.ossConfig.region || 'ap-beijing';
                document.getElementById('ossBucket').value = settings.ossConfig.bucket || '';
                document.getElementById('ossConfig').style.display = 'block';
            }
            
            // 触发上传位置改变事件
            onUploadLocationChange();
        }
        
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// 刷新数据
function refreshData() {
    if (document.getElementById('filesSection').classList.contains('active')) {
        loadFiles(currentPage);
    } else if (document.getElementById('statsSection').classList.contains('active')) {
        loadStats();
    }
}

// 显示加载状态
function showLoading() {
    const tbody = document.getElementById('filesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-row">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    加载中...
                </div>
            </td>
        </tr>
    `;
}

// 隐藏加载状态
function hideLoading() {
    // 加载状态会在renderFilesTable中被替换
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageElement = document.getElementById('toastMessage');
    const iconElement = toast.querySelector('i');
    
    // 更新消息和图标
    messageElement.textContent = message;
    
    // 移除所有类型类
    toast.classList.remove('error', 'warning');
    
    if (type === 'error') {
        toast.classList.add('error');
        iconElement.className = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        toast.classList.add('warning');
        iconElement.className = 'fas fa-exclamation-triangle';
    } else {
        iconElement.className = 'fas fa-check-circle';
    }
    
    // 显示提示
    toast.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('fileModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
