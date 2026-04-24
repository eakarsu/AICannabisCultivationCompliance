import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FaBrain } from 'react-icons/fa';

function AIResponseDisplay({ response, loading }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const extractText = (resp) => {
    if (!resp) return '';
    if (typeof resp === 'string') return resp;
    if (resp.analysis) return resp.analysis;
    if (resp.recommendation) return resp.recommendation;
    if (resp.prediction) return resp.prediction;
    if (resp.result) return resp.result;
    if (resp.response) return resp.response;
    if (resp.message) return resp.message;
    if (resp.data) {
      if (typeof resp.data === 'string') return resp.data;
      if (resp.data.analysis) return resp.data.analysis;
      if (resp.data.recommendation) return resp.data.recommendation;
      if (resp.data.prediction) return resp.data.prediction;
      if (resp.data.result) return resp.data.result;
      if (resp.data.response) return resp.data.response;
      if (resp.data.message) return resp.data.message;
      if (resp.data.aiResponse) return resp.data.aiResponse;
      if (resp.data.ai_response) return resp.data.ai_response;
      return JSON.stringify(resp.data, null, 2);
    }
    if (resp.aiResponse) return resp.aiResponse;
    if (resp.ai_response) return resp.ai_response;
    return JSON.stringify(resp, null, 2);
  };

  useEffect(() => {
    if (!response || loading) {
      setDisplayedText('');
      return;
    }

    const fullText = extractText(response);
    setIsTyping(true);
    setDisplayedText('');

    let index = 0;
    const chunkSize = 3;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.substring(0, index + chunkSize));
        index += chunkSize;
      } else {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [response, loading]);

  if (loading) {
    return (
      <div className="ai-response-container">
        <div className="ai-response-inner">
          <div className="ai-response-header">
            <div className="ai-response-icon">
              <FaBrain />
            </div>
            <div>
              <div className="ai-response-title">AI Analysis</div>
              <div className="ai-response-subtitle">Processing your request...</div>
            </div>
          </div>
          <div className="ai-typing-indicator">
            <span className="ai-typing-dot"></span>
            <span className="ai-typing-dot"></span>
            <span className="ai-typing-dot"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="ai-response-container">
      <div className="ai-response-inner">
        <div className="ai-response-header">
          <div className="ai-response-icon">
            <FaBrain />
          </div>
          <div>
            <div className="ai-response-title">AI Analysis Complete</div>
            <div className="ai-response-subtitle">Powered by artificial intelligence</div>
          </div>
        </div>
        <div className="ai-response-content">
          <ReactMarkdown>{displayedText}</ReactMarkdown>
          {isTyping && (
            <div className="ai-typing-indicator">
              <span className="ai-typing-dot"></span>
              <span className="ai-typing-dot"></span>
              <span className="ai-typing-dot"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIResponseDisplay;
