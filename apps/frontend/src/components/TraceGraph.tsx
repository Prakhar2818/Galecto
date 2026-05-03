"use client";

import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  Position,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';

interface TraceGraphProps {
  tree: any[];
}

const ServiceNode = ({ data }: any) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-md bg-gray-900 border-2 border-blue-500 min-w-[150px]">
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
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const traverse = (node: any, x: number, y: number, parentId?: string) => {
      const id = node.span_id;
      
      nodes.push({
        id,
        type: 'service',
        data: { service_name: node.service_name, event_name: node.event_name },
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

  return (
    <div className="h-[400px] w-full bg-gray-950 rounded-xl border border-gray-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#333" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
