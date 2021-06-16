chcp 65001
rem 进入docs文件夹
cd ../
cd docs
rem 拉取docs文档
git pull
rem 返回上级目录
cd ../
rem 生成静态文件
npm run docs:build