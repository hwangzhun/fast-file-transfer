#!/bin/bash

echo "正在启动文件快传系统..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未检测到npm，请先安装npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

# 检查数据库是否初始化
if [ ! -d "database" ]; then
    echo "正在初始化数据库..."
    npm run init-db
    if [ $? -ne 0 ]; then
        echo "错误: 数据库初始化失败"
        exit 1
    fi
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "正在创建环境变量文件..."
    cp env.example .env
    echo "请编辑.env文件配置相关参数"
fi

# 创建上传目录
if [ ! -d "uploads" ]; then
    mkdir -p uploads
fi

echo "启动服务器..."
echo
echo "========================================"
echo "文件快传系统启动成功！"
echo "========================================"
echo "主页面: http://localhost:3000"
echo "管理面板: http://localhost:3000/admin.html"
echo "API健康检查: http://localhost:3000/api/health"
echo "========================================"
echo "按 Ctrl+C 停止服务器"
echo

npm start
