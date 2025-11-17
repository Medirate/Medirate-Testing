"use client";

import React, { useState, useEffect } from "react";

interface USMapProps {
  onStateSelect?: (state: string | null) => void;
  selectedState?: string | null;
}

const USMap: React.FC<USMapProps> = ({ onStateSelect, selectedState }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Clear hover state when selected state changes
  useEffect(() => {
    if (selectedState && hoveredState === selectedState) {
      setHoveredState(null);
    }
  }, [selectedState, hoveredState]);

  const handleStateClick = (stateName: string) => {
    // If clicking the same state, deselect it
    if (selectedState === stateName) {
      onStateSelect?.(null);
    } else {
      // Select the new state (this will automatically deselect the previous one)
      onStateSelect?.(stateName);
    }
  };

  const handleStateHover = (stateName: string, event: React.MouseEvent) => {
    // Only show hover effect if the state is not currently selected
    if (selectedState !== stateName) {
      setHoveredState(stateName);
    }
  };

  const handleStateLeave = (stateName: string) => {
    setHoveredState(null);
  };

  return (
    <div className="relative w-full h-full">
      <svg
        id="us-map"
        className="w-full h-full"
        viewBox="174 100 959 593"
        preserveAspectRatio="xMinYMin meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Alaska */}
        {/* Alaska */}
        <path
          id="AK"
          d="M332.1,553.7l-0.3,85.4l1.6,1l3.1,0.2l1.5-1.1h2.6l0.2,2.9l7,6.8l0.5,2.6l3.4-1.9l0.6-0.2l0.3-3.1l1.5-1.6l1.1-0.2l1.9-1.5l3.1,2.1l0.6,2.9l1.9,1.1l1.1,2.4l3.9,1.8l3.4,6l2.7,3.9l2.3,2.7l1.5,3.7l5,1.8l5.2,2.1l1,4.4l0.5,3.1l-1,3.4l-1.8,2.3l-1.6-0.8l-1.5-3.1l-2.7-1.5l-1.8-1.1l-0.8,0.8l1.5,2.7l0.2,3.7l-1.1,0.5l-1.9-1.9l-2.1-1.3l0.5,1.6l1.3,1.8l-0.8,0.8c0,0-0.8-0.3-1.3-1c-0.5-0.6-2.1-3.4-2.1-3.4l-1-2.3c0,0-0.3,1.3-1,1c-0.6-0.3-1.3-1.5-1.3-1.5l1.8-1.9l-1.5-1.5v-5h-0.8l-0.8,3.4l-1.1,0.5l-1-3.7l-0.6-3.7l-0.8-0.5l0.3,5.7v1.1l-1.5-1.3l-3.6-6l-2.1-0.5l-0.6-3.7l-1.6-2.9l-1.6-1.1v-2.3l2.1-1.3l-0.5-0.3l-2.6,0.6l-3.4-2.4l-2.6-2.9l-4.8-2.6l-4-2.6l1.3-3.2v-1.6l-1.8,1.6l-2.9,1.1l-3.7-1.1l-5.7-2.4h-5.5l-0.6,0.5l-6.5-3.9l-2.1-0.3l-2.7-5.8l-3.6,0.3l-3.6,1.5l0.5,4.5l1.1-2.9l1,0.3l-1.5,4.4l3.2-2.7l0.6,1.6l-3.9,4.4l-1.3-0.3l-0.5-1.9l-1.3-0.8l-1.3,1.1l-2.7-1.8l-3.1,2.1l-1.8,2.1l-3.4,2.1l-4.7-0.2l-0.5-2.1l3.7-0.6v-1.3l-2.3-0.6l1-2.4l2.3-3.9v-1.8l0.2-0.8l4.4-2.3l1,1.3h2.7l-1.3-2.6l-3.7-0.3l-5,2.7l-2.4,3.4l-1.8,2.6l-1.1,2.3l-4.2,1.5l-3.1,2.6l-0.3,1.6l2.3,1l0.8,2.1l-2.7,3.2l-6.5,4.2l-7.8,4.2l-2.1,1.1l-5.3,1.1l-5.3,2.3l1.8,1.3l-1.5,1.5l-0.5,1.1l-2.7-1l-3.2,0.2l-0.8,2.3h-1l0.3-2.4l-3.6,1.3l-2.9,1l-3.4-1.3l-2.9,1.9h-3.2l-2.1,1.3l-1.6,0.8l-2.1-0.3l-2.6-1.1l-2.3,0.6l-1,1l-1.6-1.1v-1.9l3.1-1.3l6.3,0.6l4.4-1.6l2.1-2.1l2.9-0.6l1.8-0.8l2.7,0.2l1.6,1.3l1-0.3l2.3-2.7l3.1-1l3.4-0.6l1.3-0.3l0.6,0.5h0.8l1.3-3.7l4-1.5l1.9-3.7l2.3-4.5l1.6-1.5l0.3-2.6l-1.6,1.3l-3.4,0.6l-0.6-2.4l-1.3-0.3l-1,1l-0.2,2.9l-1.5-0.2l-1.5-5.8l-1.3,1.3l-1.1-0.5l-0.3-1.9l-4,0.2l-2.1,1.1l-2.6-0.3l1.5-1.5l0.5-2.6l-0.6-1.9l1.5-1l1.3-0.2l-0.6-1.8v-4.4l-1-1l-0.8,1.5h-6.1l-1.5-1.3l-0.6-3.9l-2.1-3.6v-1l2.1-0.8l0.2-2.1l1.1-1.1l-0.8-0.5l-1.3,0.5l-1.1-2.7l1-5l4.5-3.2l2.6-1.6l1.9-3.7l2.7-1.3l2.6,1.1l0.3,2.4l2.4-0.3l3.2-2.4l1.6,0.6l1,0.6h1.6l2.3-1.3l0.8-4.4c0,0,0.3-2.9,1-3.4c0.6-0.5,1-1,1-1l-1.1-1.9l-2.6,0.8l-3.2,0.8l-1.9-0.5l-3.6-1.8l-5-0.2l-3.6-3.7l0.5-3.9l0.6-2.4l-2.1-1.8l-1.9-3.7l0.5-0.8l6.8-0.5h2.1l1,1h0.6l-0.2-1.6l3.9-0.6l2.6,0.3l1.5,1.1l-1.5,2.1l-0.5,1.5l2.7,1.6l5,1.8l1.8-1l-2.3-4.4l-1-3.2l1-0.8l-3.4-1.9l-0.5-1.1l0.5-1.6l-0.8-3.9l-2.9-4.7l-2.4-4.2l2.9-1.9h3.2l1.8,0.6l4.2-0.2l3.7-3.6l1.1-3.1l3.7-2.4l1.6,1l2.7-0.6l3.7-2.1l1.1-0.2l1,0.8l4.5-0.2l2.7-3.1h1.1l3.6,2.4l1.9,2.1l-0.5,1.1l0.6,1.1l1.6-1.6l3.9,0.3l0.3,3.7l1.9,1.5l7.1,0.6l6.3,4.2l1.5-1l5.2,2.6l2.1-0.6l1.9-0.8l4.8,1.9L332.1,553.7z"
          fill={selectedState === "Alaska" ? "#3B82F6" : hoveredState === "Alaska" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Alaska" ? "#1D4ED8" : hoveredState === "Alaska" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Alaska" ? "2" : hoveredState === "Alaska" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Alaska")}
          onMouseEnter={(e) => handleStateHover("Alaska", e)}
          onMouseLeave={() => handleStateLeave("Alaska")}
        />

        {/* Hawaii */}
        <path
          id="HI"
          d="M407.1,619.3l1.9-3.6l2.3-0.3l0.3,0.8l-2.1,3.1H407.1z M417.3,615.6l6.1,2.6l2.1-0.3l1.6-3.9l-0.6-3.4l-4.2-0.5l-4,1.8L417.3,615.6z M448,625.6l3.7,5.5l2.4-0.3l1.1-0.5l1.5,1.3l3.7-0.2l1-1.5l-2.9-1.8l-1.9-3.7l-2.1-3.6l-5.8,2.9L448,625.6z M468.2,634.5l1.3-1.9l4.7,1l0.6-0.5l6.1,0.6l-0.3,1.3l-2.6,1.5l-4.4-0.3L468.2,634.5z M473.5,639.7l1.9,3.9l3.1-1.1l0.3-1.6l-1.6-2.1l-3.7-0.3V639.7z M480.5,638.5l2.3-2.9l4.7,2.4l4.4,1.1l4.4,2.7v1.9l-3.6,1.8l-4.8,1l-2.4-1.5L480.5,638.5z M497.1,654.1l1.6-1.3l3.4,1.6l7.6,3.6l3.4,2.1l1.6,2.4l1.9,4.4l4,2.6l-0.3,1.3l-3.9,3.2l-4.2,1.5l-1.5-0.6l-3.1,1.8l-2.4,3.2l-2.3,2.9l-1.8-0.2l-3.6-2.6l-0.3-4.5l0.6-2.4l-1.6-5.7l-2.1-1.8l-0.2-2.6l2.3-1l2.1-3.1l0.5-1l-1.6-1.8L497.1,654.1z"
          fill={selectedState === "Hawaii" ? "#3B82F6" : hoveredState === "Hawaii" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Hawaii" ? "#1D4ED8" : hoveredState === "Hawaii" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Hawaii" ? "2" : hoveredState === "Hawaii" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Hawaii")}
          onMouseEnter={(e) => handleStateHover("Hawaii", e)}
          onMouseLeave={() => handleStateLeave("Hawaii")}
        />

        {/* Florida */}
        <path
          id="FL"
          d="M929.4,545.5l2.3,7.3l3.7,9.7l5.3,9.4l3.7,6.3l4.8,5.5l4,3.7l1.6,2.9l-1.1,1.3L953,593l2.9,7.4l2.9,2.9l2.6,5.3l3.6,5.8l4.5,8.2l1.3,7.6l0.5,12l0.6,1.8l-0.3,3.4l-2.4,1.3l0.3,1.9l-0.6,1.9l0.3,2.4l0.5,1.9l-2.7,3.2l-3.1,1.5l-3.9,0.2l-1.5,1.6l-2.4,1l-1.3-0.5l-1.1-1l-0.3-2.9l-0.8-3.4l-3.4-5.2l-3.6-2.3l-3.9-0.3l-0.8,1.3l-3.1-4.4l-0.6-3.6l-2.6-4l-1.8-1.1l-1.6,2.1l-1.8-0.3l-2.1-5l-2.9-3.9l-2.9-5.3l-2.6-3.1l-3.6-3.7l2.1-2.4l3.2-5.5l-0.2-1.6l-4.5-1l-1.6,0.6l0.3,0.6l2.6,1l-1.5,4.5l-0.8,0.5l-1.8-4l-1.3-4.8l-0.3-2.7l1.5-4.7v-9.5L910,585l-1.3-3.1l-5.2-1.3l-1.9-0.6l-1.6-2.6l-3.4-1.6l-1.1-3.4l-2.7-1l-2.4-3.7l-4.2-1.5l-2.9-1.5h-2.6l-4,0.8l-0.2,1.9l0.8,1l-0.5,1.1l-3.1-0.2l-3.7,3.6l-3.6,1.9h-3.9l-3.2,1.3l-0.3-2.7l-1.6-1.9l-2.9-1.1l-1.6-1.5l-8.1-3.9l-7.6-1.8l-4.4,0.6l-6,0.5l-6,2.1l-3.5,0.6l-0.2-8l-2.6-1.9l-1.8-1.8l0.3-3.1l10.2-1.3l25.5-2.9l6.8-0.6l5.4,0.3l2.6,3.9l1.5,1.5l8.1,0.5l10.8-0.6l21.5-1.3l5.4-0.7l4.6,0l0.2,2.9l3.8,0.8l0.3-4.8l-1.6-4.5l1-0.7l5.1,0.5L929.4,545.5z"
          fill={selectedState === "Florida" ? "#3B82F6" : hoveredState === "Florida" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Florida" ? "#1D4ED8" : hoveredState === "Florida" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Florida" ? "2" : hoveredState === "Florida" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Florida")}
          onMouseEnter={(e) => handleStateHover("Florida", e)}
          onMouseLeave={() => handleStateLeave("Florida")}
        />

        {/* California */}
        <path
          id="CA"
          d="M310.7,486.8l3.8-0.5l1.5-2l0.7-1.9l-3.2-0.1l-1.1-1.8l0.8-1.7l0-6.2l2.2-1.3l2.7-2.6l0.4-4.9l1.6-3.5l1.9-2.1l3.3-1.7l1.3-0.7l0.8-1.5l-0.9-0.9l-1-1.5l-0.9-5.3l-2.9-5.2l0.1-2.8l-2.2-3.2l-15-23.2l-19.4-28.7l-22.4-33l-12.7-19.5l1.8-7.2l6.8-25.9l8.1-31.4l-12.4-3.3l-13.5-3.4l-12.6-4.1l-7.5-2.1l-11.4-3l-7.1-2.4l-1.6,4.7l-0.2,7.4l-5.2,11.8l-3.1,2.6l-0.3,1.1l-1.8,0.8l-1.5,4.2l-0.8,3.2l2.7,4.2l1.6,4.2l1.1,3.6l-0.3,6.5l-1.8,3.1l-0.6,5.8l-1,3.7l1.8,3.9l2.7,4.5l2.3,4.8l1.3,4l-0.3,3.2l-0.3,0.5v2.1l5.7,6.3l-0.5,2.4l-0.6,2.3l-0.6,1.9l0.2,8.2l2.1,3.7l1.9,2.6l2.7,0.5l1,2.7l-1.1,3.6l-2.1,1.6h-1.1l-0.8,3.9l0.5,2.9l3.2,4.4l1.6,5.3l1.5,4.7l1.3,3.1l3.4,5.8l1.5,2.6l0.5,2.9l1.6,1v2.4l-0.8,1.9l-1.8,7.1l-0.5,1.9l2.4,2.7l4.2,0.5l4.5,1.8l3.9,2.1h2.9l2.9,3.1l2.6,4.8l1.1,2.3l3.9,2.1l4.8,0.8l1.5,2.1l0.6,3.2l-1.5,0.6l0.3,1l3.2,0.8l2.7,0.2l2.9,4.7l3.9,4.2l0.8,2.3l2.6,4.2l0.3,3.2v9.4l0.5,1.8l10,1.5l19.7,2.7L310.7,486.8z"
          fill={selectedState === "California" ? "#3B82F6" : hoveredState === "California" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "California" ? "#1D4ED8" : hoveredState === "California" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "California" ? "2" : hoveredState === "California" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("California")}
          onMouseEnter={(e) => handleStateHover("California", e)}
          onMouseLeave={() => handleStateLeave("California")}
        />

        {/* Texas */}
        <path
          id="TX"
          d="M531.1,433.4l22.7,1.1l31.1,1.1l-2.3,23.5l-0.3,18.2l0.1,2.1l4.3,3.8l1.7,0.8l1.8,0.3l0.7-1.3l0.9,0.9l1.7,0.5l1.6-0.7l1.1,0.4l-0.3,3.4l4.3,1l2.7,0.8l4,0.5l2.2,1.8l3.2-1.6l2.8,0.4l2,2.8l1.1,0.3l-0.2,2l3.1,1.2l2.8-1.8l1.5,0.4l2.4,0.2l0.4,1.9l4.6,2l2.7-0.2l2-4.1h0.3l1.1,1.9l4.4,1l3.3,1.2l3.3,0.8l2.1-0.8l0.8-2.5h3.7l1.9,0.8l3.1-1.6h0.7l0.4,1.1h4.3l2.4-1.3l1.7,0.3l1.4,1.9l2.9,1.7l3.5,1.1l2.7,1.4l2.4,1.6l3.3-0.9l1.9,1l0.5,10.1l0.3,9.7l0.7,9.5l0.5,4l2.7,4.6l1.1,4.1l3.9,6.3l0.5,2.9l0.5,1l-0.7,7.5l-2.7,4.4l1,2.9l-0.4,2.5l-0.8,7.3l-1.4,2.7l0.6,4.4l-5.7,1.6l-9.9,4.5l-1,1.9l-2.6,1.9l-2.1,1.5l-1.3,0.8l-5.7,5.3l-2.7,2.1l-5.3,3.2l-5.7,2.4l-6.3,3.4l-1.8,1.5l-5.8,3.6l-3.4,0.6l-3.9,5.5l-4,0.3l-1,1.9l2.3,1.9l-1.5,5.5l-1.3,4.5l-1.1,3.9l-0.8,4.5l0.8,2.4l1.8,7l1,6.1l1.8,2.7l-1,1.5l-3.1,1.9l-5.7-3.9l-5.5-1.1l-1.3,0.5l-3.2-0.6l-4.2-3.1l-5.2-1.1l-7.6-3.4l-2.1-3.9l-1.3-6.5l-3.2-1.9l-0.6-2.3l0.6-0.6l0.3-3.4l-1.3-0.6l-0.6-1l1.3-4.4l-1.6-2.3l-3.2-1.3l-3.4-4.4l-3.6-6.6l-4.2-2.6l0.2-1.9l-5.3-12.3l-0.8-4.2l-1.8-1.9l-0.2-1.5l-6-5.3l-2.6-3.1v-1.1l-2.6-2.1l-6.8-1.1l-7.4-0.6l-3.1-2.3l-4.5,1.8l-3.6,1.5l-2.3,3.2l-1,3.7l-4.4,6.1l-2.4,2.4l-2.6-1l-1.8-1.1l-1.9-0.6l-3.9-2.3v-0.6l-1.8-1.9l-5.2-2.1l-7.4-7.8l-2.3-4.7v-8.1l-3.2-6.5l-0.5-2.7l-1.6-1l-1.1-2.1l-5-2.1l-1.3-1.6l-7.1-7.9l-1.3-3.2l-4.7-2.3l-1.5-4.4l-2.6-2.9l-1.9-0.5l-0.6-4.7l8,0.7l29,2.7l29,1.6l2.3-23.8l3.9-55.6l1.6-18.7l1.4,0"
          fill={selectedState === "Texas" ? "#3B82F6" : hoveredState === "Texas" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Texas" ? "#1D4ED8" : hoveredState === "Texas" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Texas" ? "2" : hoveredState === "Texas" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Texas")}
          onMouseEnter={(e) => handleStateHover("Texas", e)}
          onMouseLeave={() => handleStateLeave("Texas")}
        />

        {/* Add more states here - I'll add a few key ones for demonstration */}
        {/* New York */}
        <path
          id="NY"
          d="M1002.6,289.4l-1.1-1l-2.6-0.2l-2.3-1.9l-1.6-6.1l-3.5,0.1l-2.4-2.7l-19.4,4.4l-43,8.7l-7.5,1.2l-0.7-6.5l1.4-1.1l1.3-1.1l1-1.6l1.8-1.1l1.9-1.8l0.5-1.6l2.1-2.7l1.1-1l-0.2-1l-1.3-3.1l-1.8-0.2l-1.9-6.1l2.9-1.8l4.4-1.5l4-1.3l3.2-0.5l6.3-0.2l1.9,1.3l1.6,0.2l2.1-1.3l2.6-1.1l5.2-0.5l2.1-1.8l1.8-3.2l1.6-1.9h2.1l1.9-1.1l0.2-2.3l-1.5-2.1l-0.3-1.5l1.1-2.1v-1.5h-1.8l-1.8-0.8l-0.8-1.1l-0.2-2.6l5.8-5.5l0.6-0.8l1.5-2.9l2.9-4.5l2.7-3.7l2.1-2.4l2.4-1.8l3.1-1.2l5.5-1.3l3.2,0.2l4.5-1.5l7.6-2.1l0.5,5l2.4,6.5l0.8,5.2l-1,3.9l2.6,4.5l0.8,2.1l-0.8,2.9l2.9,1.3l0.6,0.3l3.1,11l-0.5,5.1l-0.5,10.8l0.8,5.5l0.8,3.6l1.5,7.3v8.1l-1.1,2.3l1.8,2l0.8,1.7l-1.9,1.8l0.3,1.3l1.3-0.3l1.5-1.3l2.3-2.6l1.1-0.6l1.6,0.6l2.3,0.2l7.9-3.9l2.9-2.7l1.3-1.5l4.2,1.6l-3.4,3.6l-3.9,2.9l-7.1,5.3l-2.6,1l-5.8,1.9l-4,1.1l-1.2-0.5l-0.2-3.7l0.5-2.7l-0.2-2.1l-2.8-1.7l-4.5-1l-3.9-1.1L1002.6,289.4z"
          fill={selectedState === "New York" ? "#3B82F6" : hoveredState === "New York" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "New York" ? "#1D4ED8" : hoveredState === "New York" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "New York" ? "2" : hoveredState === "New York" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("New York")}
          onMouseEnter={(e) => handleStateHover("New York", e)}
          onMouseLeave={() => handleStateLeave("New York")}
        />

        {/* Illinois */}
        <path
          id="IL"
          d="M791.8,401.6V398l0.3-4.9l2.4-3.1l1.8-3.8l2.6-3.9l-0.4-5.3l-2-3.5l-0.1-3.3l0.7-5.3l-0.8-7.2l-1.1-15.8l-1.3-15l-0.9-11.6l-0.3-0.9l-0.8-2.6l-1.3-3.7l-1.6-1.8l-1.5-2.6l-0.2-5.5l-9.9,1.3l-27.2,1.7l-8.7-0.4l0.2,2.4l2.3,0.7l0.9,1.1l0.5,1.8l3.9,3.4l0.7,2.3l-0.7,3.4l-1.8,3.7l-0.7,2.5l-2.3,1.8l-1.8,0.7l-5.3,1.4l-0.7,1.8L736,330l0.7,1.4l1.8,1.6l-0.2,4.1l-1.8,1.6l-0.7,1.6v2.7l-1.8,0.5l-1.6,1.1l-0.2,1.4l0.2,2.1l-1.7,1.3l-1,2.8l0.5,3.7l2.3,7.3l7.3,7.5l5.5,3.7l-0.2,4.3l0.9,1.4l6.4,0.5l2.7,1.4l-0.7,3.7l-2.3,5.9l-0.7,3.2l2.3,3.9l6.4,5.3l4.6,0.7l2.1,5l2.1,3.2l-0.9,3l1.6,4.1l1.8,2.1l1.9-0.8l0.7-2.2l2-1.4l3.2-1.1l3.1,1.2l2.9,1.1l0.8-0.2l-0.1-1.2l-1.1-2.8l0.4-2.4l2.3-1.6l2.4-1l1.2-0.4l-0.6-1.3l-0.8-2.2l1.2-1.3L791.8,401.6z"
          fill={selectedState === "Illinois" ? "#3B82F6" : hoveredState === "Illinois" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Illinois" ? "#1D4ED8" : hoveredState === "Illinois" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Illinois" ? "2" : hoveredState === "Illinois" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Illinois")}
          onMouseEnter={(e) => handleStateHover("Illinois", e)}
          onMouseLeave={() => handleStateLeave("Illinois")}
        />

        {/* South Carolina */}
        <path
          id="SC"
          d="M935.2,512.9l-1.8,1l-2.6-1.3l-0.6-2.1l-1.3-3.6l-2.3-2.1l-2.6-0.6l-1.6-4.8l-2.7-6l-4.2-1.9l-2.1-1.9l-1.3-2.6L910,485l-2.3-1.3l-2.3-2.9l-3.1-2.3l-4.5-1.8l-0.5-1.5l-2.4-2.9l-0.5-1.5l-3.4-5.2l-3.4,0.2l-4-2.4l-1.3-1.3l-0.3-1.8l0.8-1.9l2.3-1l-0.3-2.1l6.1-2.6l9.1-4.5l7.3-0.8l16.5-0.5l2.3,1.9l1.6,3.2l4.4-0.5l12.6-1.5l2.9,0.8l12.6,7.6l10.1,8.1l-5.4,5.5l-2.6,6.1l-0.5,6.3l-1.6,0.8l-1.1,2.7l-2.4,0.6l-2.1,3.6l-2.7,2.7l-2.3,3.4l-1.6,0.8l-3.6,3.4l-2.9,0.2l1,3.2l-5,5.5L935.2,512.9z"
          fill={selectedState === "South Carolina" ? "#3B82F6" : hoveredState === "South Carolina" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "South Carolina" ? "#1D4ED8" : hoveredState === "South Carolina" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "South Carolina" ? "2" : hoveredState === "South Carolina" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("South Carolina")}
          onMouseEnter={(e) => handleStateHover("South Carolina", e)}
          onMouseLeave={() => handleStateLeave("South Carolina")}
        />

        {/* Georgia */}
        <path
          id="GA"
          d="M863.6,458l-4.8,0.8l-8.4,1.1l-8.6,0.9v2.2l0.2,2.1l0.6,3.4l3.4,7.9l2.4,9.9l1.5,6.1l1.6,4.8l1.5,7l2.1,6.3l2.6,3.4l0.5,3.4l1.9,0.8l0.2,2.1l-1.8,4.8l-0.5,3.2l-0.2,1.9l1.6,4.4l0.3,5.3l-0.8,2.4l0.6,0.8l1.5,0.8l0.6,3.4l2.6,3.9l1.5,1.5l7.9,0.2l10.8-0.6l21.5-1.3l5.4-0.7l4.6,0l0.2,2.9l2.6,0.8l0.3-4.4l-1.6-4.5l1.1-1.6l5.8,0.8l5,0.3l-0.8-6.3l2.3-10l1.5-4.2l-0.5-2.6l3.3-6.2l-0.5-1.4l-1.9,0.7l-2.6-1.3l-0.6-2.1l-1.3-3.6l-2.3-2.1l-2.6-0.6l-1.6-4.8l-2.9-6.3l-4.2-1.9l-2.1-1.9l-1.3-2.6l-2.1-1.9l-2.3-1.3l-2.3-2.9l-3.1-2.3l-4.5-1.8l-0.5-1.5l-2.4-2.9l-0.5-1.5l-3.4-4.9l-3.4,0.2l-4.1-3l-1.3-1.3l-0.3-1.8l0.8-1.9l2.4-1.2l-1.1-1.2l0.1-0.3l-5.8,1l-7,0.8L863.6,458z"
          fill={selectedState === "Georgia" ? "#3B82F6" : hoveredState === "Georgia" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Georgia" ? "#1D4ED8" : hoveredState === "Georgia" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Georgia" ? "2" : hoveredState === "Georgia" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Georgia")}
          onMouseEnter={(e) => handleStateHover("Georgia", e)}
          onMouseLeave={() => handleStateLeave("Georgia")}
        />

        {/* Alabama */}
        <path
          id="AL"
          d="M799.6,566.8l-1.6-15.2l-2.7-18.8l0.2-14.1l0.8-31l-0.2-16.7l0.2-6.4l7.8-0.4l27.8-2.6l8.9-0.7l-0.1,2.2l0.2,2.1l0.6,3.4l3.4,7.9l2.4,9.9l1.5,6.1l1.6,4.8l1.5,7l2.1,6.3l2.6,3.4l0.5,3.4l1.9,0.8l0.2,2.1l-1.8,4.8l-0.5,3.2l-0.2,1.9l1.6,4.4l0.3,5.3l-0.8,2.4l0.6,0.8l1.5,0.8l1,2.5h-6.3l-6.8,0.6l-25.5,2.9l-10.4,1.4l-0.1,3.8l1.8,1.8l2.6,1.9l0.6,7.9l-5.5,2.6l-2.7-0.3l2.7-1.9v-1l-3.1-6l-2.3-0.6l-1.5,4.4l-1.3,2.7l-0.6-0.2H799.6z"
          fill={selectedState === "Alabama" ? "#3B82F6" : hoveredState === "Alabama" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Alabama" ? "#1D4ED8" : hoveredState === "Alabama" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Alabama" ? "2" : hoveredState === "Alabama" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Alabama")}
          onMouseEnter={(e) => handleStateHover("Alabama", e)}
          onMouseLeave={() => handleStateLeave("Alabama")}
        />

        {/* North Carolina */}
        <path
          id="NC"
          d="M1006.1,398.5l1.7,4.7l3.6,6.5l2.4,2.4l0.6,2.3l-2.4,0.2l0.8,0.6l-0.3,4.2l-2.6,1.3l-0.6,2.1l-1.3,2.9l-3.7,1.6l-2.4-0.3l-1.5-0.2l-1.6-1.3l0.3,1.3v1h1.9l0.8,1.3l-1.9,6.3h4.2l0.6,1.6l2.3-2.3l1.3-0.5l-1.9,3.6l-3.1,4.8h-1.3l-1.1-0.5l-2.7,0.6l-5.2,2.4l-6.5,5.3l-3.4,4.7l-1.9,6.5l-0.5,2.4l-4.7,0.5l-5.5,1.3l-9.9-8.2l-12.6-7.6l-2.9-0.8l-12.6,1.5l-4.3,0.8l-1.6-3.2l-3-2.1l-16.5,0.5l-7.3,0.8l-9.1,4.5l-6.1,2.6l-1.6,0.3l-5.8,1l-7,0.8l-6.8,0.5l0.5-4.1l1.8-1.5l2.7-0.6l0.6-3.7l4.2-2.7l3.9-1.5l4.2-3.6l4.4-2.1l0.6-3.1l3.9-3.9l0.6-0.2c0,0,0,1.1,0.8,1.1c0.8,0,1.9,0.3,1.9,0.3l2.3-3.6l2.1-0.6l2.3,0.3l1.6-3.6l2.9-2.6l0.5-2.1v-4l4.5,0.7l7.1-1.3l15.8-1.9l17.1-2.6l19.9-4l19.7-4.2l11.4-2.8L1006.1,398.5z"
          fill={selectedState === "North Carolina" ? "#3B82F6" : hoveredState === "North Carolina" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "North Carolina" ? "#1D4ED8" : hoveredState === "North Carolina" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "North Carolina" ? "2" : hoveredState === "North Carolina" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("North Carolina")}
          onMouseEnter={(e) => handleStateHover("North Carolina", e)}
          onMouseLeave={() => handleStateLeave("North Carolina")}
        />

        {/* Tennessee */}
        <path
          id="TN"
          d="M871.1,420.6l-51.9,5l-15.8,1.8l-4.6,0.5l-3.9,0v3.9l-8.4,0.5l-7,0.6l-11.1,0.1l-0.3,5.8l-2.1,6.3l-1,3l-1.3,4.4l-0.3,2.6l-4,2.3l1.5,3.6l-1,4.4l-1,0.8l7.3-0.2l24.1-1.9l5.3-0.2l8.1-0.5l27.8-2.6l10.2-0.8l8.4-1l8.4-1.1l4.8-0.8l-0.1-4.5l1.8-1.5l2.7-0.6l0.6-3.7l4.2-2.7l3.9-1.5l4.2-3.6l4.4-2.1l0.9-3.5l4.3-3.9l0.6-0.2c0,0,0,1.1,0.8,1.1s1.9,0.3,1.9,0.3l2.3-3.6l2.1-0.6l2.3,0.3l1.6-3.6l2.1-2.2l0.6-1l0.2-3.9l-1.5-0.3l-2.4,1.9l-7.9,0.2l-12,1.9L871.1,420.6z"
          fill={selectedState === "Tennessee" ? "#3B82F6" : hoveredState === "Tennessee" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Tennessee" ? "#1D4ED8" : hoveredState === "Tennessee" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Tennessee" ? "2" : hoveredState === "Tennessee" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Tennessee")}
          onMouseEnter={(e) => handleStateHover("Tennessee", e)}
          onMouseLeave={() => handleStateLeave("Tennessee")}
        />

        {/* Rhode Island */}
        <path
          id="RI"
          d="M1048.1,279.8l-0.5-4.2l-0.8-4.4l-1.7-5.9l5.7-1.5l1.6,1.1l3.4,4.4l2.9,4.4l-2.9,1.5l-1.3-0.2l-1.1,1.8l-2.4,1.9L1048.1,279.8z"
          fill={selectedState === "Rhode Island" ? "#3B82F6" : hoveredState === "Rhode Island" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Rhode Island" ? "#1D4ED8" : hoveredState === "Rhode Island" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Rhode Island" ? "2" : hoveredState === "Rhode Island" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Rhode Island")}
          onMouseEnter={(e) => handleStateHover("Rhode Island", e)}
          onMouseLeave={() => handleStateLeave("Rhode Island")}
        />

        {/* Connecticut */}
        <path
          id="CT"
          d="M1047.2,280.1l-0.6-4.2l-0.8-4.4l-1.6-6l-4.2,0.9l-21.8,4.8l0.6,3.3l1.5,7.3v8.1l-1.1,2.3l1.8,2.1l5-3.4l3.6-3.2l1.9-2.1l0.8,0.6l2.7-1.5l5.2-1.1L1047.2,280.1z"
          fill={selectedState === "Connecticut" ? "#3B82F6" : hoveredState === "Connecticut" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Connecticut" ? "#1D4ED8" : hoveredState === "Connecticut" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Connecticut" ? "2" : hoveredState === "Connecticut" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Connecticut")}
          onMouseEnter={(e) => handleStateHover("Connecticut", e)}
          onMouseLeave={() => handleStateLeave("Connecticut")}
        />

        {/* Massachusetts */}
        <path
          id="MA"
          d="M1074,273.9l2.2-0.7l0.5-1.7l1,0.1l1,2.3l-1.3,0.5l-3.9,0.1L1074,273.9z M1064.6,274.7l2.3-2.6h1.6l1.8,1.5l-2.4,1l-2.2,1L1064.6,274.7z M1029.8,252.7l17.5-4.2l2.3-0.6l2.1-3.2l3.7-1.7l2.9,4.4l-2.4,5.2l-0.3,1.5l1.9,2.6l1.1-0.8h1.8l2.3,2.6l3.9,6l3.6,0.5l2.3-1l1.8-1.8l-0.8-2.7l-2.1-1.6l-1.5,0.8l-1-1.3l0.5-0.5l2.1-0.2l1.8,0.8l1.9,2.4l1,2.9l0.3,2.4l-4.2,1.5l-3.9,1.9l-3.9,4.5l-1.9,1.5v-1l2.4-1.5l0.5-1.8l-0.8-3.1l-2.9,1.5l-0.8,1.5l0.5,2.3l-2.1,1l-2.7-4.5l-3.4-4.4l-2.1-1.8l-6.5,1.9l-5.1,1.1l-21.8,4.8l-0.4-4.9l0.6-10.6l5.2-0.9L1029.8,252.7z"
          fill={selectedState === "Massachusetts" ? "#3B82F6" : hoveredState === "Massachusetts" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Massachusetts" ? "#1D4ED8" : hoveredState === "Massachusetts" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Massachusetts" ? "2" : hoveredState === "Massachusetts" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Massachusetts")}
          onMouseEnter={(e) => handleStateHover("Massachusetts", e)}
          onMouseLeave={() => handleStateLeave("Massachusetts")}
        />

        {/* Maine */}
        <path
          id="ME"
          d="M1097.2,177.3l1.9,2.1l2.3,3.7v1.9l-2.1,4.7l-1.9,0.6l-3.4,3.1l-4.8,5.5c0,0-0.6,0-1.3,0c-0.6,0-1-2.1-1-2.1l-1.8,0.2l-1,1.5l-2.4,1.5l-1,1.5l1.6,1.5l-0.5,0.6l-0.5,2.7l-1.9-0.2v-1.6l-0.3-1.3l-1.5,0.3l-1.8-3.2l-2.1,1.3l1.3,1.5l0.3,1.1l-0.8,1.3l0.3,3.1l0.2,1.6l-1.6,2.6l-2.9,0.5l-0.3,2.9l-5.3,3.1l-1.3,0.5l-1.6-1.5l-3.1,3.6l1,3.2l-1.5,1.3l-0.2,4.4l-1.1,6.3l-2.5-1.2l-0.5-3.1l-3.9-1.1l-0.3-2.7l-7.3-23.4l-4.2-13.6l1.4-0.1l1.5,0.4v-2.6l0.8-5.5l2.6-4.7l1.5-4l-1.9-2.4v-6l0.8-1l0.8-2.7l-0.2-1.5l-0.2-4.8l1.8-4.8l2.9-8.9l2.1-4.2h1.3l1.3,0.2v1.1l1.3,2.3l2.7,0.6l0.8-0.8v-1l4-2.9l1.8-1.8l1.5,0.2l6,2.4l1.9,1l9.1,29.9h6l0.8,1.9l0.2,4.8l2.9,2.3h0.8l0.2-0.5l-0.5-1.1L1097.2,177.3z"
          fill={selectedState === "Maine" ? "#3B82F6" : hoveredState === "Maine" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Maine" ? "#1D4ED8" : hoveredState === "Maine" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Maine" ? "2" : hoveredState === "Maine" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Maine")}
          onMouseEnter={(e) => handleStateHover("Maine", e)}
          onMouseLeave={() => handleStateLeave("Maine")}
        />

        {/* New Hampshire */}
        <path
          id="NH"
          d="M1054.8,242.4l0.9-1.1l1.1-3.3l-2.5-0.9l-0.5-3.1l-3.9-1.1l-0.3-2.7l-7.3-23.4l-4.6-14.5l-0.9,0l-0.6,1.6l-0.6-0.5l-1-1l-1.5,1.9l0,5l0.3,5.7l1.9,2.7v4l-3.7,5.1l-2.6,1.1v1.1l1.1,1.8v8.6l-0.8,9.2l-0.2,4.8l1,1.3l-0.2,4.5l-0.5,1.8l1.5,0.9l16.4-4.7l2.3-0.6l1.5-2.6L1054.8,242.4z"
          fill={selectedState === "New Hampshire" ? "#3B82F6" : hoveredState === "New Hampshire" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "New Hampshire" ? "#1D4ED8" : hoveredState === "New Hampshire" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "New Hampshire" ? "2" : hoveredState === "New Hampshire" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("New Hampshire")}
          onMouseEnter={(e) => handleStateHover("New Hampshire", e)}
          onMouseLeave={() => handleStateLeave("New Hampshire")}
        />

        {/* Vermont */}
        <path
          id="VT"
          d="M1018.3,253.7l-0.8-5.7l-2.4-10l-0.6-0.3l-2.9-1.3l0.8-2.9l-0.8-2.1l-2.7-4.6l1-3.9l-0.8-5.2l-2.4-6.5l-0.8-4.9l26.2-6.7l0.3,5.8l1.9,2.7v4l-3.7,4l-2.6,1.1v1.1l1.1,1.8v8.6l-0.8,9.2l-0.2,4.8l1,1.3l-0.2,4.5l-0.5,1.8l0.7,1.6l-7,1.4L1018.3,253.7z"
          fill={selectedState === "Vermont" ? "#3B82F6" : hoveredState === "Vermont" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Vermont" ? "#1D4ED8" : hoveredState === "Vermont" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Vermont" ? "2" : hoveredState === "Vermont" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Vermont")}
          onMouseEnter={(e) => handleStateHover("Vermont", e)}
          onMouseLeave={() => handleStateLeave("Vermont")}
        />

        {/* New Jersey */}
        <path
          id="NJ"
          d="M1002.2,290.3l-2.1,2.4v3.1l-1.9,3.1l-0.2,1.6l1.3,1.3l-0.2,2.4l-2.3,1.1l0.8,2.7l0.2,1.1l2.7,0.3l1,2.6l3.6,2.4l2.4,1.6v0.8l-3.2,3.1l-1.6,2.3l-1.5,2.7l-2.3,1.3l-1.2,0.7l-0.2,1.2l-0.6,2.6l1.1,2.2l3.2,2.9l4.8,2.3l4,0.6l0.2,1.5l-0.8,1l0.3,2.7h0.8l2.1-2.4l0.8-4.8l2.7-4l3.1-6.5l1.1-5.5l-0.6-1.1l-0.2-9.4l-1.6-3.4l-1.1,0.8l-2.7,0.3l-0.5-0.5l1.1-1l2.1-1.9l0.1-1.1l-0.4-3.4l0.5-2.7l-0.2-2.1l-2.6-1.1l-4.5-1l-3.9-1.1L1002.2,290.3z"
          fill={selectedState === "New Jersey" ? "#3B82F6" : hoveredState === "New Jersey" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "New Jersey" ? "#1D4ED8" : hoveredState === "New Jersey" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "New Jersey" ? "2" : hoveredState === "New Jersey" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("New Jersey")}
          onMouseEnter={(e) => handleStateHover("New Jersey", e)}
          onMouseLeave={() => handleStateLeave("New Jersey")}
        />

        {/* Pennsylvania */}
        <path
          id="PA"
          d="M996.2,326.5l1.1-0.6l2.3-0.6l1.5-2.7l1.6-2.3l3.2-3.1v-0.8l-2.4-1.6l-3.6-2.4l-1-2.6l-2.7-0.3l-0.2-1.1l-0.8-2.7l2.3-1.1l0.2-2.4l-1.3-1.3l0.2-1.6l1.9-3.1v-3.1l2.3-2.4l0.2-1.1l-2.6-0.2l-2.3-1.9l-2.4-5.3l-3-0.9l-2.3-2.1l-18.6,4l-43,8.7l-8.9,1.5l-0.5-7.1l-5.5,5.6l-1.3,0.5l-4.2,3l2.9,19.1l2.5,9.7l3.6,19.3l3.3-0.6l11.9-1.5l37.9-7.7l14.9-2.8l8.3-1.6l0.3-0.2l2.1-1.6L996.2,326.5z"
          fill={selectedState === "Pennsylvania" ? "#3B82F6" : hoveredState === "Pennsylvania" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Pennsylvania" ? "#1D4ED8" : hoveredState === "Pennsylvania" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Pennsylvania" ? "2" : hoveredState === "Pennsylvania" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Pennsylvania")}
          onMouseEnter={(e) => handleStateHover("Pennsylvania", e)}
          onMouseLeave={() => handleStateLeave("Pennsylvania")}
        />

        {/* Delaware */}
        <path
          id="DE"
          d="M996.4,330.4l0.6-2.1l0-1.2l-1.3-0.1l-2.1,1.6l-1.5,1.5l1.5,4.2l2.3,5.7l2.1,9.7l1.6,6.3l5-0.2l6.1-1.2l-2.3-7.4l-1,0.5l-3.6-2.4l-1.8-4.7l-1.9-3.6l-2.3-1l-2.1-3.6L996.4,330.4z"
          fill={selectedState === "Delaware" ? "#3B82F6" : hoveredState === "Delaware" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Delaware" ? "#1D4ED8" : hoveredState === "Delaware" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Delaware" ? "2" : hoveredState === "Delaware" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Delaware")}
          onMouseEnter={(e) => handleStateHover("Delaware", e)}
          onMouseLeave={() => handleStateLeave("Delaware")}
        />

        {/* Maryland */}
        <path
          id="MD"
          d="M1011,355.3l-6.1,1.3l-5.8,0.2l-1.8-7.1l-2.1-9.7l-2.3-5.7l-1.3-4.4l-7.5,1.6l-14.9,2.8l-37.5,7.6l1.1,5l1,5.7l0.3-0.3l2.1-2.4l2.3-2.6l2.4-0.6l1.5-1.5l1.8-2.6l1.3,0.6l2.9-0.3l2.6-2.1l2-1.5l1.8-0.5l1.6,1.1l2.9,1.5l1.9,1.8l1.2,1.5l4.1,1.7v2.9l5.5,1.3l1.1,0.5l1.4-2l2.9,2l-1.3,2.5l-0.8,4l-1.8,2.6v2.1l0.6,1.8l5.1,1.4l4.3-0.1l3.1,1l2.1,0.3l1-2.1l-1.5-2.1v-1.8l-2.4-2.1l-2.1-5.5l1.3-5.3l-0.2-2.1l-1.3-1.3c0,0,1.5-1.6,1.5-2.3c0-0.6,0.5-2.1,0.5-2.1l1.9-1.3l1.9-1.6l0.5,1l-1.5,1.6l-1.3,3.7l0.3,1.1l1.8,0.3l0.5,5.5l-2.1,1l0.3,3.6l0.5-0.2l1.1-1.9l1.6,1.8l-1.6,1.3l-0.3,3.4l2.6,3.4l3.9,0.5l1.6-0.8l3.2,4.2l1.4,0.5l6.7-2.8l2-4L1011,355.3z"
          fill={selectedState === "Maryland" ? "#3B82F6" : hoveredState === "Maryland" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Maryland" ? "#1D4ED8" : hoveredState === "Maryland" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Maryland" ? "2" : hoveredState === "Maryland" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Maryland")}
          onMouseEnter={(e) => handleStateHover("Maryland", e)}
          onMouseLeave={() => handleStateLeave("Maryland")}
        />

        {/* West Virginia */}
        <path
          id="WV"
          d="M930.6,342l1.1,4.9l1.1,6.9l3.6-2.7l2.3-3.1l2.5-0.6l1.5-1.5l1.8-2.6l1.2,0.6l2.9-0.3l2.6-2.1l2-1.5l1.8-0.5l1.3,1l2.2,1.1l1.9,1.8l1.4,1.3l-0.1,4.7l-5.7-3.1l-4.5-1.8l-0.2,5.3l-0.5,2.1l-1.6,2.7l-0.6,1.6l-3.1,2.4l-0.5,2.3l-3.4,0.3l-0.3,3.1l-1.1,5.5h-2.6l-1.3-0.8l-1.6-2.7l-1.8,0.2l-0.3,4.4l-2.1,6.6l-5,10.8l0.8,1.3l-0.2,2.7l-2.1,1.9l-1.5-0.3l-3.2,2.4l-2.6-1l-1.8,4.7c0,0-3.7,0.8-4.4,1c-0.6,0.2-2.4-1.3-2.4-1.3l-2.4,2.3l-2.6,0.6l-2.9-0.8l-1.3-1.3l-2.2-3l-3.1-2l-2.6-2.7l-2.9-3.7l-0.6-2.3l-2.6-1.5l-0.8-1.6l-0.2-5.3l2.2-0.1l1.9-0.8l0.2-2.7l1.6-1.5l0.2-5l1-3.9l1.3-0.6l1.3,1.1l0.5,1.8l1.8-1l0.5-1.6l-1.1-1.8v-2.4l1-1.3l2.3-3.4l1.3-1.5l2.1,0.5l2.3-1.6l3.1-3.4l2.3-3.9l0.3-5.7l0.5-5v-4.7l-1.1-3.1l1-1.5l1.3-1.3l3.5,19.8l4.6-0.8L930.6,342z"
          fill={selectedState === "West Virginia" ? "#3B82F6" : hoveredState === "West Virginia" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "West Virginia" ? "#1D4ED8" : hoveredState === "West Virginia" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "West Virginia" ? "2" : hoveredState === "West Virginia" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("West Virginia")}
          onMouseEnter={(e) => handleStateHover("West Virginia", e)}
          onMouseLeave={() => handleStateLeave("West Virginia")}
        />

        {/* Kentucky */}
        <path
          id="KY"
          d="M895.8,397.8l-2.3,2.7l-4.2,3.6L885,410l-1.8,1.8v2.1l-3.9,2.1l-5.7,3.4l-3.5,0.4l-51.9,4.9l-15.8,1.8l-4.6,0.5l-3.9,0l-0.2,4.2l-8.2,0.1l-7,0.6l-10.4,0.2l1.9-0.2l2.2-1.8l2.1-1.1l0.2-3.2l0.9-1.8l-1.6-2.5l0.8-1.9l2.3-1.8l2.1-0.6l2.7,1.3l3.6,1.3l1.1-0.3l0.2-2.3l-1.3-2.4l0.3-2.3l1.9-1.5l2.6-0.6l1.6-0.6l-0.8-1.8l-0.6-1.9l1.1-0.8l1.1-3.3l3-1.7l5.8-1l3.6-0.5l1.5,1.9l1.8,0.8l1.8-3.2l2.9-1.5l1.9,1.6l0.8,1.1l2.1-0.5l-0.2-3.4l2.9-1.6l1.1-0.8l1.1,1.6h4.7l0.8-2.1l-0.3-2.3l2.9-3.6l4.7-3.9l0.5-4.5l2.7-0.3l3.9-1.8l2.7-1.9l-0.3-1.9l-1.5-1.5l0.6-2.2l4.1-0.2l2.4-0.8l2.9,1.6l1.6,4.4l5.8,0.3l1.8,1.8l2.1,0.2l2.4-1.5l3.1,0.5l1.3,1.5l2.7-2.6l1.8-1.3h1.6l0.6,2.7l1.8,1l2.4,2.2l0.2,5.5l0.8,1.6l2.6,1.5l0.6,2.3l2.9,3.7l2.6,2.7L895.8,397.8z"
          fill={selectedState === "Kentucky" ? "#3B82F6" : hoveredState === "Kentucky" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Kentucky" ? "#1D4ED8" : hoveredState === "Kentucky" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Kentucky" ? "2" : hoveredState === "Kentucky" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Kentucky")}
          onMouseEnter={(e) => handleStateHover("Kentucky", e)}
          onMouseLeave={() => handleStateLeave("Kentucky")}
        />

        {/* Ohio */}
        <path
          id="OH"
          d="M905.4,295l-6.1,4.1l-3.9,2.3l-3.4,3.7l-4,3.9l-3.2,0.8l-2.9,0.5l-5.5,2.6l-2.1,0.2l-3.4-3.1l-5.2,0.6l-2.6-1.5l-2.4-1.4l-4.9,0.7l-10.2,1.6l-7.8,1.2l1.3,14.6l1.8,13.7l2.6,23.4l0.6,4.8l4.1-0.1l2.4-0.8l3.4,1.5l2.1,4.4l5.1,0l1.9,2.1l1.8-0.1l2.5-1.3l2.5,0.4l2,1.5l1.7-2.1l2.3-1.3l2.1-0.7l0.6,2.7l1.8,1l3.5,2.3l2.2-0.1l1.1-1.1l-0.1-1.4l1.6-1.5l0.2-5l1-3.9l1.5-1.4l1.5,0.9l0.8,1.2l1.2-0.2l-0.4-2.4l-0.6-0.6v-2.4l1-1.3l2.3-3.4l1.3-1.5l2.1,0.5l2.3-1.6l3.1-3.4l2.3-3.9l0.2-5.4l0.5-5v-4.7l-1.1-3.1l1-1.5l0.9-1l-1.4-9.8L905.4,295z"
          fill={selectedState === "Ohio" ? "#3B82F6" : hoveredState === "Ohio" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Ohio" ? "#1D4ED8" : hoveredState === "Ohio" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Ohio" ? "2" : hoveredState === "Ohio" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Ohio")}
          onMouseEnter={(e) => handleStateHover("Ohio", e)}
          onMouseLeave={() => handleStateLeave("Ohio")}
        />

        {/* Michigan */}
        <path
          id="MI"
          d="M755.6,182.1l1.8-2.1l2.2-0.8l5.4-3.9l2.3-0.6l0.5,0.5l-5.1,5.1l-3.3,1.9l-2.1,0.9L755.6,182.1z M841.8,214.2l0.6,2.5l3.2,0.2l1.3-1.2c0,0-0.1-1.5-0.4-1.6c-0.3-0.2-1.6-1.9-1.6-1.9l-2.2,0.2l-1.6,0.2l-0.3,1.1L841.8,214.2z M871.9,277.2l-3.2-8.2l-2.3-9.1l-2.4-3.2l-2.6-1.8l-1.6,1.1l-3.9,1.8l-1.9,5l-2.7,3.7l-1.1,0.6l-1.5-0.6c0,0-2.6-1.5-2.4-2.1c0.2-0.6,0.5-5,0.5-5l3.4-1.3l0.8-3.4l0.6-2.6l2.4-1.6l-0.3-10l-1.6-2.3l-1.3-0.8l-0.8-2.1l0.8-0.8l1.6,0.3l0.2-1.6L850,231l-1.3-2.6h-2.6l-4.5-1.5l-5.5-3.4h-2.7l-0.6,0.6l-1-0.5l-3.1-2.3l-2.9,1.8l-2.9,2.3l0.3,3.6l1,0.3l2.1,0.5l0.5,0.8l-2.6,0.8l-2.6,0.3l-1.5,1.8l-0.3,2.1l0.3,1.6l0.3,5.5l-3.6,2.1l-0.6-0.2v-4.2l1.3-2.4l0.6-2.4l-0.8-0.8l-1.9,0.8l-1,4.2l-2.7,1.1l-1.8,1.9l-0.2,1l0.6,0.8l-0.6,2.6l-2.3,0.5v1.1l0.8,2.4l-1.1,6.1l-1.6,4l0.6,4.7l0.5,1.1l-0.8,2.4l-0.3,0.8l-0.3,2.7l3.6,6l2.9,6.5l1.5,4.8l-0.8,4.7l-1,6l-2.4,5.2l-0.3,2.7l-3.3,3.1l4.4-0.2l21.4-2.3l7.3-1l0.1,1.7l6.9-1.2l10.3-1.5l3.9-0.5l0.1-0.6l0.2-1.5l2.1-3.7l2-1.7l-0.2-5.1l1.6-1.6l1.1-0.3l0.2-3.6l1.5-3l1.1,0.6l0.2,0.6l0.8,0.2l1.9-1L871.9,277.2z"
          fill={selectedState === "Michigan" ? "#3B82F6" : hoveredState === "Michigan" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Michigan" ? "#1D4ED8" : hoveredState === "Michigan" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Michigan" ? "2" : hoveredState === "Michigan" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Michigan")}
          onMouseEnter={(e) => handleStateHover("Michigan", e)}
          onMouseLeave={() => handleStateLeave("Michigan")}
        />

        {/* Wyoming */}
        <path
          id="WY"
          d="M528.3,243.8l-10.5-0.8l-32.1-3.3l-16.2-2.1l-28.3-4.1l-19.9-3l-1.4,11.2l-3.8,24.3l-5.3,30.4l-1.5,10.5l-1.7,11.9l6.5,0.9l25.9,2.5l20.6,2.3l36.8,4.1l23.8,2.9l4.5-44.2l1.4-25.4L528.3,243.8z"
          fill={selectedState === "Wyoming" ? "#3B82F6" : hoveredState === "Wyoming" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Wyoming" ? "#1D4ED8" : hoveredState === "Wyoming" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Wyoming" ? "2" : hoveredState === "Wyoming" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Wyoming")}
          onMouseEnter={(e) => handleStateHover("Wyoming", e)}
          onMouseLeave={() => handleStateLeave("Wyoming")}
        />

        {/* Montana */}
        <path
          id="MT"
          d="M530.7,222.3l0.6-11.2l2.3-24.8c0.5-5,1.1-8.5,1.4-15.4l0.9-14.6l-30.7-2.8L476,150l-29.3-4l-32.3-5.3l-18.4-3.4l-32.7-6.9l-4.5,21.3l3.4,7.5l-1.4,4.6l1.8,4.6l3.2,1.4l4.6,10.8l2.7,3.2l0.5,1.1l3.4,1.1l0.5,2.1l-7.1,17.6v2.5l2.5,3.2h0.9l4.8-3l0.7-1.1l1.6,0.7l-0.2,5.3l2.7,12.6l3,2.5l0.9,0.7l1.8,2.3l-0.5,3.4l0.7,3.4l1.1,0.9l2.3-2.3h2.7l3.2,1.6l2.5-0.9h4.1l3.7,1.6l2.7-0.5l0.5-3l3-0.7l1.4,1.4l0.5,3.2l1.8,1.4l1.5-11.6l20.7,3l28.2,4l16.6,1.9l31.4,3.5l11,1.5l1.1-15.4L530.7,222.3z"
          fill={selectedState === "Montana" ? "#3B82F6" : hoveredState === "Montana" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Montana" ? "#1D4ED8" : hoveredState === "Montana" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Montana" ? "2" : hoveredState === "Montana" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Montana")}
          onMouseEnter={(e) => handleStateHover("Montana", e)}
          onMouseLeave={() => handleStateLeave("Montana")}
        />

        {/* Idaho */}
        <path
          id="ID"
          d="M336.1,281c-22.6-4.3-14.1-2.8-21.1-4.4l4.4-17.5l4.3-17.7l1.4-4.2l2.5-5.9l-1.3-2.3l-2.5,0.1l-0.8-1l0.5-1.1l0.3-3.1l4.5-5.5l1.8-0.5l1.1-1.1l0.6-3.2l0.9-0.7l3.9-5.8l3.9-4.3l0.2-3.8l-3.4-2.6l-1.3-4.4l0.4-9.7l3.7-16.5l4.5-20.8l3.8-13.5l0.8-3.8l13,2.5l-4.2,21.5l2.9,7.7l-1.1,4.6l2,4.6l3.2,1.7l4.5,9.8l2.7,3.8l0.6,1.1l3.4,1.1l0.5,2.5l-6.9,16.8l0.3,3.3l2.7,2.9l1.9,0.5l4.8-3.6l0.4-0.5l0.2,0.8l0.3,4.1l2.6,12.9l3.5,2.7l0.4,0.8l2.1,2.4l-0.8,2.8l0.7,3.8l1.9,0.9l2.1-1.6l2.6-0.5l3.4,1.6l2.5-0.6l3.8-0.2l4,1.6l2.7-0.3l0.9-2.3l2.5-1.6l0.7,1.7l0.6,2.2l2.3,2.5l-3.8,24l-5.1,29l-4.2-0.3l-8.2-1.5l-9.8-1.8l-12.2-2.4l-12.5-2.5l-8.5-1.8l-9.3-1.7L336.1,281z"
          fill={selectedState === "Idaho" ? "#3B82F6" : hoveredState === "Idaho" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Idaho" ? "#1D4ED8" : hoveredState === "Idaho" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Idaho" ? "2" : hoveredState === "Idaho" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Idaho")}
          onMouseEnter={(e) => handleStateHover("Idaho", e)}
          onMouseLeave={() => handleStateLeave("Idaho")}
        />

        {/* Washington */}
        <path
          id="WA"
          d="M267.6,106.4l4.4,1.5l9.7,2.7l8.6,1.9l20,5.7l23,5.7l15.2,3.4l-1,3.9l-4.1,13.8l-4.5,20.8l-3.2,16.1l-0.4,9.4l-13.2-3.9l-15.6-3.4l-13.7,0.6l-1.6-1.5l-5.3,1.9l-4-0.3l-2.7-1.8l-1.6,0.5l-4.2-0.2l-1.9-1.4l-4.8-1.7l-1.4-0.2l-5-1.3l-1.8,1.5l-5.7-0.3l-4.8-3.8l0.2-0.8l0.1-7.9l-2.1-3.9l-4.1-0.7l-0.4-2.4l-2.5-0.6l-2.9-0.5l-1.8,1l-2.3-2.9l0.3-2.9l2.7-0.3l1.6-4l-2.6-1.1l0.2-3.7l4.4-0.6l-2.7-2.7l-1.5-7.1l0.6-2.9v-7.9l-1.8-3.2l2.3-9.4l2.1,0.5l2.4,2.9l2.7,2.6l3.2,1.9l4.5,2.1l3.1,0.6l2.9,1.5l3.4,1l2.3-0.2v-2.4l1.3-1.1l2.1-1.3l0.3,1.1l0.3,1.8l-2.3,0.5l-0.3,2.1l1.8,1.5l1.1,2.4l0.6,1.9l1.5-0.2l0.2-1.3l-1-1.3l-0.5-3.2l0.8-1.8l-0.6-1.5V119l1.8-3.6l-1.1-2.6l-2.4-4.8l0.3-0.8L267.6,106.4z"
          fill={selectedState === "Washington" ? "#3B82F6" : hoveredState === "Washington" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Washington" ? "#1D4ED8" : hoveredState === "Washington" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Washington" ? "2" : hoveredState === "Washington" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Washington")}
          onMouseEnter={(e) => handleStateHover("Washington", e)}
          onMouseLeave={() => handleStateLeave("Washington")}
        />

        {/* Arizona */}
        <path
          id="AZ"
          d="M311.7,487.5l-2.6,2.2l-0.3,1.5l0.5,1l18.9,10.7l12.1,7.6l14.7,8.6l16.8,10l12.3,2.4l25.1,2.7l2.5-12.5l3.8-27.2l7-52.9l4.3-31l-24.6-3.7l-27.2-4.6l-33.4-6.3l-2.9,18.1l-0.5,0.5l-1.7,2.6l-2.5-0.1l-1.3-2.7l-2.7-0.3l-0.9-1.1h-0.9l-0.9,0.6l-1.9,1l-0.1,7l-0.2,1.7l-0.6,12.6l-1.5,2.2l-0.6,3.3l2.7,4.9l1.3,5.8l0.8,1l1,0.6l-0.1,2.3l-1.6,1.4l-3.4,1.7l-1.9,1.9l-1.5,3.7l-0.6,4.9l-2.9,2.7l-2.1,0.7l-0.1,5.8l-0.5,1.7l0.5,0.8l3.7,0.6l-0.6,2.7l-1.5,2.2L311.7,487.5z"
          fill={selectedState === "Arizona" ? "#3B82F6" : hoveredState === "Arizona" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Arizona" ? "#1D4ED8" : hoveredState === "Arizona" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Arizona" ? "2" : hoveredState === "Arizona" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Arizona")}
          onMouseEnter={(e) => handleStateHover("Arizona", e)}
          onMouseLeave={() => handleStateLeave("Arizona")}
        />

        {/* Nevada */}
        <path
          id="NV"
          d="M314.7,277.6l21,4.5l9.7,1.9l9.3,1.8l6.6,1.6l-0.6,5.9l-3.5,17.3l-4.1,20l-1.9,9.7l-2.2,13.3l-3.2,16.4l-3.5,15.7l-2,10.2l-2.5,16.8l-0.5,1.1l-1.1,2.5l-1.9-0.1l-1.1-2.7l-2.7-0.5l-1.4-1l-2,0.3l-0.9,0.7l-1.3,1.3l-0.4,7l-0.5,1.7l-0.4,12.1l-1.3,1.7l-1.9-2.3l-14.5-22.7l-19.4-29L263.6,349l-12.4-18.6l1.6-6.6l7-25.9l7.9-31.3l33.6,8.1l13.7,3"
          fill={selectedState === "Nevada" ? "#3B82F6" : hoveredState === "Nevada" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Nevada" ? "#1D4ED8" : hoveredState === "Nevada" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Nevada" ? "2" : hoveredState === "Nevada" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Nevada")}
          onMouseEnter={(e) => handleStateHover("Nevada", e)}
          onMouseLeave={() => handleStateLeave("Nevada")}
        />

        {/* Utah */}
        <path
          id="UT"
          d="M427,409.3l-24.6-3.5l-26.6-4.9l-33.8-6l1.6-9.2l3.2-15.2L350,354l2.2-13.6l1.9-8.9l3.8-20.5l3.5-17.5l1.1-5.6l12.7,2.3l12,2.1l10.3,1.8l8.3,1.4l3.7,0.5l-1.5,10.6l-2.3,13.2l7.8,0.9l16.4,1.8l8.2,0.9l-2.1,22l-3.2,22.6l-3.8,27.8l-1.7,11.1L427,409.3z"
          fill={selectedState === "Utah" ? "#3B82F6" : hoveredState === "Utah" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Utah" ? "#1D4ED8" : hoveredState === "Utah" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Utah" ? "2" : hoveredState === "Utah" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Utah")}
          onMouseEnter={(e) => handleStateHover("Utah", e)}
          onMouseLeave={() => handleStateLeave("Utah")}
        />

        {/* Colorado */}
        <path
          id="CO"
          d="M552.6,356.8l1.4-21.3l-32.1-3.1l-24.5-2.7l-37.3-4.1l-20.7-2.5l-2.6,22.2l-3.2,22.4l-3.8,28l-1.5,11.1l-0.3,2.8l33.9,3.8l37.7,4.3l32,3.2l16.6,0.8"
          fill={selectedState === "Colorado" ? "#3B82F6" : hoveredState === "Colorado" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Colorado" ? "#1D4ED8" : hoveredState === "Colorado" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Colorado" ? "2" : hoveredState === "Colorado" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Colorado")}
          onMouseEnter={(e) => handleStateHover("Colorado", e)}
          onMouseLeave={() => handleStateLeave("Colorado")}
        />

        {/* New Mexico */}
        <path
          id="NM"
          d="M456.7,531l-0.7-6.1l8.6,0.5l29.5,3.1l28.4,1.4l2-22.3l3.7-55.9l1.1-19.4l2,0.3l0-11.1l-32.2-2.4l-36.9-4.4l-34.5-4.1l-4.2,30.8l-7,53.2l-3.8,26.9l-2,13.3l15.5,2l1.3-10l16.7,2.6L456.7,531z"
          fill={selectedState === "New Mexico" ? "#3B82F6" : hoveredState === "New Mexico" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "New Mexico" ? "#1D4ED8" : hoveredState === "New Mexico" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "New Mexico" ? "2" : hoveredState === "New Mexico" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("New Mexico")}
          onMouseEnter={(e) => handleStateHover("New Mexico", e)}
          onMouseLeave={() => handleStateLeave("New Mexico")}
        />

        {/* Oregon */}
        <path
          id="OR"
          d="M314.3,276.7l4.3-17.9l4.7-17.9l1.1-4.2l2.4-5.6l-0.6-1.2l-2.5,0l-1.3-1.7l0.5-1.5l0.5-3.2l4.5-5.5l1.8-1.1l1.1-1.1l1.5-3.6l4-5.7l3.6-3.9l0.2-3.5l-3.3-2.5l-1.2-4.5l-13.2-3.7l-15.1-3.5l-15.4,0.1l-0.5-1.4l-5.5,2.1l-4.5-0.6l-2.4-1.6l-1.3,0.7L273,184l-1.7-1.4l-5.3-2.1l-0.8,0.1l-4.3-1.5l-1.9,1.8l-6.2-0.3l-5.9-4.1l0.7-0.8l0.2-7.8l-2.3-3.9l-4.1-0.6l-0.7-2.5l-2.4-0.5l-5.8,2.1l-2.3,6.5l-3.2,10l-3.2,6.5l-5,14.1l-6.5,13.6l-8.1,12.6l-1.9,2.9l-0.8,8.6l-1.3,6l2.7,3.5l6.7,2.3l11.6,3.3l7.9,2.5l12.4,3.6l13.3,3.6l13.2,3.6"
          fill={selectedState === "Oregon" ? "#3B82F6" : hoveredState === "Oregon" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Oregon" ? "#1D4ED8" : hoveredState === "Oregon" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Oregon" ? "2" : hoveredState === "Oregon" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Oregon")}
          onMouseEnter={(e) => handleStateHover("Oregon", e)}
          onMouseLeave={() => handleStateLeave("Oregon")}
        />

        {/* North Dakota */}
        <path
          id="ND"
          d="M645.3,227.7l-0.4-7.5l-2-7.3l-1.8-13.6l-0.5-9.8l-2-3.1l-1.6-5.4v-10.3l0.7-3.9l-2.1-5.5l-28.4-0.6l-18.6-0.6l-26.5-1.3l-24.9-1.9l-1.3,14.2l-1.4,15.1l-2.3,24.9l-0.5,11l56.8,3.8L645.3,227.7z"
          fill={selectedState === "North Dakota" ? "#3B82F6" : hoveredState === "North Dakota" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "North Dakota" ? "#1D4ED8" : hoveredState === "North Dakota" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "North Dakota" ? "2" : hoveredState === "North Dakota" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("North Dakota")}
          onMouseEnter={(e) => handleStateHover("North Dakota", e)}
          onMouseLeave={() => handleStateLeave("North Dakota")}
        />

        {/* South Dakota */}
        <path
          id="SD"
          d="M646.8,303.2l-1-1.1l-1.5-3.6l1.8-3.7l1.1-5.6l-2.6-2.1l-0.3-2.7l0.6-3l2.2-0.8l0.3-5.7l-0.1-30.1l-0.6-3l-4.1-3.6l-1-2v-1.9l1.9-1.3l1.5-1.9l0.2-2.7l-57.4-1.6l-56.2-3.9l-0.8,5.3l-1.6,15.9l-1.3,17.9l-1.6,24.6l16,1l19.6,1.1l18,1.3l23.8,1.3l10.7-0.8l2.9,2.3l4.3,3l1,0.8l3.5-0.9l4-0.3l2.7-0.1l3.1,1.2l4.5,1.4l3.1,1.8l0.6,1.9l0.9,1.9l0.7-0.5L646.8,303.2z"
          fill={selectedState === "South Dakota" ? "#3B82F6" : hoveredState === "South Dakota" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "South Dakota" ? "#1D4ED8" : hoveredState === "South Dakota" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "South Dakota" ? "2" : hoveredState === "South Dakota" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("South Dakota")}
          onMouseEnter={(e) => handleStateHover("South Dakota", e)}
          onMouseLeave={() => handleStateLeave("South Dakota")}
        />

        {/* Nebraska */}
        <path
          id="NE"
          d="M658.2,347l1.4,2.7l0.1,2.1l2.4,3.7l2.7,3.2h-5l-43.5-0.9l-40.8-0.9l-21.2-1l1.1-21.3l-33.4-2.7l4.3-44l15.5,1L562,290l17.8,1.1l23.8,1.1l10.7-0.5l2.1,2.3l4.8,3l1.1,0.9l4.3-1.4l3.9-0.5l2.7-0.2l1.8,1.4l5,1.6l3,1.6l0.5,1.6l0.9,2.1h1.8l0.8,0l1,5.2l2.7,8l1.2,4.6l2.1,3.8l0.5,4.9l1.4,4.3l0.5,6.5"
          fill={selectedState === "Nebraska" ? "#3B82F6" : hoveredState === "Nebraska" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Nebraska" ? "#1D4ED8" : hoveredState === "Nebraska" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Nebraska" ? "2" : hoveredState === "Nebraska" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Nebraska")}
          onMouseEnter={(e) => handleStateHover("Nebraska", e)}
          onMouseLeave={() => handleStateLeave("Nebraska")}
        />

        {/* Iowa */}
        <path
          id="IA"
          d="M740.6,301.6l0.2,1.9l2.3,1.1l1.1,1.3l0.3,1.3l3.9,3.2l0.7,2.2l-0.8,2.9l-1.5,3.5l-0.8,2.7l-2.2,1.6l-1.7,0.6l-5.5,1.5l-0.7,2.3l-0.8,2.3l0.6,1.4l1.7,1.7l0,3.7l-2.2,1.6l-0.5,1.5v2.5l-1.5,0.5l-1.7,1.4l-0.5,1.5l0.5,1.7l-1.4,1.2l-2.3-2.7l-1.5-2.6l-8.3,0.8l-10.2,0.6l-25,0.7l-13,0.2l-9.4,0.2l-1.3,0.1l-1.7-4.5l-0.2-6.6l-1.6-4.1l-0.7-5.3l-2.3-3.7l-0.9-4.8l-2.7-7.5l-1.1-5.4l-1.4-2.2l-1.6-2.7l1.8-4.3l1.4-5.7l-2.7-2.1l-0.5-2.7l0.9-2.5h1.7h11.5l49.6-0.7l19.9-0.7l1.9,2.7l1.8,2.6l0.5,0.8l-1.8,2.7l0.5,4.2l2.5,3.9l3,1.8l2.4,0.2L740.6,301.6z"
          fill={selectedState === "Iowa" ? "#3B82F6" : hoveredState === "Iowa" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Iowa" ? "#1D4ED8" : hoveredState === "Iowa" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Iowa" ? "2" : hoveredState === "Iowa" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Iowa")}
          onMouseEnter={(e) => handleStateHover("Iowa", e)}
          onMouseLeave={() => handleStateLeave("Iowa")}
        />

        {/* Mississippi */}
        <path
          id="MS"
          d="M798.6,567l-0.3,1.3h-5.2l-1.5-0.8l-2.1-0.3l-6.8,1.9l-1.8-0.8l-2.6,4.2l-1.1,0.8l-1.1-2.5l-1.1-3.9l-3.4-3.2l1.1-7.5l-0.7-0.9l-1.8,0.2l-8.2,0.7l-24.2,0.7l-0.5-1.6l0.7-8l3.4-6.2l5.3-9.1l-0.9-2.1h1.1l0.7-3.2l-2.3-1.8l0.2-1.8l-2.1-4.6l-0.3-5.3l1.4-2.7l-0.4-4.3l-1.4-3l1.4-1.4l-1.4-2.1l0.5-1.8l0.9-6.2l3-2.7l-0.7-2.1l3.7-5.3l2.7-0.9v-2.5l-0.7-1.4l2.7-5.3l2.7-1.1l0.1-3.4l8.7-0.1l24.1-1.9l4.6-0.2l0,6.4l0.2,16.7l-0.8,31l-0.2,14.1l2.7,18.8L798.6,567z"
          fill={selectedState === "Mississippi" ? "#3B82F6" : hoveredState === "Mississippi" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Mississippi" ? "#1D4ED8" : hoveredState === "Mississippi" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Mississippi" ? "2" : hoveredState === "Mississippi" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Mississippi")}
          onMouseEnter={(e) => handleStateHover("Mississippi", e)}
          onMouseLeave={() => handleStateLeave("Mississippi")}
        />

        {/* Indiana */}
        <path
          id="IN"
          d="M792.4,400.9l0.1-2.9l0.5-4.5l2.3-2.9l1.8-3.9l2.6-4.2l-0.5-5.8l-1.8-2.7l-0.3-3.2l0.8-5.5l-0.5-7l-1.3-16l-1.3-15.4l-1-11.7l3.1,0.9l1.5,1l1.1-0.3l2.1-1.9l2.8-1.6l5.1-0.2l22-2.3l5.6-0.5l1.5,16l4.3,36.8l0.6,5.8L843,371l1.2,1.8l0.1,1.4l-2.5,1.6l-3.5,1.6l-3.2,0.6l-0.6,4.9l-4.6,3.3l-2.8,4l0.3,2.4l-0.6,1.5h-3.3l-1.6-1.6l-2.5,1.3l-2.7,1.5l0.2,3.1l-1.2,0.3l-0.5-1l-2.2-1.5l-3.3,1.3l-1.6,3l-1.4-0.8l-1.5-1.6l-4.5,0.5l-5.6,1L792.4,400.9z"
          fill={selectedState === "Indiana" ? "#3B82F6" : hoveredState === "Indiana" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Indiana" ? "#1D4ED8" : hoveredState === "Indiana" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Indiana" ? "2" : hoveredState === "Indiana" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Indiana")}
          onMouseEnter={(e) => handleStateHover("Indiana", e)}
          onMouseLeave={() => handleStateLeave("Indiana")}
        />

        {/* Minnesota */}
        <path
          id="MN"
          d="M645.9,228.5l-0.5-8.5l-1.8-7.3l-1.8-13.5l-0.5-9.8l-1.8-3.4l-1.6-5v-10.3l0.7-3.9l-1.8-5.5l30.1,0l0.3-8.2l0.6-0.2l2.3,0.5l1.9,0.8l0.8,5.5l1.5,6.1l1.6,1.6h4.8l0.3,1.5l6.3,0.3v2.1h4.8l0.3-1.3l1.1-1.1l2.3-0.6l1.3,1h2.9l3.9,2.6l5.3,2.4l2.4,0.5l0.5-1l1.5-0.5l0.5,2.9l2.6,1.3l0.5-0.5l1.3,0.2v2.1l2.6,1h3.1l1.6-0.8l3.2-3.2l2.6-0.5l0.8,1.8l0.5,1.3h1l1-0.8l8.9-0.3l1.8,3.1h0.6l0.7-1.1l4.4-0.4l-0.6,2.3l-3.9,1.8l-9.2,4.1l-4.8,2l-3.1,2.6l-2.4,3.6l-2.3,3.9l-1.8,0.8l-4.5,5l-1.3,0.2l-3.8,2.9l-2.8,3.2l-0.2,3l0.2,7.8l-1.6,1.6L704,228l-1.8,5.7l2.5,3.6l0.5,2.5l-1.1,3l-0.2,3.7l0.5,7.1l3.4,4.1h3l2.5,2.3l3.2,1.4l3.7,5l7.1,5l1.8,2.1l0.2,5.5l-20.6,0.7l-60.2,0.5l-0.3-35.7l-0.5-3l-4.1-3.4l-1.1-1.8v-1.6l2.1-1.6l1.4-1.4L645.9,228.5z"
          fill={selectedState === "Minnesota" ? "#3B82F6" : hoveredState === "Minnesota" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Minnesota" ? "#1D4ED8" : hoveredState === "Minnesota" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Minnesota" ? "2" : hoveredState === "Minnesota" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Minnesota")}
          onMouseEnter={(e) => handleStateHover("Minnesota", e)}
          onMouseLeave={() => handleStateLeave("Minnesota")}
        />

        {/* Wisconsin */}
        <path
          id="WI"
          d="M786.9,297.2l0.4-3l-1.6-4.5l-0.6-6.1l-1.1-2.4l1-3.1l0.8-2.9l1.5-2.6l-0.6-3.4l-0.6-3.6l0.5-1.8l1.9-2.4l0.2-2.7l-0.8-1.3l0.6-2.6l0.5-3.2l2.7-5.7l2.9-6.8l0.2-2.3l-0.3-1l-0.8,0.5l-4.2,6.3l-2.7,4l-1.9,1.8l-0.8,2.3l-1.5,0.8l-1.1,1.9l-1.5-0.3l-0.2-1.8l1.3-2.4l2.1-4.7l1.8-1.6l1.1-2.3l-1.6-0.9l-1.4-1.4l-1.6-10.3l-3.7-1.1l-1.4-2.3l-12.6-2.7l-2.5-1.1l-8.2-2.3l-8.2-1.1l-4.2-5.4l-0.5,1.3l-1.1-0.2l-0.6-1.1l-2.7-0.8l-1.1,0.2l-1.8,1l-1-0.6l0.6-1.9l1.9-3.1l1.1-1.1l-1.9-1.5l-2.1,0.8l-2.9,1.9l-7.4,3.2l-2.9,0.6l-2.9-0.5l-1-0.9l-2.1,2.8l-0.2,2.7v8.5l-1.1,1.6l-5.3,3.9l-2.3,5.9l0.5,0.2l2.5,2.1l0.7,3.2l-1.8,3.2v3.9l0.5,6.6l3,3h3.4l1.8,3.2l3.4,0.5l3.9,5.7l7.1,4.1l2.1,2.7l0.9,7.4l0.7,3.3l2.3,1.6l0.2,1.4l-2.1,3.4l0.2,3.2l2.5,3.9l2.5,1.1l3,0.5l1.3,1.4l9.2,0l26.1-1.5L786.9,297.2z"
          fill={selectedState === "Wisconsin" ? "#3B82F6" : hoveredState === "Wisconsin" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Wisconsin" ? "#1D4ED8" : hoveredState === "Wisconsin" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Wisconsin" ? "2" : hoveredState === "Wisconsin" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Wisconsin")}
          onMouseEnter={(e) => handleStateHover("Wisconsin", e)}
          onMouseLeave={() => handleStateLeave("Wisconsin")}
        />

        {/* Missouri */}
        <path
          id="MO"
          d="M729.8,349.5l-2.5-3.1l-1.1-2.3l-7.8,0.7l-9.8,0.5l-25.4,0.9l-13.5,0.2l-7.9,0.1l-2.3,0.1l1.3,2.5l-0.2,2.3l2.5,3.9l3.1,4.1l3.1,2.7l2.3,0.2l1.4,0.9v3l-1.8,1.6l-0.5,2.3l2.1,3.4l2.5,3l2.5,1.8l1.4,11.7l-0.7,35.3l0.2,4.7l0.5,5.4l23.4-0.1l23.2-0.7l20.8-0.8l11.7-0.2l2.2,3.4l-0.7,3.3l-3.1,2.4l-0.6,1.8l5.4,0.5l3.9-0.7l1.7-5.5l0.7-5.9l2.3-2l1.7-1.5l2.1-1l0.1-2.9l0.6-1.7l-1-1.7l-2.7,0.1l-2.2-2.6l-1.4-4.2l0.8-2.5l-1.9-3.4l-1.8-4.6l-4.8-0.8l-7-5.6l-1.7-4.1l0.8-3.2l2.1-6.1l0.5-2.9l-1.9-1l-6.9-0.8l-1-1.7l-0.1-4.2l-5.5-3.4l-7-7.8l-2.3-7.3l-0.2-4.2L729.8,349.5z"
          fill={selectedState === "Missouri" ? "#3B82F6" : hoveredState === "Missouri" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Missouri" ? "#1D4ED8" : hoveredState === "Missouri" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Missouri" ? "2" : hoveredState === "Missouri" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Missouri")}
          onMouseEnter={(e) => handleStateHover("Missouri", e)}
          onMouseLeave={() => handleStateLeave("Missouri")}
        />

        {/* Arkansas */}
        <path
          id="AR"
          d="M765,445l-3.8,0.9l-6.2-0.5l0.7-3l3.2-2.7l0.5-2.3l-1.8-3l-11,0.5l-20.8,0.9l-23.3,0.7L679,437l1.6,6.9v8.2l1.4,11l0.2,37.8l2.3,1.9l3-1.4l2.7,1.1l0.4,10.3l22.9-0.1l18.9-0.8l10.1-0.2l1.1-2.1l-0.3-3.5l-1.8-3l1.6-1.5l-1.6-2.5l0.7-2.5l1.4-5.6l2.5-2.1l-0.7-2.3l3.7-5.4l2.7-1.4l-0.1-1.5l-0.3-1.8l2.9-5.6l2.4-1.3l0.4-3.4l1.8-1.2l0.9-4.2l-1.3-4l4-2.4l0.6-2l1.2-4.3L765,445z"
          fill={selectedState === "Arkansas" ? "#3B82F6" : hoveredState === "Arkansas" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Arkansas" ? "#1D4ED8" : hoveredState === "Arkansas" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Arkansas" ? "2" : hoveredState === "Arkansas" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Arkansas")}
          onMouseEnter={(e) => handleStateHover("Arkansas", e)}
          onMouseLeave={() => handleStateLeave("Arkansas")}
        />

        {/* Oklahoma */}
        <path
          id="OK"
          d="M549.3,422.6l-10.7-0.5l-6.4-0.5l0.3,0.2l-0.7,10.4l22,1.4l32.1,1.3l-2.3,24.4l-0.5,17.8l0.2,1.6l4.3,3.7l2.1,1.1l0.7-0.2l0.7-2.1l1.4,1.8h2.1v-1.4l2.7,1.4l-0.5,3.9l4.1,0.2l2.5,1.1l4.1,0.7l2.5,1.8l2.3-2.1l3.4,0.7l2.5,3.4h0.9v2.3l2.3,0.7l2.3-2.3l1.8,0.7h2.5l0.9,2.5l4.8,1.8l1.4-0.7l1.8-4.1h1.1l1.1,2.1l4.1,0.7l3.7,1.4l3,0.9l1.8-0.9l0.7-2.5h4.3l2.1,0.9l2.7-2.1h1.1l0.7,1.6h4.1l1.6-2.1l1.8,0.5l2.1,2.5l3.2,1.8l3.2,0.9l1.9,1.1l-0.4-37.2l-1.4-11l-0.2-8.9l-1.4-6.5l-0.8-7.2l-0.1-3.8l-12.1,0.3l-46.4-0.5l-45-2.1L549.3,422.6z"
          fill={selectedState === "Oklahoma" ? "#3B82F6" : hoveredState === "Oklahoma" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Oklahoma" ? "#1D4ED8" : hoveredState === "Oklahoma" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Oklahoma" ? "2" : hoveredState === "Oklahoma" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Oklahoma")}
          onMouseEnter={(e) => handleStateHover("Oklahoma", e)}
          onMouseLeave={() => handleStateLeave("Oklahoma")}
        />

        {/* Kansas */}
        <path
          id="KS"
          d="M677.4,425.1l-12.6,0.2l-46.1-0.5l-44.6-2.1l-24.6-1.3l4.1-64.7l21.8,0.8l40.5,1.4l44.1,0.5h5.1l3.2,3.2l2.8,0.2l0.9,1.1v2l-1.8,1.6l-0.5,2.6l2.2,3.6l2.5,3.1l2.5,2l1.1,11.2L677.4,425.1z"
          fill={selectedState === "Kansas" ? "#3B82F6" : hoveredState === "Kansas" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Kansas" ? "#1D4ED8" : hoveredState === "Kansas" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Kansas" ? "2" : hoveredState === "Kansas" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Kansas")}
          onMouseEnter={(e) => handleStateHover("Kansas", e)}
          onMouseLeave={() => handleStateLeave("Kansas")}
        />

        {/* Louisiana */}
        <path
          id="LA"
          d="M776.2,573l-1-2.6l-1.1-3.1l-3.3-3.5l0.9-6.8l-0.1-1.1l-1.3,0.3l-8.2,0.9l-25,0.5l-0.7-2.4l0.9-8.5l3.3-5.9l5-8.7l-0.6-2.4l1.3-0.7l0.5-2l-2.3-2.1l-0.1-1.9l-1.8-4.3l-0.5-5.9l-9.7,0.1l-19.2,0.9l-22.2,0l0,9.6l0.7,9.4l0.7,3.9l2.5,4.1l0.9,5l4.3,5.5l0.2,3.2l0.7,0.7l-0.7,8.5l-3,5l1.6,2.1l-0.7,2.5l-0.7,7.3l-1.4,3.2l0.1,3.6l4.7-1.5l8.1-0.3l10.3,3.6l6.5,1.1l3.7-1.5l3.2,1.1l3.2,1l0.8-2.1l-3.2-1.1l-2.6,0.5l-2.7-1.6c0,0,0.2-1.3,0.8-1.5c0.6-0.2,3.1-1,3.1-1l1.8,1.5l1.8-1l3.2,0.6l1.5,2.4l0.3,2.3l4.5,0.3l1.8,1.8l-0.8,1.6l-1.3,0.8l1.6,1.6l8.4,3.6l3.6-1.3l1-2.4l2.6-0.6l1.8-1.5l1.3,1l0.8,2.9l-2.3,0.8l0.6,0.6l3.4-1.3l2.3-3.4l0.8-0.5l-2.1-0.3l0.8-1.6l-0.2-1.5l2.1-0.5l1.1-1.3l0.6,0.8c0,0-0.2,3.1,0.6,3.1c0.8,0,4.2,0.6,4.2,0.6l4,1.9l1,1.5h2.9l1.1,1l2.3-3.1v-1.5h-1.3l-3.4-2.7l-5.8-0.8l-3.2-2.3l1.1-2.7l2.3,0.3l0.2-0.6l-1.8-1v-0.5h3.2l1.8-3.1l-1.3-1.9l-0.3-2.7l-1.5,0.2l-1.9,2.1l-0.6,2.6l-3.1-0.6l-1-1.8l1.8-1.9l2-1.8L776.2,573z"
          fill={selectedState === "Louisiana" ? "#3B82F6" : hoveredState === "Louisiana" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Louisiana" ? "#1D4ED8" : hoveredState === "Louisiana" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Louisiana" ? "2" : hoveredState === "Louisiana" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Louisiana")}
          onMouseEnter={(e) => handleStateHover("Louisiana", e)}
          onMouseLeave={() => handleStateLeave("Louisiana")}
        />

        {/* Virginia */}
        <path
          id="VA"
          d="M1002.9,369.2l-0.1-1.9l6.5-2.5l-0.8,3.2l-2.9,3.8l-0.4,4.6l0.5,3.4l-1.8,5l-2.2,1.9l-1.5-4.6l0.4-5.4l1.6-4.2L1002.9,369.2z M1005.2,397.5L947,410.1l-37.4,5.3l-6.7-0.4l-2.6,1.9l-7.3,0.2l-8.4,1l-8.9,1l8.5-4.9l0-2.1l1.5-2.1l10.6-11.5l3.9,4.5l3.8,1l2.5-1.1l2.2-1.3l2.5,1.3l3.9-1.4l1.9-4.6l2.6,0.5l2.9-2.1l1.8,0.5l2.8-3.7l0.3-2.1l-1-1.3l1-1.9l5.3-12.3l0.6-5.7l1.2-0.5l2.2,2.4l3.9-0.3l1.9-7.6l2.8-0.6l1-2.7l2.6-2.3l1.3-2.3l1.5-3.4l0.1-5.1l9.8,3.8c0.7,0.3,0.7-4.8,0.7-4.8l4.1,1.4l-0.5,2.6l8.2,2.9l1.3,1.8l-0.9,3.7l-1.3,1.3l-0.5,1.7l0.5,2.4l2,1.3l3.9,1.4l2.9,1l4.9,0.9l2.2,2.1l3.2,0.4l0.9,1.2l-0.4,4.7l1.4,1.1l-0.5,1.9l1.2,0.8l-0.2,1.4l-2.7-0.1l0.1,1.6l2.3,1.5l0.1,1.4l1.8,1.8l0.5,2.5l-2.6,1.4l1.6,1.5l5.8-1.7L1005.2,397.5z"
          fill={selectedState === "Virginia" ? "#3B82F6" : hoveredState === "Virginia" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Virginia" ? "#1D4ED8" : hoveredState === "Virginia" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Virginia" ? "2" : hoveredState === "Virginia" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Virginia")}
          onMouseEnter={(e) => handleStateHover("Virginia", e)}
          onMouseLeave={() => handleStateLeave("Virginia")}
        />

        {/* Washington DC */}
        <circle
          id="DC"
          cx="975.3"
          cy="351.8"
          r="5"
          fill={selectedState === "Washington DC" ? "#3B82F6" : hoveredState === "Washington DC" ? "#60A5FA" : "#D3D3D3"}
          stroke={selectedState === "Washington DC" ? "#1D4ED8" : hoveredState === "Washington DC" ? "#2563EB" : "#A9A9A9"}
          strokeWidth={selectedState === "Washington DC" ? "2" : hoveredState === "Washington DC" ? "1.5" : "1"}
          className="transition-all duration-300 ease-in-out cursor-pointer"
          onClick={() => handleStateClick("Washington DC")}
          onMouseEnter={(e) => handleStateHover("Washington DC", e)}
          onMouseLeave={() => handleStateLeave("Washington DC")}
        />

        {/* All 50 states have been added! */}
      </svg>

      

    </div>
  );
};

export default USMap;
