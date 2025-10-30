
import React from 'react';
import { APP_AUTHOR, APP_GITHUB_URL, APP_VERSION, APP_PUBLISH_DATE, MIT_LICENSE_TEXT } from '../constants';

const FooterInfo: React.FC = () => {
  return (
    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
      <p>开发者: {APP_AUTHOR}</p>
      <p>GitHub: <a href={APP_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{APP_GITHUB_URL.replace('https://github.com/', '')}</a></p>
      <p className="mt-2">版本: {APP_VERSION} | 发布日期: {APP_PUBLISH_DATE}</p>
      <div className="mt-4 text-left p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-48 whitespace-pre-wrap font-mono text-xs">
        {MIT_LICENSE_TEXT}
      </div>
    </div>
  );
};

export default FooterInfo;
