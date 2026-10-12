import React from 'react';
import AIReport from './AIReport';

export default function AIResponseDisplay({ response, loading }) {
  return <AIReport response={response} loading={loading} title="AI Analysis" />;
}
