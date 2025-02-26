import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ChartContainer = styled.div`
  height: 100%;
  width: 100%;
`;

const ErrorDisplay = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text);
  background: var(--bg2);
`;

const TradingChart = ({ 
  symbol, 
  theme = 'dark', 
  timeframe = '60',
  container_id = 'tradingview_chart',
  autosize = true,
  allow_symbol_change = false,
  hide_side_toolbar = true
}) => {
  const container = useRef(null);
  const tvWidget = useRef(null);
  const scriptRef = useRef(null);

  // Safely cleanup the TradingView widget
  const safelyCleanupWidget = () => {
    try {
      if (tvWidget.current) {
        // Different ways to cleanup based on what methods are available
        if (typeof tvWidget.current.remove === 'function') {
          tvWidget.current.remove();
        } else if (typeof tvWidget.current.cleanup === 'function') {
          tvWidget.current.cleanup();
        }
        tvWidget.current = null;
      }
      
      // Also manually clean up the container element
      const containerElement = document.getElementById(container_id);
      if (containerElement) {
        while (containerElement.firstChild) {
          containerElement.removeChild(containerElement.firstChild);
        }
      }
    } catch (error) {
      console.error('Error cleaning up TradingView widget:', error);
    }
  };

  useEffect(() => {
    // First, safely cleanup any existing widget
    safelyCleanupWidget();

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.id = 'tradingview-script';
    scriptRef.current = script;
    
    // Check if script already exists in document
    if (!document.getElementById('tradingview-script')) {
      document.head.appendChild(script);
    }
    
    // Initialize widget after script loads
    const initializeWidget = () => {
      if (window.TradingView && symbol) {
        try {
          // Create the widget
          tvWidget.current = new window.TradingView.widget({
            symbol: symbol,
            interval: timeframe,
            container_id: container_id,
            locale: 'en',
            theme: theme === 'dark' ? 'dark' : 'light',
            autosize: autosize,
            timezone: 'exchange',
            style: '1',
            toolbar_bg: theme === 'dark' ? '#1E2026' : '#F0F3FA',
            enable_publishing: false,
            allow_symbol_change: allow_symbol_change,
            hide_side_toolbar: hide_side_toolbar,
            studies: [],
            disabled_features: [
              'header_symbol_search',
              'header_screenshot',
              'header_compare',
              'header_saveload',
              'save_chart_properties_to_local_storage'
            ],
            enabled_features: ['hide_left_toolbar_by_default'],
            overrides: {
              'mainSeriesProperties.candleStyle.upColor': '#0ECB81',
              'mainSeriesProperties.candleStyle.downColor': '#F6465D',
              'mainSeriesProperties.candleStyle.wickUpColor': '#0ECB81',
              'mainSeriesProperties.candleStyle.wickDownColor': '#F6465D',
              'paneProperties.background': theme === 'dark' ? '#1E2026' : '#ffffff',
              'paneProperties.vertGridProperties.color': theme === 'dark' ? '#2A2E39' : '#f0f3fa',
              'paneProperties.horzGridProperties.color': theme === 'dark' ? '#2A2E39' : '#f0f3fa',
            }
          });
          
          console.log(`TradingView widget initialized for ${symbol}`);
        } catch (error) {
          console.error('Error initializing TradingView widget:', error);
        }
      }
    };

    // If script is already loaded, initialize immediately
    if (window.TradingView) {
      initializeWidget();
    } else {
      // Otherwise wait for script to load
      script.onload = initializeWidget;
    }

    // Cleanup function
    return () => {
      // Safely clean up widget
      safelyCleanupWidget();
      
      // We'll leave the script in the document to avoid repeated loads
      // This prevents issues with removing scripts that might be in use by other components
    };
  }, [symbol, theme, timeframe, container_id, autosize, allow_symbol_change, hide_side_toolbar]);

  if (!symbol) {
    return (
      <ErrorDisplay>
        <h3>Chart not available</h3>
        <p>No trading pair specified</p>
      </ErrorDisplay>
    );
  }

  return <ChartContainer ref={container} id={container_id} />;
};

export default TradingChart; 