import React from 'react';
import { useAppContext } from '../context/AppContext';
import { setShowAdvancedModelSettings, setAdvancedModelConfig } from '../context/appActions';
import { AdvancedModelType } from '../types';

const AdvancedSettingsModal: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { advancedModelConfig } = state;

  const handleModelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setAdvancedModelConfig({ ...advancedModelConfig, modelType: e.target.value as AdvancedModelType }));
  };

  const handleCustomModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setAdvancedModelConfig({ ...advancedModelConfig, customModelName: e.target.value }));
  };

  const handleCustomJsonConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setAdvancedModelConfig({ ...advancedModelConfig, customJsonConfig: e.target.value }));
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-settings-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 id="advanced-settings-title" className="text-2xl font-bold text-gray-800">高级模型配置</h3>
        
        <div>
          <label htmlFor="advanced-model-type" className="block text-sm font-medium text-gray-700 mb-1">模型用途:</label>
          <select
            id="advanced-model-type"
            value={advancedModelConfig.modelType}
            onChange={handleModelTypeChange}
            className="block w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">文本生成</option>
            <option value="image">图像生成</option>
            <option value="video">视频生成</option>
            <option value="custom">自定义 (其他)</option>
          </select>
        </div>

        {advancedModelConfig.modelType === 'custom' && (
          <div>
            <label htmlFor="custom-model-name" className="block text-sm font-medium text-gray-700 mb-1">自定义模型名称:</label>
            <input
              type="text"
              id="custom-model-name"
              value={advancedModelConfig.customModelName}
              onChange={handleCustomModelNameChange}
              placeholder="e.g., gemini-custom-model-v1"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="custom-json-config" className="block text-sm font-medium text-gray-700 mb-1">自定义 JSON 配置 (例如: `{"temperature": 0.9}`):</label>
          <textarea
            id="custom-json-config"
            value={advancedModelConfig.customJsonConfig}
            onChange={handleCustomJsonConfigChange}
            rows={5}
            placeholder='在此输入 JSON 格式的模型配置...'
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => dispatch(setShowAdvancedModelSettings(false))}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            取消
          </button>
          <button
            onClick={() => dispatch(setShowAdvancedModelSettings(false))} // Currently just closes, no actual save logic
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            保存 (仅 UI 示例)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettingsModal;