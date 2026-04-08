/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Trash2, 
  Grid3X3, 
  Palette, 
  Eraser, 
  Info,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Columns,
  Split,
  Type,
  Square,
  Scissors,
  X,
  Layers,
  MoreHorizontal,
  Diamond,
  Wind,
  Sparkles,
  PenTool
} from 'lucide-react';

// Traditional Tukutuku colors
const TRADITIONAL_COLORS = [
  { name: 'Kōura (Gold/Yellow)', value: '#EAB308' },
  { name: 'Whero (Red)', value: '#991B1B' },
  { name: 'Pango (Black)', value: '#171717' },
  { name: 'Mā (White)', value: '#F5F5F5' },
];

const MODERN_COLORS = [
  { name: 'Kākāriki (Green)', value: '#166534' },
  { name: 'Kikorangi (Blue)', value: '#1E40AF' },
  { name: 'Karaka (Orange)', value: '#C2410C' },
  { name: 'Waiporoporo (Purple)', value: '#5B21B6' },
];

const STITCH_STYLES = [
  { id: 'woven', name: 'Woven Ribbon', icon: Split },
  { id: 'simple', name: 'Simple X', icon: X },
  { id: 'full', name: 'Full Square X', icon: Square },
  { id: 'sliced', name: 'Sliced X', icon: Scissors },
  { id: 'double', name: 'Double X', icon: Layers },
  { id: 'dotted', name: 'Dotted X', icon: MoreHorizontal },
  { id: 'diamond', name: 'Diamond X', icon: Diamond },
  { id: 'curved', name: 'Curved X', icon: Wind },
];

type Cell = { color: string; style: string } | null;
type GridState = Cell[][];

export default function App() {
  const [rows, setRows] = useState(40);
  const [cols, setCols] = useState(24);
  const [grid, setGrid] = useState<GridState>(() => 
    Array(40).fill(null).map(() => Array(24).fill(null))
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(TRADITIONAL_COLORS[1].value);
  const [selectedStyle, setSelectedStyle] = useState<string>('woven');
  const [isDragging, setIsDragging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [cellSize, setCellSize] = useState(30);
  const [symmetryEnabled, setSymmetryEnabled] = useState(true);
  const [artworkTitle, setArtworkTitle] = useState('');
  const [creatorName, setCreatorName] = useState('');

  const updateGridSize = (newRows: number, newCols: number) => {
    const clampedRows = Math.max(1, Math.min(50, newRows));
    const clampedCols = Math.max(1, Math.min(50, newCols));
    
    setGrid(prev => {
      let currentRows = prev.length;
      let currentCols = prev[0]?.length || 0;
      
      let rowDiff = clampedRows - currentRows;
      let colDiff = clampedCols - currentCols;

      let newGrid = prev.map(row => [...row]);

      // Handle Rows (Add/Remove from bottom)
      if (rowDiff > 0) {
        for (let i = 0; i < rowDiff; i++) {
          newGrid.push(Array(currentCols).fill(null));
        }
      } else if (rowDiff < 0) {
        newGrid = newGrid.slice(0, clampedRows);
      }

      // Handle Columns (Centered expansion/contraction)
      if (colDiff !== 0) {
        const leftDiff = Math.floor(colDiff / 2);
        const rightDiff = colDiff - leftDiff;

        newGrid = newGrid.map(row => {
          if (colDiff > 0) {
            // Add columns
            const leftPadding = Array(leftDiff).fill(null);
            const rightPadding = Array(rightDiff).fill(null);
            return [...leftPadding, ...row, ...rightPadding];
          } else {
            // Remove columns
            const leftRemove = Math.abs(Math.ceil(colDiff / 2));
            const rightRemove = Math.abs(colDiff) - leftRemove;
            return row.slice(leftRemove, row.length - rightRemove);
          }
        });
      }

      return newGrid;
    });

    setRows(clampedRows);
    setCols(clampedCols);
  };

  const handleCellClick = (r: number, c: number) => {
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    
    const cellValue = selectedColor ? { color: selectedColor, style: selectedStyle } : null;
    newGrid[r][c] = cellValue;
    
    if (symmetryEnabled) {
      const mirroredC = cols - 1 - c;
      newGrid[r][mirroredC] = cellValue;
    }
    
    setGrid(newGrid);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isDragging) {
      handleCellClick(r, c);
    }
  };

  const clearGrid = () => {
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
  };

  const exportSVG = (stylized = false) => {
    const padding = stylized ? 80 : 20;
    const footerHeight = stylized ? 100 : 0;
    const width = cols * cellSize + padding * 2;
    const height = rows * cellSize + padding * 2 + footerHeight;
    
    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    const bgColor = stylized ? "#1a1a1a" : "#262626";
    svgContent += `<rect width="100%" height="100%" fill="${bgColor}" />`;
    
    if (stylized) {
      // Sleek Border
      const borderPadding = 20;
      svgContent += `
        <rect 
          x="${borderPadding}" 
          y="${borderPadding}" 
          width="${width - borderPadding * 2}" 
          height="${height - borderPadding * 2}" 
          fill="none" 
          stroke="#404040" 
          stroke-width="1" 
        />
        <rect 
          x="${borderPadding + 5}" 
          y="${borderPadding + 5}" 
          width="${width - (borderPadding + 5) * 2}" 
          height="${height - (borderPadding + 5) * 2}" 
          fill="none" 
          stroke="#404040" 
          stroke-width="0.5" 
        />
      `;
    }

    // Stitches
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const { color, style } = cell;
          const x = c * cellSize + padding;
          const y = r * cellSize + padding;
          const offset = cellSize * 0.2;
          const size = cellSize - offset * 2;
          const strokeWidth = cellSize * 0.18;
          
          if (style === 'woven') {
            svgContent += `
              <g stroke-linecap="round">
                <line x1="${x + offset}" y1="${y + offset}" x2="${x + offset + size}" y2="${y + offset + size}" stroke="rgba(0,0,0,0.3)" stroke-width="${strokeWidth}" />
                <line x1="${x + offset}" y1="${y + offset}" x2="${x + offset + size}" y2="${y + offset + size}" stroke="${color}" stroke-width="${strokeWidth}" />
                <line x1="${x + offset + size}" y1="${y + offset}" x2="${x + offset}" y2="${y + offset + size}" stroke="rgba(0,0,0,0.3)" stroke-width="${strokeWidth}" />
                <line x1="${x + offset + size}" y1="${y + offset}" x2="${x + offset}" y2="${y + offset + size}" stroke="${color}" stroke-width="${strokeWidth}" />
                <line x1="${x + cellSize/2 - 1}" y1="${y + cellSize/2 - 1}" x2="${x + cellSize/2 + 1}" y2="${y + cellSize/2 + 1}" stroke="rgba(255,255,255,0.2)" stroke-width="${strokeWidth * 0.5}" />
              </g>
            `;
          } else if (style === 'simple') {
            svgContent += `
              <g stroke="${color}" stroke-width="${cellSize * 0.1}" stroke-linecap="round">
                <line x1="${x + offset}" y1="${y + offset}" x2="${x + offset + size}" y2="${y + offset + size}" />
                <line x1="${x + offset + size}" y1="${y + offset}" x2="${x + offset}" y2="${y + offset + size}" />
              </g>
            `;
          } else if (style === 'full') {
            svgContent += `
              <g stroke="${color}" stroke-width="${cellSize * 0.15}" stroke-linecap="butt">
                <line x1="${x}" y1="${y}" x2="${x + cellSize}" y2="${y + cellSize}" />
                <line x1="${x + cellSize}" y1="${y}" x2="${x}" y2="${y + cellSize}" />
              </g>
            `;
          } else if (style === 'sliced') {
            const hThickness = cellSize * 0.2;
            svgContent += `
              <g fill="${color}">
                <path d="M ${x} ${y} L ${x + hThickness} ${y} L ${x + cellSize} ${y + cellSize} L ${x + cellSize - hThickness} ${y + cellSize} Z" />
                <path d="M ${x + cellSize - hThickness} ${y} L ${x + cellSize} ${y} L ${x + hThickness} ${y + cellSize} L ${x} ${y + cellSize} Z" />
              </g>
            `;
          } else if (style === 'double') {
            svgContent += `
              <g stroke="${color}" stroke-linecap="round">
                <line x1="${x + offset}" y1="${y + offset}" x2="${x + offset + size}" y2="${y + offset + size}" stroke-width="${cellSize * 0.12}" />
                <line x1="${x + offset + size}" y1="${y + offset}" x2="${x + offset}" y2="${y + offset + size}" stroke-width="${cellSize * 0.12}" />
                <line x1="${x + cellSize * 0.3}" y1="${y + cellSize * 0.3}" x2="${x + cellSize * 0.7}" y2="${y + cellSize * 0.7}" stroke-width="${cellSize * 0.06}" stroke="white" opacity="0.5" />
                <line x1="${x + cellSize * 0.7}" y1="${y + cellSize * 0.3}" x2="${x + cellSize * 0.3}" y2="${y + cellSize * 0.7}" stroke-width="${cellSize * 0.06}" stroke="white" opacity="0.5" />
              </g>
            `;
          } else if (style === 'dotted') {
            const dots = 5;
            for (let i = 0; i < dots; i++) {
              const pos = (i / (dots - 1)) * size + offset;
              svgContent += `<circle cx="${x + pos}" cy="${y + pos}" r="${cellSize * 0.06}" fill="${color}" />`;
              svgContent += `<circle cx="${x + offset + size - (pos - offset)}" cy="${y + pos}" r="${cellSize * 0.06}" fill="${color}" />`;
            }
          } else if (style === 'diamond') {
            svgContent += `
              <g stroke="${color}" stroke-width="${cellSize * 0.08}" fill="none">
                <line x1="${x + offset}" y1="${y + offset}" x2="${x + offset + size}" y2="${y + offset + size}" />
                <line x1="${x + offset + size}" y1="${y + offset}" x2="${x + offset}" y2="${y + offset + size}" />
                <rect x="${x + cellSize * 0.4}" y="${y + cellSize * 0.4}" width="${cellSize * 0.2}" height="${cellSize * 0.2}" transform="rotate(45 ${x + cellSize / 2} ${y + cellSize / 2})" fill="${color}" />
              </g>
            `;
          } else if (style === 'curved') {
            svgContent += `
              <g stroke="${color}" stroke-width="${cellSize * 0.12}" fill="none" stroke-linecap="round">
                <path d="M ${x + offset} ${y + offset} A ${size/2} ${size/2} 0 0 0 ${x + offset} ${y + offset + size}" />
                <path d="M ${x + offset + size} ${y + offset} A ${size/2} ${size/2} 0 0 1 ${x + offset + size} ${y + offset + size}" />
                <path d="M ${x + offset} ${y + offset} A ${size/2} ${size/2} 0 0 1 ${x + offset + size} ${y + offset}" />
                <path d="M ${x + offset} ${y + offset + size} A ${size/2} ${size/2} 0 0 0 ${x + offset + size} ${y + offset + size}" />
              </g>
            `;
          }
        }
      });
    });

    if (stylized) {
      // Artwork Info
      const textY = height - 60;
      svgContent += `
        <text x="${width / 2}" y="${textY}" text-anchor="middle" fill="white" font-family="serif" font-style="italic" font-size="24">${artworkTitle || 'Untitled Tukutuku'}</text>
        <text x="${width / 2}" y="${textY + 30}" text-anchor="middle" fill="white" opacity="0.5" font-family="sans-serif" font-size="10" letter-spacing="3">DESIGNED BY: ${creatorName.toUpperCase() || 'UNKNOWN'}</text>
      `;
    }
    
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = stylized ? `tukutuku-${artworkTitle || 'artwork'}.svg` : 'tukutuku-pattern.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-yellow-200">
      {/* Header */}
      <header className="p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/10">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif italic font-light tracking-tight">Tukutuku Studio</h1>
          <p className="text-sm uppercase tracking-widest opacity-50 mt-2 font-medium">Traditional Māori Latticework Designer</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 rounded-full border border-black/10 hover:bg-black hover:text-white transition-colors"
            title="About Tukutuku"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={() => exportSVG(false)}
            className="flex items-center gap-2 px-6 py-3 border border-black/10 rounded-full hover:bg-black hover:text-white transition-all active:scale-95"
          >
            <Download size={18} />
            <span className="font-medium">Export Vector</span>
          </button>
          <button 
            onClick={() => exportSVG(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            <Sparkles size={18} />
            <span className="font-medium">Stylized Export</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 p-6 border-r border-black/10 overflow-y-auto bg-white/50 backdrop-blur-sm">
          <div className="space-y-8">
            {/* Artwork Details */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <PenTool size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Artwork Details</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-50 font-bold">Artwork Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter title..."
                    value={artworkTitle} 
                    onChange={(e) => setArtworkTitle(e.target.value)}
                    className="w-full p-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-50 font-bold">Designer Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter name..."
                    value={creatorName} 
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full p-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>
              </div>
            </section>

            {/* Grid Size */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Grid Dimensions</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-50 font-bold">Rows</label>
                  <input 
                    type="number" 
                    value={rows} 
                    onChange={(e) => updateGridSize(parseInt(e.target.value) || 1, cols)}
                    className="w-full p-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-50 font-bold">Columns</label>
                  <input 
                    type="number" 
                    value={cols} 
                    onChange={(e) => updateGridSize(rows, parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>
              </div>
            </section>

            {/* Color Palette */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Palette size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Color Palette</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Traditional</p>
                  <div className="flex flex-wrap gap-2">
                    {TRADITIONAL_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-yellow-500 scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Modern</p>
                  <div className="flex flex-wrap gap-2">
                    {MODERN_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-yellow-500 scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedColor(null)}
                  className={`flex items-center gap-2 w-full p-3 rounded-xl border-2 transition-all ${selectedColor === null ? 'border-yellow-500 bg-yellow-50' : 'border-black/5 hover:bg-black/5'}`}
                >
                  <Eraser size={18} />
                  <span className="text-sm font-medium">Eraser (Transparent)</span>
                </button>
              </div>
            </section>

            {/* Stitch Styles */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Type size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Stitch Styles</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STITCH_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedStyle === style.id ? 'border-yellow-500 bg-yellow-50' : 'border-black/5 hover:bg-black/5'}`}
                  >
                    <style.icon size={20} className={selectedStyle === style.id ? 'text-yellow-600' : 'opacity-50'} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-center leading-none">{style.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Canvas Zoom */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Maximize2 size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Zoom</h2>
              </div>
              <input 
                type="range" 
                min="10" 
                max="60" 
                value={cellSize} 
                onChange={(e) => setCellSize(parseInt(e.target.value))}
                className="w-full accent-black"
              />
            </section>

            {/* Symmetry */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Split size={18} className="opacity-50" />
                <h2 className="text-xs uppercase tracking-widest font-bold">Symmetry</h2>
              </div>
              <button
                onClick={() => setSymmetryEnabled(!symmetryEnabled)}
                className={`flex items-center justify-between w-full p-3 rounded-xl border-2 transition-all ${symmetryEnabled ? 'border-yellow-500 bg-yellow-50' : 'border-black/5 hover:bg-black/5'}`}
              >
                <div className="flex items-center gap-2">
                  <Columns size={18} />
                  <span className="text-sm font-medium">Vertical Mirror</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${symmetryEnabled ? 'bg-yellow-500' : 'bg-neutral-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${symmetryEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </section>

            <button 
              onClick={clearGrid}
              className="flex items-center justify-center gap-2 w-full p-4 text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">Clear Canvas</span>
            </button>
          </div>
        </aside>

        {/* Canvas Area */}
        <section 
          className="flex-1 bg-[#262626] overflow-auto p-10 flex items-center justify-center relative"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div 
            className="relative shadow-2xl bg-[#1a1a1a]"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              border: '1px solid #404040'
            }}
          >
            {/* Symmetry Line */}
            {symmetryEnabled && (
              <div 
                className="absolute inset-y-0 z-10 pointer-events-none border-l-2 border-dashed border-yellow-500/30"
                style={{ left: `${(cols / 2) * cellSize}px` }}
              />
            )}

            {grid.map((row, r) => (
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onMouseDown={() => handleCellClick(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  className="relative cursor-crosshair group"
                  style={{ 
                    width: cellSize, 
                    height: cellSize,
                    border: '0.5px solid #333'
                  }}
                >
                  {/* The Stitch */}
                  <AnimatePresence mode="popLayout">
                    {cell && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        {cell.style === 'woven' && (
                          <div className="relative w-[85%] h-[85%]">
                            <div 
                              className="absolute top-1/2 left-0 w-full h-[20%] -translate-y-1/2 rotate-45 rounded-full shadow-sm"
                              style={{ backgroundColor: cell.color, filter: 'brightness(0.9)' }}
                            />
                            <div 
                              className="absolute top-1/2 left-0 w-full h-[20%] -translate-y-1/2 -rotate-45 rounded-full shadow-md"
                              style={{ backgroundColor: cell.color }}
                            />
                            <div 
                              className="absolute top-1/2 left-1/2 w-1/4 h-[10%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white/10 rounded-full blur-[1px]"
                            />
                          </div>
                        )}
                        {cell.style === 'simple' && (
                          <div className="relative w-[70%] h-[70%]">
                            <div className="absolute top-1/2 left-0 w-full h-[10%] -translate-y-1/2 rotate-45 rounded-full" style={{ backgroundColor: cell.color }} />
                            <div className="absolute top-1/2 left-0 w-full h-[10%] -translate-y-1/2 -rotate-45 rounded-full" style={{ backgroundColor: cell.color }} />
                          </div>
                        )}
                        {cell.style === 'full' && (
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 w-[142%] h-[15%] -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ backgroundColor: cell.color }} />
                            <div className="absolute top-1/2 left-1/2 w-[142%] h-[15%] -translate-x-1/2 -translate-y-1/2 -rotate-45" style={{ backgroundColor: cell.color }} />
                          </div>
                        )}
                        {cell.style === 'sliced' && (
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full" style={{ 
                              background: `linear-gradient(45deg, transparent 45%, ${cell.color} 45%, ${cell.color} 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, ${cell.color} 45%, ${cell.color} 55%, transparent 55%)`
                            }} />
                          </div>
                        )}
                        {cell.style === 'double' && (
                          <div className="relative w-[80%] h-[80%]">
                            <div className="absolute top-1/2 left-0 w-full h-[12%] -translate-y-1/2 rotate-45 rounded-full" style={{ backgroundColor: cell.color }} />
                            <div className="absolute top-1/2 left-0 w-full h-[12%] -translate-y-1/2 -rotate-45 rounded-full" style={{ backgroundColor: cell.color }} />
                            <div className="absolute top-1/2 left-1/4 w-1/2 h-[6%] -translate-y-1/2 rotate-45 bg-white/40 rounded-full" />
                            <div className="absolute top-1/2 left-1/4 w-1/2 h-[6%] -translate-y-1/2 -rotate-45 bg-white/40 rounded-full" />
                          </div>
                        )}
                        {cell.style === 'dotted' && (
                          <div className="relative w-[70%] h-[70%] flex items-center justify-center">
                            <div className="absolute inset-0" style={{ 
                              backgroundImage: `radial-gradient(${cell.color} 20%, transparent 20%)`,
                              backgroundSize: '33% 33%',
                              clipPath: 'polygon(0 0, 10% 0, 100% 90%, 100% 100%, 90% 100%, 0 10%, 0 0, 90% 0, 100% 10%, 10% 100%, 0 90%, 90% 0)'
                            }} />
                          </div>
                        )}
                        {cell.style === 'diamond' && (
                          <div className="relative w-[80%] h-[80%] flex items-center justify-center">
                            <div className="absolute w-full h-[8%] rotate-45" style={{ backgroundColor: cell.color }} />
                            <div className="absolute w-full h-[8%] -rotate-45" style={{ backgroundColor: cell.color }} />
                            <div className="w-1/3 h-1/3 rotate-45 shadow-sm" style={{ backgroundColor: cell.color }} />
                          </div>
                        )}
                        {cell.style === 'curved' && (
                          <svg className="w-full h-full p-[10%]" viewBox="0 0 100 100">
                            <g fill="none" stroke={cell.color} strokeWidth="12" strokeLinecap="round">
                              <path d="M 10 10 A 40 40 0 0 0 10 90" />
                              <path d="M 90 10 A 40 40 0 0 1 90 90" />
                              <path d="M 10 10 A 40 40 0 0 1 90 10" />
                              <path d="M 10 90 A 40 40 0 0 0 90 90" />
                            </g>
                          </svg>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Hover Preview */}
                  {!cell && selectedColor && (
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 flex items-center justify-center pointer-events-none"
                    >
                      {selectedStyle === 'woven' && (
                        <div className="relative w-[85%] h-[85%]">
                          <div className="absolute top-1/2 left-0 w-full h-[20%] -translate-y-1/2 rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                          <div className="absolute top-1/2 left-0 w-full h-[20%] -translate-y-1/2 -rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                        </div>
                      )}
                      {selectedStyle === 'simple' && (
                        <div className="relative w-[70%] h-[70%]">
                          <div className="absolute top-1/2 left-0 w-full h-[10%] -translate-y-1/2 rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                          <div className="absolute top-1/2 left-0 w-full h-[10%] -translate-y-1/2 -rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                        </div>
                      )}
                      {selectedStyle === 'full' && (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/2 left-1/2 w-[142%] h-[15%] -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ backgroundColor: selectedColor }} />
                          <div className="absolute top-1/2 left-1/2 w-[142%] h-[15%] -translate-x-1/2 -translate-y-1/2 -rotate-45" style={{ backgroundColor: selectedColor }} />
                        </div>
                      )}
                      {selectedStyle === 'sliced' && (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-full" style={{ 
                            background: `linear-gradient(45deg, transparent 45%, ${selectedColor} 45%, ${selectedColor} 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, ${selectedColor} 45%, ${selectedColor} 55%, transparent 55%)`
                          }} />
                        </div>
                      )}
                      {selectedStyle === 'double' && (
                        <div className="relative w-[80%] h-[80%]">
                          <div className="absolute top-1/2 left-0 w-full h-[12%] -translate-y-1/2 rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                          <div className="absolute top-1/2 left-0 w-full h-[12%] -translate-y-1/2 -rotate-45 rounded-full" style={{ backgroundColor: selectedColor }} />
                        </div>
                      )}
                      {selectedStyle === 'dotted' && (
                        <div className="relative w-[70%] h-[70%] flex items-center justify-center">
                          <div className="absolute inset-0" style={{ 
                            backgroundImage: `radial-gradient(${selectedColor} 20%, transparent 20%)`,
                            backgroundSize: '33% 33%',
                            clipPath: 'polygon(0 0, 10% 0, 100% 90%, 100% 100%, 90% 100%, 0 10%, 0 0, 90% 0, 100% 10%, 10% 100%, 0 90%, 90% 0)'
                          }} />
                        </div>
                      )}
                      {selectedStyle === 'diamond' && (
                        <div className="relative w-[80%] h-[80%] flex items-center justify-center">
                          <div className="absolute w-full h-[8%] rotate-45" style={{ backgroundColor: selectedColor }} />
                          <div className="absolute w-full h-[8%] -rotate-45" style={{ backgroundColor: selectedColor }} />
                          <div className="w-1/3 h-1/3 rotate-45" style={{ backgroundColor: selectedColor }} />
                        </div>
                      )}
                      {selectedStyle === 'curved' && (
                        <svg className="w-full h-full p-[10%]" viewBox="0 0 100 100">
                          <g fill="none" stroke={selectedColor} strokeWidth="12" strokeLinecap="round">
                            <path d="M 10 10 A 40 40 0 0 0 10 90" />
                            <path d="M 90 10 A 40 40 0 0 1 90 90" />
                            <path d="M 10 10 A 40 40 0 0 1 90 10" />
                            <path d="M 10 90 A 40 40 0 0 0 90 90" />
                          </g>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              ))
            ))}
          </div>
        </section>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-2xl w-full rounded-3xl p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-4xl font-serif italic mb-6">About Tukutuku</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  Tukutuku is a traditional Māori art form...... add details here including some pattern resources
                </p>
                <ul className="list-disc pl-5 space-y-2 italic">
                  <li><strong>Kaokao:</strong> Details here.</li>
                  <li><strong>Poutama:</strong> Details here.</li>
                  <li><strong>Roimata Toroa:</strong> Details here.</li>
                  <li><strong>Niho Taniwha:</strong> Details here..</li>
                </ul>
                <p className="pt-4 text-sm font-bold uppercase tracking-widest text-black">How to use this app:</p>
                <p>
                  Select a color from the palette and click or drag on the grid to place "x" stitches. You can adjust the grid size to match traditional panel dimensions. When finished, export your design as a high-quality SVG vector file.
                </p>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="mt-10 w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-4 border-t border-black/5 bg-white text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 flex justify-between">
        <span>Māori Latticework Design Tool</span>
        <span>Aotearoa New Zealand</span>
      </footer>
    </div>
  );
}
