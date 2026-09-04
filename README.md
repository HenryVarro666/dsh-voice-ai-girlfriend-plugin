# DSH 语音 AI 女友插件（voice-ai-girlfriend）

DeepSeek Harness 的**浏览器语音插件**：麦克风语音输入、回复朗读（TTS）、AI 女友动画窗、QQ 双向对话。

> ✅ **已适配 DSH rc.8 与 dsh 0.1.3**：`dsh.bundle` manifest + `conversation.input.dock/left` 槽位按 rc.8 协议实现；**2026-09-05 已在 dsh v0.1.3-alpha.1（profile web-v013）实测通过** —— 聊天节点读取用 0.1.3 的 `useChat` 视图（assistant-step 节点）、桥接 `/api/tts`（语音朗读）与 `/api/dh/speak`（数字人）均正常触发；`build.mjs` 同时产出服务端入口 `lib/index.js` 与内联 `<style>` 的浏览器包，修复 `dsh plugin add` 安装与样式注入。含数字人（DUIX）控制、DeepSeek 余额 badge（stats 行）、五态麦克风。`dsh plugin add` 即可安装。

> 🎥 **成品展示**（抖音）：
> - [口播视频效果 ①](https://www.douyin.com/user/self?from_tab_name=main&modal_id=7676326565919149339)
> - [口播视频效果 ②](https://www.douyin.com/user/self?from_tab_name=main&modal_id=7678063553395412259)

> ⚠️ **本插件是完整方案的一部分**：语音识别/合成依赖配套的 **voice bridge**（Python 服务，FunASR + OmniVoice TTS（WSL2 + FlashInfer）），QQ 对话依赖 **NapCatQQ**。请配合完整仓库使用：**[beiyege-01/dsh-voice-ai-girlfriend](https://github.com/beiyege-01/dsh-voice-ai-girlfriend)**（含桥接代码、模型准备、一键启动脚本、安装文档）。

## 安装

```bash
dsh plugin --profile web add github:beiyege-01/dsh-voice-ai-girlfriend-plugin
```

> pnpm ≥10 对 git 依赖的构建脚本有 allowBuilds 限制：按安装时 pnpm 打印的提示，在 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 里加一行允许 `esbuild` 后重跑。

## 功能

- 🎙️ **语音输入**：麦克风 → 桥接 FunASR 中文识别 → 注入对话（连续聆听、自动端点）
- 🔊 **语音回复**：回复流式 TTS 朗读（OmniVoice 声音克隆，跑在 WSL2 + FlashInfer 加速，音色由参考音频决定，支持 600+ 语言）
- ⚡ **插话/排队**：亮=说话打断回复；灭=回复读完句子排队接上
- 👧 **数字人窗口**：右侧动画窗（空闲/说话视频，素材自备），自动贴右侧插件边缘不被遮挡
- 💬 **QQ 双向**：QQ 消息注入对话 + 回复文本/语音/图片推送（NapCat）
- 🎭 **三类预设一键切换**：工具行三个按钮分别循环切换 **TTS 音色 / 数字人形象 / 待机动画**，选择自动记忆（localStorage）。音色（`voices/<名字>/`）、待机（`assets/bg-images/<名字>/`）、形象（共享卷 temp 放 mp4）均可自行添加，无需改代码

## 使用前提

1. 克隆主仓库并按其 README 装好 voice bridge（`start-all.cmd` 一键）
2. 本插件的桥接地址默认 `http://127.0.0.1:8765`（localStorage `s2s.voice.bridge` 可改）

## 构建

```bash
npm install
node build.mjs   # 产物 lib/client.js（browser bundle）
```
