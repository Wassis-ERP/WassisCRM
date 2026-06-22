// Ícones lucide (mesmo set usado no WassisCRM) como SVG inline, para o UI kit
// não depender de CDN. Stroke 2, linecap/linejoin round — idêntico ao lucide-react.
(function () {
  const React = window.React
  const Svg = (size, children) =>
    React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      style: { display: 'block', flex: 'none' },
    }, children)
  const P = (tag, attrs) => React.createElement(tag, attrs)
  const make = (paths) => ({ size = 20 } = {}) => Svg(size, paths.map((p, i) => P(p[0], { key: i, ...p[1] })))

  window.Icons = {
    LayoutDashboard: make([['rect', { x: 3, y: 3, width: 7, height: 9, rx: 1 }], ['rect', { x: 14, y: 3, width: 7, height: 5, rx: 1 }], ['rect', { x: 14, y: 12, width: 7, height: 9, rx: 1 }], ['rect', { x: 3, y: 16, width: 7, height: 5, rx: 1 }]]),
    Users: make([['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }]]),
    Kanban: make([['path', { d: 'M6 5v11' }], ['path', { d: 'M12 5v6' }], ['path', { d: 'M18 5v14' }]]),
    LayoutGrid: make([['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }], ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }], ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 }], ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }]]),
    AlertTriangle: make([['path', { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }], ['line', { x1: 12, y1: 9, x2: 12, y2: 13 }], ['line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }]]),
    FileText: make([['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }], ['polyline', { points: '14 2 14 8 20 8' }], ['line', { x1: 16, y1: 13, x2: 8, y2: 13 }], ['line', { x1: 16, y1: 17, x2: 8, y2: 17 }]]),
    LifeBuoy: make([['circle', { cx: 12, cy: 12, r: 10 }], ['circle', { cx: 12, cy: 12, r: 4 }], ['line', { x1: 4.93, y1: 4.93, x2: 9.17, y2: 9.17 }], ['line', { x1: 14.83, y1: 14.83, x2: 19.07, y2: 19.07 }], ['line', { x1: 14.83, y1: 9.17, x2: 19.07, y2: 4.93 }], ['line', { x1: 4.93, y1: 19.07, x2: 9.17, y2: 14.83 }]]),
    DollarSign: make([['line', { x1: 12, y1: 1, x2: 12, y2: 23 }], ['path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }]]),
    Settings: make([['circle', { cx: 12, cy: 12, r: 3 }], ['path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }]]),
    Search: make([['circle', { cx: 11, cy: 11, r: 8 }], ['line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }]]),
    Plus: make([['line', { x1: 12, y1: 5, x2: 12, y2: 19 }], ['line', { x1: 5, y1: 12, x2: 19, y2: 12 }]]),
    Building2: make([['path', { d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z' }], ['path', { d: 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2' }], ['path', { d: 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2' }], ['path', { d: 'M10 6h4' }], ['path', { d: 'M10 10h4' }], ['path', { d: 'M10 14h4' }], ['path', { d: 'M10 18h4' }]]),
    LogOut: make([['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }], ['polyline', { points: '16 17 21 12 16 7' }], ['line', { x1: 21, y1: 12, x2: 9, y2: 12 }]]),
    Moon: make([['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }]]),
    Sun: make([['circle', { cx: 12, cy: 12, r: 5 }], ['line', { x1: 12, y1: 1, x2: 12, y2: 3 }], ['line', { x1: 12, y1: 21, x2: 12, y2: 23 }], ['line', { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }], ['line', { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }], ['line', { x1: 1, y1: 12, x2: 3, y2: 12 }], ['line', { x1: 21, y1: 12, x2: 23, y2: 12 }], ['line', { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }], ['line', { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 }]]),
    ChevronLeft: make([['polyline', { points: '15 18 9 12 15 6' }]]),
    ChevronRight: make([['polyline', { points: '9 18 15 12 9 6' }]]),
    TrendingUp: make([['polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }], ['polyline', { points: '17 6 23 6 23 12' }]]),
    Target: make([['circle', { cx: 12, cy: 12, r: 10 }], ['circle', { cx: 12, cy: 12, r: 6 }], ['circle', { cx: 12, cy: 12, r: 2 }]]),
    BarChart3: make([['path', { d: 'M3 3v18h18' }], ['rect', { x: 7, y: 11, width: 3, height: 6 }], ['rect', { x: 12, y: 7, width: 3, height: 10 }], ['rect', { x: 17, y: 13, width: 3, height: 4 }]]),
    PieChart: make([['path', { d: 'M21.21 15.89A10 10 0 1 1 8 2.83' }], ['path', { d: 'M22 12A10 10 0 0 0 12 2v10z' }]]),
    Activity: make([['polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }]]),
    MoreHorizontal: make([['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 19, cy: 12, r: 1 }], ['circle', { cx: 5, cy: 12, r: 1 }]]),
    Calendar: make([['rect', { x: 3, y: 4, width: 18, height: 18, rx: 2 }], ['line', { x1: 16, y1: 2, x2: 16, y2: 6 }], ['line', { x1: 8, y1: 2, x2: 8, y2: 6 }], ['line', { x1: 3, y1: 10, x2: 21, y2: 10 }]]),
    Maximize2: make([['polyline', { points: '15 3 21 3 21 9' }], ['polyline', { points: '9 21 3 21 3 15' }], ['line', { x1: 21, y1: 3, x2: 14, y2: 10 }], ['line', { x1: 3, y1: 21, x2: 10, y2: 14 }]]),
    Filter: make([['polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }]]),
    Check: make([['polyline', { points: '20 6 9 17 4 12' }]]),
  }
})()
