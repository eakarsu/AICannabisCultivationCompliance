import React from 'react';
import AIReport from './AIReport';

export default function AIJsonRenderer({ data, title = 'AI Analysis' }) {
  return <AIReport response={data} title={title} />;
}
