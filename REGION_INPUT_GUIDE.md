# 地域输入框使用指南

## 概述

为了提供更灵活的地域选择，我们将所有OSS服务商的地域选择从下拉菜单改为输入框，支持手动输入和自动补全功能。

## 功能特性

### ✅ 输入框 + 自动补全
- 支持手动输入任意地域代码
- 提供常用地域的自动补全选项
- 实时验证地域格式是否正确

### ✅ 实时验证
- 输入时自动验证地域格式
- 视觉反馈：正确显示绿色，错误显示红色
- 支持各平台的地域命名规则

### ✅ 用户友好
- 清晰的占位符提示
- 常用地域的快速选择
- 详细的帮助文本

## 各平台地域格式

### 腾讯云COS
```
格式: ap-{地区}-{城市} 或 na-{地区} 或 eu-{地区}
示例: ap-beijing, ap-shanghai, ap-hongkong, na-siliconvalley
```

**常用地域**:
- `ap-beijing` - 北京
- `ap-shanghai` - 上海  
- `ap-guangzhou` - 广州
- `ap-hongkong` - 香港
- `na-siliconvalley` - 硅谷

### 阿里云OSS
```
格式: oss-{地区}-{城市}
示例: oss-cn-hangzhou, oss-cn-shanghai, oss-us-east-1
```

**常用地域**:
- `oss-cn-hangzhou` - 华东1(杭州)
- `oss-cn-shanghai` - 华东2(上海)
- `oss-cn-beijing` - 华北2(北京)
- `oss-cn-shenzhen` - 华南1(深圳)

### 华为云OBS
```
格式: cn-{地区}-{编号} 或 ap-{地区}-{编号}
示例: cn-north-4, cn-east-3, ap-southeast-1
```

**常用地域**:
- `cn-north-4` - 华北-北京四
- `cn-east-3` - 华东-上海一
- `cn-south-1` - 华南-广州
- `ap-southeast-1` - 亚太-新加坡

### 七牛云Kodo
```
格式: z{数字}
示例: z0, z1, z2, z3, z4
```

**常用地域**:
- `z0` - 华东
- `z1` - 华北
- `z2` - 华南
- `z3` - 北美
- `z4` - 东南亚

## 使用方法

### 1. 选择OSS平台
在管理面板的系统设置中，选择要使用的OSS服务商。

### 2. 输入地域代码
在地域输入框中输入对应的地域代码：
- 可以直接输入完整的地域代码
- 也可以点击输入框查看自动补全选项
- 系统会实时验证格式是否正确

### 3. 验证反馈
- **绿色边框**: 地域格式正确
- **红色边框**: 地域格式错误
- **帮助文本**: 显示常用地域示例

## 技术实现

### HTML结构
```html
<input type="text" 
       id="tencentRegion" 
       placeholder="请输入地域，如：ap-beijing" 
       list="tencentRegions"
       data-validate="region" 
       data-platform="tencent">
<datalist id="tencentRegions">
    <option value="ap-beijing">北京</option>
    <option value="ap-shanghai">上海</option>
    <!-- 更多选项... -->
</datalist>
```

### CSS样式
```css
/* 输入框样式 */
.form-group input[list] {
    background-image: url("下拉箭头图标");
    background-position: right 12px center;
    padding-right: 40px;
}

/* 验证状态样式 */
.form-group input[data-validate="region"].valid {
    border-color: #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.form-group input[data-validate="region"].invalid {
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}
```

### JavaScript验证
```javascript
// 地域格式验证
function validateRegionFormat(platform, region) {
    const patterns = {
        'tencent': /^ap-|na-|eu-|ap-.*-fsi$/,
        'aliyun': /^oss-cn-|oss-us-|oss-ap-|oss-eu-|oss-me-/,
        'huawei': /^cn-|ap-|af-|la-|na-|sa-/,
        'qiniu': /^z[0-9]$/
    };
    
    const pattern = patterns[platform];
    return pattern ? pattern.test(region) : true;
}
```

## 优势

### 1. 灵活性
- 支持输入任意地域代码，不限于预设选项
- 可以快速添加新地域，无需修改代码

### 2. 用户友好
- 自动补全减少输入错误
- 实时验证提供即时反馈
- 清晰的视觉提示

### 3. 可扩展性
- 易于添加新的地域选项
- 支持各平台的地域命名规则
- 统一的验证机制

## 注意事项

1. **地域代码区分大小写** - 请严格按照各平台的格式输入
2. **验证规则** - 系统会根据平台自动应用相应的验证规则
3. **网络延迟** - 某些地域可能有网络延迟，请根据实际需求选择
4. **成本考虑** - 不同地域的存储和传输成本可能不同

## 故障排除

### 地域验证失败
1. 检查地域代码格式是否正确
2. 确认是否选择了正确的OSS平台
3. 参考帮助文本中的示例

### 连接测试失败
1. 确认地域代码正确
2. 检查网络连接
3. 验证其他配置信息（密钥、存储桶等）

通过这种输入框方式，用户可以更灵活地配置OSS地域，同时享受自动补全和实时验证的便利。
