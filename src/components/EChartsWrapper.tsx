"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartsWrapperProps {
  options: echarts.EChartsOption;
  style?: React.CSSProperties;
}

const EChartsWrapper: React.FC<EChartsWrapperProps> = ({ options, style }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chart.setOption(options);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [options]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px', ...style }} />;
};

export default EChartsWrapper; 