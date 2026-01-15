
import React, { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      
      let cleanChart = chart.trim();
      
      // 1. Markdown stripping
      cleanChart = cleanChart.replace(/^```mermaid\s+/i, '').replace(/```$/i, '').trim();
      
      // 2. Normalize and strip illegal Mermaid Mindmap syntax
      // The parser fails on trailing spaces, special brackets, or semi-colons
      let lines = cleanChart.split('\n')
        .map(line => line.replace(/[\[\]\(\)\{\};]/g, ' ').trimEnd()) // Remove brackets/parens/semis
        .filter(line => line.length > 0);

      // 3. Ensure "mindmap" header
      if (lines[0].toLowerCase().includes('graph') || lines[0].toLowerCase().includes('flowchart')) {
        lines.shift();
      }
      
      if (!lines[0].toLowerCase().startsWith('mindmap')) {
        lines.unshift('mindmap');
      }

      // 4. Force consistent indentation for nodes after root
      const processedLines = lines.map((line, idx) => {
        if (idx === 0) return 'mindmap';
        if (idx === 1) return '  ' + line.trim(); // Root
        // Maintain relative indentation but ensure it's at least 4 spaces if it's a child
        const leadingSpaces = line.search(/\S/);
        return '    ' + '  '.repeat(Math.max(0, Math.floor(leadingSpaces / 2))) + line.trim();
      });

      const finalChart = processedLines.join('\n');

      try {
        // @ts-ignore
        window.mermaid.contentLoaded();
        // @ts-ignore
        window.mermaid.render('mermaid-svg-' + Math.random().toString(36).substr(2, 9), finalChart).then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        }).catch(err => {
          console.error("Mermaid Render Error", err);
          if (ref.current) ref.current.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logic Map Encoding...</p>
            </div>
          `;
        });
      } catch (e) {
        console.error("Mermaid critical fail", e);
      }
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid flex justify-center w-full overflow-x-auto p-4"></div>;
};

export default MermaidDiagram;
