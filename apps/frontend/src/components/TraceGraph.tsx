"use client";

import React, { useMemo, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  Position,
  Handle
} from 'reactflow';
import { X } from 'lucide-react';
import 'reactflow/dist/style.css';

interface TraceGraphProps {
  tree: any[];
}

function safeJsonParse(str: string | undefined | null): any {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}

const ServiceNode = ({ data }: any) => {
  return (
    <div className="px-6 py-4 shadow-xl rounded-2xl bg-white border-2 border-emerald-100 min-w-[200px] cursor-pointer hover:border-emerald-500 transition-all group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-20" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
      <div className="flex flex-col">
        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">
          {data?.service_name || 'Unknown'}
        </div>
        <div className="text-sm text-slate-900 font-bold tracking-tight font-sora">
          {data?.event_name || 'Unknown Event'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode,
};

export default function TraceGraph({ tree }: TraceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!tree || !Array.isArray(tree) || tree.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const visitedIds = new Set<string>();

    const traverse = (node: any, x: number, y: number, parentId?: string) => {
      if (!node || !node.span_id || visitedIds.has(node.span_id)) return;
      visitedIds.add(node.span_id);

      nodes.push({
        id: node.span_id,
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
          id: `e-${parentId}-${node.span_id}`,
          source: parentId,
          target: node.span_id,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3 },
        });
      }

      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        const childCount = node.children.length;
        const spacing = 280;
        const startX = x - ((childCount - 1) * spacing) / 2;
        
        node.children.forEach((child: any, index: number) => {
          traverse(child, startX + index * spacing, y + 150, node.span_id);
        });
      }
    };

    tree.forEach((root, index) => {
      traverse(root, index * 600, 0);
    });

    return { nodes, edges };
  }, [tree]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node.data);
  };

  const selectedPayload = selectedNode?.payload;

  return (
    <div className="h-full w-full bg-slate-50/50 rounded-[2rem] flex relative overflow-hidden">
      <div className="flex-grow h-full">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-sm font-medium">No trace data available</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#cbd5e1" gap={25} size={1} />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {selectedNode && (
        <div className="w-96 bg-white/95 backdrop-blur-2xl border-l border-slate-100 p-10 animate-in slide-in-from-right duration-500 overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black font-sora tracking-tighter">Span Insight</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time telemetry</p>
            </div>
            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all border border-slate-100">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <div className="space-y-8">
            <DetailItem label="Topology Node" value={selectedNode.service_name || 'Unknown'} color="text-emerald-600" />
            <DetailItem label="Event Signature" value={selectedNode.event_name || 'Unknown'} color="text-slate-900" />
            <DetailItem label="Cycle Timestamp" value={selectedNode.timestamp ? new Date(selectedNode.timestamp).toLocaleString() : 'N/A'} color="text-slate-500" />
            
            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 block">Data Payload</label>
              <pre className="p-6 bg-slate-900 rounded-3xl text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-xl max-h-96">
                {JSON.stringify(safeJsonParse(selectedPayload), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, color }: any) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 block">{label}</label>
      <div className={`${color || 'text-slate-900'} font-black font-sora text-lg tracking-tight`}>{value}</div>
    </div>
  );
}
