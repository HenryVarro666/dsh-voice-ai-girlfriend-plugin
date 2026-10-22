# DSH Voice AI Browser Plugin

**English** · [简体中文](README.zh-CN.md)

**The browser interaction layer for continuous, interruptible speech in DeepSeek Harness.**

## Problem and intended use

A microphone button alone is not a usable voice interface. Streamed text can be read twice, stale speech can arrive after a correction, long silence can create oversized uploads, and unavailable avatar services can mute ordinary replies.

This plugin aims to make the DSH web UI behave like a conversational assistant: preserve the start of an utterance, submit one current intent, speak stable sentence prefixes and stop obsolete playback. The [Python bridge](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend) supplies ASR, endpointing, TTS and VAD.

## Methods and current behavior

| Component | Method |
|---|---|
| Capture | 16 kHz PCM16 AudioWorklet, bounded idle pre-roll; speech-start buffer protects correction onset |
| Endpointing | Ask bridge after 500 ms pause; unfinished fallback 1200 ms; service-unavailable fallback 1800 ms |
| Streamed replies | Preserve newlines and committed prefix boundaries; history protection prevents replay |
| Playback | Schedule PCM chunks on one AudioContext; use full-WAV compatibility fallback |
| Cancellation | Abort current fetch, stop scheduled sources and invalidate late results |
| Avatar availability | Adopt bridge state on mount; retain ordinary TTS when DUIX is unavailable |

## What has improved, and what remains open

The source repairs first-reply playback, newline splitting, idle-buffer growth and stale/duplicate reply behavior. Eleven offline regressions exercise core capture, splitting, streaming-byte and cancellation contracts.

These tests establish module behavior under controlled inputs. They do not establish microphone/AEC quality, full DSH host compatibility or hardware stop latency. System experiments and production/candidate distinctions are recorded in the [main experiment index](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend/blob/main/docs/EXPERIMENT_INDEX.md).

## Build and install

Requires Node.js 24. DSH supplies React and host bindings.

```bash
npm ci
npm run check
```

`check` runs tests, an independent speech-core typecheck and the bundle build. It does not typecheck the complete React/DSH host. Output: `lib/index.js` and `lib/client.js`. The package retains its upstream name/version; no npm release is claimed.

Register the published GitHub source in a DSH profile:

```bash
dsh plugin --profile web add github:HenryVarro666/dsh-voice-ai-girlfriend-plugin
```

This registration command has not been clean-profile acceptance tested for this publication. Follow the [bridge setup](https://github.com/HenryVarro666/dsh-voice-ai-girlfriend/blob/main/docs/SETUP.md) to configure models, verify the actually loaded bundle and preserve rollback. Reinstalling profile dependencies can replace a manually deployed bundle.

Bridge default: `http://127.0.0.1:8765`; override through localStorage `s2s.voice.bridge`. Forward remote services to localhost; browser microphone access needs a secure context.

## Source and next steps

`src/client/MicButton.tsx` owns capture/submission; `voice/recorder.ts`, `sentences.ts`, `reply-listener.tsx` and `speaker.ts` own their respective states. The companion repository's `scripts/sync_plugin.py --check` verifies its `dsh-plugin/src` mirror.

Next: verify candidate/bridge compatibility and replacement/recovery, then run headphone microphone, natural pauses, repeated interruptions and loudspeaker echo cases. Keep synthetic, host and human acceptance separate.

## Origin

Based on [beiyege-01/dsh-voice-ai-girlfriend-plugin](https://github.com/beiyege-01/dsh-voice-ai-girlfriend-plugin); upstream package MIT declaration and attribution are retained. [Publication scope](PUBLICATION.md) · [Workspace](https://github.com/HenryVarro666/voice-ai-workspace).
