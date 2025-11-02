

export const getFriendlyErrorMessage = (rawError: string | null): string => {
  if (!rawError) return '发生未知错误。请稍后再试。';

  const lowerCaseError = rawError.toLowerCase();

  // API Key related errors
  if (lowerCaseError.includes('api_key is not defined') ||
      lowerCaseError.includes('requested entity was not found.') ||
      lowerCaseError.includes('api 密钥可能无效或权限不足') ||
      lowerCaseError.includes('api 密钥未选择') ||
      lowerCaseError.includes('api key is invalid')) {
    return 'API 密钥无效或缺失。请检查您的 API 密钥设置。';
  }
  
  // Audio related errors
  if (lowerCaseError.includes('无法激活音频播放') || lowerCaseError.includes('无法播放音频') || lowerCaseError.includes('error initiating audio playback')) {
    return '无法播放音频。浏览器可能阻止了自动播放，请尝试手动操作或检查浏览器设置。';
  }
  if (lowerCaseError.includes('无法初始化音频播放') || lowerCaseError.includes('failed to initialize audiocontext')) {
    return '无法初始化音频播放。请确保您的浏览器支持Web Audio API。';
  }
  if (lowerCaseError.includes('音频播放器未准备好') || lowerCaseError.includes('没有可播放的音频') || lowerCaseError.includes('audio player not ready')) {
    return '音频播放器未准备好或没有可播放的音频。';
  }
  if (lowerCaseError.includes('no audio data received from the api')) {
    return '未从模型接收到音频数据。';
  }
  // New: MP3 encoding errors
  if (lowerCaseError.includes('web workers are not supported')) {
    return '您的浏览器不支持Web Workers，无法进行MP3编码。请选择WAV格式。';
  }
  if (lowerCaseError.includes('mp3 encoding worker error') || lowerCaseError.includes('failed to encode audio to mp3')) {
    return 'MP3编码失败。请稍后再试或选择WAV格式。';
  }


  // Specific application flow errors (already concise, but keeping for consistency)
  if (lowerCaseError.includes('请输入原始文本')) return '请输入原始文本进行优化。';
  if (lowerCaseError.includes('未知的口语化风格')) return '未知的口语化风格。';
  if (lowerCaseError.includes('请先优化文本或输入待生成语音的文本')) return '请先优化文本或输入待生成语音的文本。';
  if (lowerCaseError.includes('音频上下文未初始化')) return '音频上下文未初始化。';
  if (lowerCaseError.includes('没有可下载的音频')) return '没有可下载的音频。请先生成语音。';


  // General generation/optimization failures
  if (lowerCaseError.includes('口语化优化失败')) return '口语化优化失败。请稍后再试或调整文本。';
  if (lowerCaseError.includes('生成语音失败') || lowerCaseError.includes('failed to generate speech')) return '语音生成失败。请稍后再试或调整设置。';

  // Fallback for generic errors
  return '发生未知错误。请稍后再试。';
};