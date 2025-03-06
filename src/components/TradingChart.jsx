import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { makeCleanable, safeCleanup } from '../utils/cleanup';

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
  hide_side_toolbar = true,
  onPriceUpdate,
  targetPrices = [] // Array of {price, amount, orderId} objects for limit orders
}) => {
  const container = useRef(null);
  const tvWidget = useRef(null);
  const scriptRef = useRef(null);

  // Safely cleanup the TradingView widget
  const safelyCleanupWidget = () => {
    try {
      if (tvWidget.current) {
        // Always ensure destroy exists
        if (typeof tvWidget.current.destroy !== 'function') {
          tvWidget.current.destroy = function() {
            console.log('TradingView widget destroy function called');
          };
        }
      
        // Different ways to cleanup based on what methods are available
        if (typeof tvWidget.current.remove === 'function') {
          try {
            tvWidget.current.remove();
          } catch (err) {
            console.warn('Error removing TradingView widget:', err);
          }
        } else if (typeof tvWidget.current.cleanup === 'function') {
          try {
            tvWidget.current.cleanup();
          } catch (err) {
            console.warn('Error cleaning up TradingView widget:', err);
          }
        }
        
        tvWidget.current = null;
      }
      
      // Also manually clean up the container element
      try {
        const containerElement = document.getElementById(container_id);
        if (containerElement) {
          while (containerElement.firstChild) {
            try {
              containerElement.removeChild(containerElement.firstChild);
            } catch (err) {
              console.warn('Error removing child from container:', err);
              break; // Stop if we encounter an error
            }
          }
        }
      } catch (err) {
        console.warn('Error accessing container element:', err);
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
          // Make sure the container element exists before initializing
          const containerElement = document.getElementById(container_id);
          if (!containerElement) {
            console.error(`TradingView container element with ID "${container_id}" not found`);
            return; // Exit early if the container doesn't exist
          }

          // Clear any existing content to avoid initialization conflicts
          while (containerElement.firstChild) {
            containerElement.removeChild(containerElement.firstChild);
          }
          
          // Create the widget
          const widget = new window.TradingView.widget({
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
            },
            onChartReady: function() {
              try {
                const chart = widget.chart();
                chart.onSymbolChange().subscribe(null, function() {
                  try {
                    const lastPrice = chart.crosshairPrice();
                    if (onPriceUpdate && lastPrice) {
                      onPriceUpdate(lastPrice);
                    }
                  } catch (e) {
                    console.warn('Error in onSymbolChange handler:', e);
                  }
                });
                
                // Add target price lines for limit orders
                if (targetPrices && targetPrices.length > 0) {
                  // Clear any existing lines first
                  chart.removeAllShapes();
                  
                  // Add each target price line
                  targetPrices.forEach((order, index) => {
                    if (order.price) {
                      try {
                        // Create a horizontal line at the target price
                        const lineProperties = {
                          text: `Target: $${order.price} (${order.amount || ''})`,
                          shape: 'horizontal_line',
                          overrides: {
                            linecolor: '#2196F3',
                            linestyle: 0,
                            linewidth: 2,
                            showLabel: true,
                            textcolor: '#2196F3',
                            fontsize: 12
                          }
                        };
                        
                        chart.createShape({ price: order.price }, lineProperties);
                        console.log(`Added target price line at ${order.price}`);
                      } catch (err) {
                        console.warn('Error adding target price line:', err);
                      }
                    }
                  });
                }
                
                console.log(`Chart for ${symbol} is ready`);
              } catch (e) {
                console.warn('Error in onChartReady handler:', e);
              }
            }
          });
          
          // Add destroy method immediately to make React cleanup-friendly
          widget.destroy = function() {
            console.log('TradingView widget custom destroy called');
            try {
              if (typeof this.remove === 'function') {
                this.remove();
              } else if (typeof this.cleanup === 'function') {
                this.cleanup();
              }
            } catch (e) {
              console.warn('Error in TradingView widget custom destroy:', e);
            }
          };
          
          // Make widget cleanup-friendly
          tvWidget.current = makeCleanable(widget);
          
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
    return safeCleanup(() => {
      // Safely clean up widget
      safelyCleanupWidget();
      
      // We'll leave the script in the document to avoid repeated loads
      // This prevents issues with removing scripts that might be in use by other components
    });
  }, [symbol, theme, timeframe, container_id, autosize, allow_symbol_change, hide_side_toolbar, onPriceUpdate, targetPrices]);

  if (!symbol) {
    return (
      <ErrorDisplay>
        <h3>Chart not available</h3>
        <p>No trading pair specified</p>
      </ErrorDisplay>
    );
  }

  return <ChartContainer ref={container} id={container_id} data-testid="trading-chart-container" />;
};

export default React.memo(TradingChart, (prevProps, nextProps) => {
  // Only re-render if key props change
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.timeframe === nextProps.timeframe &&
    prevProps.theme === nextProps.theme
  );
}); 