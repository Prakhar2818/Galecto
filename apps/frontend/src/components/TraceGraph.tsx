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

const ServiceNode = ({ data }: any) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-blue-500 min-w-[150px] cursor-pointer hover:bg-gray-800 transition-colors">
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-blue-500" />
      <div className="flex flex-col">
        <div className="text-xs font-bold text-blue-400 uppercase tracking-tighter">
          {data.service_name}
        </div>
        <div className="text-[10px] text-gray-300 font-mono mt-1">
          {data.event_name}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-blue-500" />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode,
};

export default function TraceGraph({ tree }: TraceGraphProps) {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const traverse = (node: any, x: number, y: number, parentId?: string) => {
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
          style: { stroke: '#3b82f6' },
        });
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any, index: number) => {
          traverse(child, x + (index - (node.children.length - 1) / 2) * 200, y + 100, id);
        });
      }
    };

    tree.forEach((root, index) => {
      traverse(root, index * 400, 0);
    });

    return { nodes, edges };
  }, [tree]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node.data);
  };

  return (
    <div className="h-[500px] w-full bg-gray-950 rounded-xl border border-gray-800 flex relative overflow-hidden">
      <div className="flex-grow h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Details Side-Panel */}
      {selectedNode && (
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Span Details</h3>
            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-gray-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Service</label>
              <div className="text-blue-400 font-mono">{selectedNode.service_name}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Event</label>
              <div className="text-white">{selectedNode.event_name}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Time</label>
              <div className="text-gray-300 text-sm">{new Date(selectedNode.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Payload</label>
              <pre className="mt-2 p-3 bg-black rounded-lg text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap border border-gray-800">
                {JSON.stringify(JSON.parse(selectedNode.payload || '{}'), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
