vibecoding版本。
开心第一。
导入Google ai studio最方便，后面再慢慢优化。

# Gemini 文字转语音 App

这是一个基于 Google Gemini API 构建的文字转语音 (TTS) Web 应用程序，旨在提供流畅且可定制的语音生成体验。它采用分步式流程，引导用户从文本输入到语音播放和下载。

## 功能特性

*   **分步式工作流**: 应用程序分为三个清晰的步骤，确保用户体验直观且易于导航。
    1.  **输入原始文本并选择口语化风格**: 用户在此处输入或粘贴需要转换为语音的原始文本，并可以选择不同的口语化优化风格。
    2.  **确认优化文本与设置**: 显示经过口语化优化的文本，用户可以对其进行编辑。同时，可以灵活选择不同的 Gemini TTS 模型和多种语音风格。
    3.  **播放与下载语音**: 在此步骤中，用户可以播放生成的语音，进行暂停/停止操作，并下载音频文件。
*   **AI 驱动的文本口语化优化**: 应用程序现在通过 **Gemini 模型**提供智能的文本口语化优化功能，能够根据所选的风格将书面语转换为更自然、更地道的口语表达，包括调整语序、习惯用语、处理数字和缩写等。
    *   **口语化风格选择**: 提供至少 11 种预设口语化风格，例如：
        *   **标准口语**: 自然、流畅的日常表达。
        *   **正式演讲**: 庄重、清晰、有力的公共演讲语调。
        *   **日常闲聊**: 轻松、随意的日常对话风格。
        *   **故事讲述**: 引人入胜的叙述感和情感表达。
        *   **热情洋溢**: 充满热情和活力的表达。
        *   **平静舒缓**: 温和、柔和的语调。
        *   **信息传递**: 清晰、客观、高效地传递信息。
        *   **说服性**: 具有说服力，注重逻辑和情感共鸣。
        *   **幽默风趣**: 带有幽默感的轻松表达。
        *   **儿童故事**: 亲切、简单、充满童趣的讲述。
        *   **新闻报道**: 严谨、客观的新闻播报风格。
*   **优化文本纯净输出**: 优化后的文本将包含自然的中文断句标点符号，不含任何 Markdown 语法、其他特殊符号或不必要的额外信息，确保语音生成无障碍。
*   **可编辑的优化文本**: 优化后的文本在第二步中仍然可以手动编辑，允许用户进行微调以达到最佳效果。
*   **模型与语音风格选择**:
    *   **TTS 模型**: 支持选择 `gemini-2.5-flash-preview-tts` 模型进行语音生成。
    *   **多种语音风格**: 提供包括 Zephyr（标准）、Puck（活泼）、Charon（深沉）、Kore（清晰）和 Fenrir（洪亮）等在内的大约 5 种预设语音风格供用户选择。
*   **实时字数统计与 Token 预估**: 在原始文本输入框下方实时显示当前文本的字数，并提供一个近似的 Token 预估值，帮助用户了解文本长度。
*   **口语化规则浮动提示**: 在原始文本输入框旁提供问号图标，鼠标悬停时浮动显示详细的优化目标和 AI 优化方法。
*   **预估生成时间与倒计时**: 在语音生成前预估所需时间（基于文本长度，大约 10 字/秒），并在生成过程中显示倒计时，**明确标注为“预估值”**，提升用户体验。
*   **历史记录管理**:
    *   **持久化存储**: 自动将每次生成的历史记录保存在本地，即使关闭浏览器也能保留。
    *   **历史列表**: 在页面底部可折叠的区域显示所有历史记录，包含生成时间、口语风格、语音风格和优化文本预览。
    *   **加载功能**: 点击历史记录条目可将其内容和设置加载回主界面，方便重新生成或修改。
    *   **删除与清空**: 支持删除单个历史记录或一次性清空所有历史记录。
*   **音频播放与控制**:
    *   **即时播放**: 生成语音后可立即播放。
    *   **暂停/恢复**: 播放过程中可随时暂停和恢复。
    *   **停止播放**: 提供独立的“终止播放”按钮，可随时停止并重置播放。
    *   **交互禁用**: 在语音播放期间，除播放控制按钮外，其他所有界面元素将被禁用，确保操作的专注性。
*   **音频下载**: 生成的语音可以方便地下载为 `.wav` 格式文件。
*   **预留其他模型 API 配置**: 应用程序在第一步通过**高级模型配置**图标和模态窗口，允许用户选择不同的模型用途 (如文本、图像、视频生成或自定义)，并输入自定义模型名称和 JSON 配置，为未来扩展其他 Gemini API 功能提供接口（目前仅为 UI 示例）。
*   **API 密钥管理**:
    *   通过 `process.env.API_KEY` 自动获取 API 密钥。
    *   集成了 Google AI Studio 的 API 密钥选择功能，引导用户安全地选择和管理其 API 密钥。
    *   在未选择有效 API 密钥时，提供明确的提示和账单信息链接。
*   **错误处理与加载指示**:
    *   **统一错误对话框**: 无论 API 调用失败、密钥无效、音频播放问题，都会弹出一个清晰的模态对话框，显示详细的错误信息，帮助用户了解问题所在。
    *   在文本优化和语音生成等耗时操作期间，显示加载指示器，提升用户体验。
*   **重新开始功能**: 在任何时候，用户都可以通过“重新开始”按钮清空所有输入和设置，并返回第一步。

## 如何使用

1.  **输入文本与选择风格**: 在第一步的文本框中输入您想要转换为语音的文本，并从下拉菜单中选择一个口语化风格。
2.  **优化与设置**: 点击“口语化优化”，文本将自动通过 AI 处理并跳转到第二步。您可以在此修改文本，并选择您喜欢的 TTS 模型和语音风格。
3.  **生成与播放**: 点击“确认并生成语音”来生成音频。生成完成后，您将进入第三步，可以播放、暂停、停止或下载语音。第三步也会显示您当前选择的口语化风格。
4.  **管理 API 密钥**: 如果提示需要 API 密钥，请按照指示通过 Google AI Studio 选择或设置您的密钥。
5.  **查看历史记录**: 展开底部的“历史记录”区域，可以加载、删除或清空您之前的生成记录。
6.  **高级配置 (预留)**: 点击第一步右上角的齿轮图标，查看未来可能扩展的其他模型 API 选项和自定义配置界面。

## 技术栈

*   **React**: 用于构建用户界面。
*   **TypeScript**: 提供类型安全。
*   **Tailwind CSS**: 用于快速且响应式的 UI 样式设计。
*   **@google/genai**: Google Gemini API 的官方 SDK，用于文本处理和文字转语音功能。
*   **Web Audio API**: 用于客户端音频解码和播放控制。
*   **localStorage**: 用于客户端历史记录持久化存储。

## 作者信息

*   **开发者**: Roger
*   **GitHub**: [https://github.com/rogertl/Gemini-TTS-App](https://github.com/rogertl/Gemini-TTS-App)

## 许可证

本项目采用 MIT 许可证。详见如下：

```
MIT License

Copyright (c) 2024 Roger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 版本历史

### v1.1.1 (当前版本)
- **修复**: **关键修复** “确认并生成语音”和“播放语音”功能故障：
    - **错误对话框集成**: 修正 `App.tsx` 中的渲染逻辑，确保根据 `state.showErrorModal` 正确显示 `ErrorModal`，并通过 `setError` 动作统一触发。
    - **`AudioContext` 生命周期**: 确保 `RESTART_APP` 动作时 `audioContext` 实例被正确保留 (`appReducer.ts`)。
    - **播放逻辑统一**: `Step3Playback.tsx` 完全依赖 `useAudioPlayback` Hook，消除重复代码并确保 `AudioContext.resume()` 和浏览器自动播放策略得到一致处理。
    - **API 调用前检查**: 在 `generateSpeech` 函数中，确保 API 调用前 `AudioContext` 处于 `running` 状态。
- **新增功能**: **统一错误对话框**：所有 API 相关的错误（口语化优化、语音生成、API Key 检查）现在都会通过模态对话框弹出，提供清晰用户反馈。
- **修复**: 倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **版本更新**: `APP_PUBLISH_DATE` 修正为 `2025-10-30`，版本号更新为 `v1.1.1`。

### v1.1.0
- **修复**: **关键修复** “确认并生成语音”和“播放语音”功能故障：
    - 确保 `AudioContext` 在应用重置后能够被正确保留和管理 (`appReducer.ts`)。
    - 统一 `Step3Playback.tsx` 的播放逻辑，完全依赖 `useAudioPlayback` Hook，消除重复代码并确保 `AudioContext.resume()` 和浏览器自动播放策略得到一致处理。
    - 在 `generateSpeech` 函数中，确保 API 调用前 `AudioContext` 处于 `running` 状态。
- **新增功能**: **统一错误对话框**：无论 API 调用失败、密钥无效、音频播放问题，都会弹出一个清晰的模态对话框，显示详细的错误信息，帮助用户了解问题所在。
- **修复**: 倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **版本更新**: `APP_PUBLISH_DATE` 修正为 `2025-10-30`，版本号更新为 `v1.1.0`。

### v1.0.9
- **修复**: **关键修复** “确认并生成语音”和“播放语音”功能故障：
    - 确保 `AudioContext` 在应用重置后能够被正确保留和管理 (`appReducer.ts`)。
    - 统一 `Step3Playback.tsx` 的播放逻辑，完全依赖 `useAudioPlayback` Hook，消除重复代码并确保 `AudioContext.resume()` 和浏览器自动播放策略得到一致处理。
    - 在 `generateSpeech` 函数中，确保 API 调用前 `AudioContext` 处于 `running` 状态。
- **修复**: 倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **优化**: `useAudioPlayback` 进一步优化播放逻辑，增强对浏览器自动播放限制的兼容性，并提供更详细的调试日志。
- **版本更新**: `APP_PUBLISH_DATE` 修正为 `2025-10-30`，版本号更新为 `v1.0.9`。

### v1.0.8
- **修复**: 修正 `APP_PUBLISH_DATE` 为 `2025-10-30`，更新版本号为 `v1.0.8`。
- **修复**: **关键修复** “确认并生成语音”功能：
    - 确保 `AudioContext` 在解码和播放前始终处于 `running` 状态。
    - 优化 `handlePlayToggle` 播放逻辑，移除阻塞等待，直接尝试 `play()` 以更好地遵守浏览器自动播放策略。
- **修复**: 倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **修复**: 音频播放功能故障，通过强化 `AudioContext` 管理和播放逻辑，提高播放成功率。
- **优化**: 增强音频播放器错误监听及详细日志，便于诊断和反馈。

### v1.0.7
- **修复**: 修正 `APP_PUBLISH_DATE` 为 `2025-10-30`，更新版本号为 `v1.0.7`。
- **修复**: 修复倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **修复**: 彻底重构 `AudioContext` 管理，确保其作为单例创建和持久化，修复播放功能故障。
- **优化**: 增强音频播放器错误监听，捕获并展示播放错误信息。
- **优化**: `useAudioPlayback` 增强播放逻辑，包括等待 `loadedmetadata` 事件、错误处理及详细日志。

### v1.0.6
- **修复**: 修正 `APP_PUBLISH_DATE` 为 `2025-10-30`。
- **修复**: 修复倒计时显示 bug，确保倒计时正确更新并显示 `(预估值: {countdown}秒)`。
- **修复**: 修复音频播放功能故障，增强 `handlePlayToggle` 逻辑，包括等待 `loadedmetadata` 事件、错误处理及详细日志。
- **优化**: 完善音频播放器的错误监听，捕获并展示播放错误信息。

### v1.0.5
- **架构重构**:
    - 将 `App.tsx` 拆分为多个功能模块和组件，包括 `context` (AppContext, appReducer, appActions), `components` (ApiKeyPrompt, AdvancedSettingsModal, Step1Input, Step2Config, Step3Playback, HistorySection, FooterInfo, LoadingSpinner, Tooltip), `hooks` (useAudioPlayback, useCountdownTimer, useApiKeyStatus)。
    - 使用 React Context API 进行全局状态管理，提高代码可维护性和可扩展性。
- **UI 优化**:
    - **倒计时显示增强**: 在语音生成倒计时中明确显示“预估值”文字，例如 `(预估值: {countdown}秒)`。
- **功能增强**:
    - 应用程序版本号和发布日期现在在页面底部显示。

### v1.0.4
- **新增功能**:
    - **开发者信息显示**: 在应用底部显示开发者姓名 (Roger)、GitHub 地址、应用程序版本号和发布日期。
    - **MIT 开源协议显示**: 在应用底部显示完整的 MIT 开源协议文本。

### v1.0.3
- **新增功能**:
    - **作者信息显示**: 在应用底部显示开发者信息和 GitHub 链接。
    - **高级模型配置 UI 优化**: 将“高级模型配置”移至步骤 1，并改为齿轮图标，以节省空间并保持功能的易访问性。
- **优化与修复**:
    - **优化文本标点符号**: 修正了口语化优化逻辑，确保输出文本包含自然的中文断句标点符号，同时仍然禁止 Markdown 和其他不必要的特殊符号。

### v1.0.2
- **新增功能**:
    - **作者信息和开源协议**: 在 `README.md` 中新增作者信息和 MIT 开源协议。
    - **高级模型配置 (UI 预留)**: 增加了“高级模型配置”按钮和模态窗口，用于预留未来调用其他 Gemini 模型 API 及自定义配置的选项（目前仅为 UI 示例，无实际功能实现）。
- **优化与修复**:
    - 确保 `types.ts` 中 `declare global` 块的正确性，解决潜在的 TypeScript 声明冲突。

### v1.0.1
- **修复与优化**:
    - **界面显示**: 进一步优化 `index.html` 中的 CSS，确保在内容过多时应用高度不会溢出视口，并始终显示滚动条。
    - **历史记录持久化**: 增强 `localStorage` 操作的诊断日志，以便更好地追踪数据保存和加载过程。
    - **优化文本输出**: 强化 Gemini 模型指令，确保口语化优化结果为纯文本，不含 Markdown 或特殊符号。
- **新增功能**:
    - **生成时间预估与倒计时**: 在语音生成前显示预估时间，并在生成过程中展示倒计时。
    - **步骤 3 显示口语化风格**: 在最终播放/下载界面显示当前选择的口语化风格。

### v1.0.0
- **核心功能**: 实现分步式文字转语音工作流（文本输入 -> 优化/设置 -> 播放/下载）。
- **AI 口语化优化**: 集成 Gemini 模型进行智能中文口语化优化，支持多种预设风格（至少11种），包括标准口语、正式演讲、日常闲聊、故事讲述等。
- **语音生成**: 使用 `gemini-2.5-flash-preview-tts` 模型生成高质量语音，并提供多种预设语音风格选择 (Zephyr, Puck, Charon, Kore, Fenrir)。
- **实时反馈**: 原始文本框实时显示字数统计和近似 Token 预估。
- **口语化规则提示**: 提供浮动提示，说明 AI 口语化优化目标和方法。
- **历史记录管理**: 通过 `localStorage` 持久化存储生成记录，支持加载、删除和清空。
- **音频控制**: 提供播放、暂停、停止和下载功能，并优化播放期间的界面交互。
- **API 密钥管理**: 集成 Google AI Studio 密钥选择机制，提供清晰的密钥状态提示和账单链接。
- **错误处理**: 完善错误信息展示和加载状态管理。
- **重新开始功能**: 在任何时候，用户都可以通过“重新开始”按钮清空所有输入和设置，并返回第一步。
