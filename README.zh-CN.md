# DSH Voice AI 浏览器插件

[English](README.md) · **简体中文**

**为 DeepSeek Harness 提供持续、可插话语音交互的浏览器层。**

## 问题与使用场景

一个麦克风按钮还不够：流式文字可能被重复朗读，更正后可能续播旧语音，长期静默可能导致上传过大，数字人服务不可用也可能误伤普通回复。

本插件希望让 DSH 网页成为可连续交谈的助手：保留开头、只提交最新意图、朗读稳定句子前缀，并停止旧播放。[Python bridge](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend)提供 ASR、断轮、TTS 和 VAD。

## 方法与当前行为

| 组件 | 方法 |
|---|---|
| 采集 | 16kHz PCM16 AudioWorklet，有界静默预录；语音起始缓冲保护更正开头 |
| 断轮 | 500ms 停顿后询问 bridge；未完 1200ms 兜底，服务不可用 1800ms 兜底 |
| 流式回复 | 保留换行与已提交前缀边界；历史保护避免重读 |
| 播放 | 单 AudioContext 连续排定 PCM；兼容整段 WAV 回退 |
| 取消 | 中止 fetch、停止已排定 source，并让晚到结果失效 |
| 数字人可用性 | 挂载时读取 bridge 状态；DUIX 不可用时保留普通 TTS |

## 已有改善与边界

源码修复了首条回复、换行切句、静默缓冲增长和旧回复/重复朗读。11 项离线回归覆盖核心采集、切句、流式字节和取消契约。

这些测试只证明受控输入下的模块行为，不代表真人/AEC、完整 DSH 宿主或硬件停播时延已验收。系统实验和生产/候选区别见[主仓库实验索引](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend/blob/main/docs/EXPERIMENT_INDEX.md)。

## 构建与安装

需要 Node.js 24；React 与宿主依赖由 DSH 提供。

```bash
npm ci
npm run check
```

`check` 包含测试、独立语音核心类型检查和 bundle 构建，不覆盖完整 React/DSH 类型。输出为 `lib/index.js`、`lib/client.js`。保留上游包名/版本，不声称发布 npm 新版本。

可在 DSH profile 注册公开 GitHub 源码：

```bash
dsh plugin --profile web add github:HenryVarro666/dsh-voice-ai-girlfriend-plugin
```

本次公开尚未做该命令的干净 profile 安装验收。按[bridge 安装说明](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend/blob/main/docs/SETUP.md)配置模型、核验实际加载 bundle 并保留恢复路径。重新安装 profile 依赖可能替换手动部署的 bundle。

bridge 默认 `http://127.0.0.1:8765`，localStorage 的 `s2s.voice.bridge` 可覆盖。远端服务转发到 localhost；麦克风需要安全上下文。

## 源码与下一步

`src/client/MicButton.tsx` 管采集/投递；`voice/recorder.ts`、`sentences.ts`、`reply-listener.tsx`、`speaker.ts` 分别管理对应状态。主仓库 `scripts/sync_plugin.py --check` 检查 `dsh-plugin/src` 镜像。

下一步先验候选与 bridge 兼容、替换和恢复，再测耳机麦克风、自然停顿、连续插话和外放回声。合成、宿主与人工验收分别记录。

## 来源

基于 [beiyege-01/dsh-voice-ai-girlfriend-plugin](https://github.com/beiyege-01/dsh-voice-ai-girlfriend-plugin)，保留上游 MIT 声明与署名。[公开范围](PUBLICATION.md) · [工作区](https://github.com/HenryVarro666/voice-ai-workspace)。
