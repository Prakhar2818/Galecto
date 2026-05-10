"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TraceGraph;
const react_1 = __importStar(require("react"));
const reactflow_1 = __importStar(require("reactflow"));
const lucide_react_1 = require("lucide-react");
require("reactflow/dist/style.css");
const ServiceNode = ({ data }) => {
    return (<div className="px-6 py-4 shadow-xl rounded-2xl bg-white border-2 border-emerald-100 min-w-[200px] cursor-pointer hover:border-emerald-500 transition-all group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-20"/>
      <reactflow_1.Handle type="target" position={reactflow_1.Position.Top} className="w-3 h-3 !bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"/>
      <div className="flex flex-col">
        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
          {data.service_name}
        </div>
        <div className="text-sm text-slate-900 font-bold tracking-tight font-sora">
          {data.event_name}
        </div>
      </div>
      <reactflow_1.Handle type="source" position={reactflow_1.Position.Bottom} className="w-3 h-3 !bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"/>
    </div>);
};
const nodeTypes = {
    service: ServiceNode,
};
function TraceGraph({ tree }) {
    const [selectedNode, setSelectedNode] = (0, react_1.useState)(null);
    const { nodes, edges } = (0, react_1.useMemo)(() => {
        const nodes = [];
        const edges = [];
        const traverse = (node, x, y, parentId) => {
            const id = node.span_id;
            nodes.push({
                id,
                type: 'service',
                data: {
                    service_name: node.service_name,
                    event_name: node.event_name,
                    payload: node.payload,
                    timestamp: node.timestamp
                },
                position: { x, y },
            });
            if (parentId) {
                edges.push({
                    id: `e-${parentId}-${id}`,
                    source: parentId,
                    target: id,
                    animated: true,
                    style: { stroke: '#10b981', strokeWidth: 3 },
                });
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach((child, index) => {
                    traverse(child, x + (index - (node.children.length - 1) / 2) * 280, y + 150, id);
                });
            }
        };
        tree.forEach((root, index) => {
            traverse(root, index * 600, 0);
        });
        return { nodes, edges };
    }, [tree]);
    const onNodeClick = (_, node) => {
        setSelectedNode(node.data);
    };
    return (<div className="h-full w-full bg-slate-50/50 rounded-[2rem] flex relative overflow-hidden">
      <div className="flex-grow h-full">
        <reactflow_1.default nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={onNodeClick} fitView>
          <reactflow_1.Background color="#cbd5e1" gap={25} size={1}/>
          <reactflow_1.Controls />
        </reactflow_1.default>
      </div>

      {/* Details Side-Panel */}
      {selectedNode && (<div className="w-96 bg-white/95 backdrop-blur-2xl border-l border-slate-100 p-10 animate-in slide-in-from-right duration-500 overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black font-sora tracking-tighter">Span Insight</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time telemetry</p>
            </div>
            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all border border-slate-100">
              <lucide_react_1.X className="w-5 h-5 text-slate-400"/>
            </button>
          </div>
          
          <div className="space-y-8">
            <DetailItem label="Topology Node" value={selectedNode.service_name} color="text-emerald-600"/>
            <DetailItem label="Event Signature" value={selectedNode.event_name} color="text-slate-900"/>
            <DetailItem label="Cycle Timestamp" value={new Date(selectedNode.timestamp).toLocaleString()} color="text-slate-500"/>
            
            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 block">Data Payload</label>
              <pre className="p-6 bg-slate-900 rounded-3xl text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-xl">
                {JSON.stringify(JSON.parse(selectedNode.payload || '{}'), null, 2)}
              </pre>
            </div>
          </div>
        </div>)}
    </div>);
}
function DetailItem({ label, value, color }) {
    return (<div>
      <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 block">{label}</label>
      <div className={`${color} font-black font-sora text-lg tracking-tight`}>{value}</div>
    </div>);
}
