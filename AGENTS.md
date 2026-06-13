# 开发约定
1. 每完成一个独立功能或修复，必须立即执行：
   git add .
   git commit -m "简洁描述本次改动（中文，遵循 feat/fix/style 等前缀）"
   git push
2. 不要把多个不相关的改动合并成一次提交。
3. commit message 格式示例：
   - feat: 实现写记录弹窗的图片上传
   - fix: 修复邀请码重复生成问题
   - style: 调整今日页卡片间距
4. 修改 .env.local 或任何密钥相关文件时，不要提交，并在 .gitignore 中确认已忽略。
