import React from 'react';
import './styles/AccessibleTable.css';
import type { FlowchartData, NodeData} from '../../types/types';

type Props = {
  json: FlowchartData;
};

const AccessibleTable: React.FC<Props> = ({ json }) => {
  const { nodes, edges } = json;

  // Helper to find label by ID
  const getNodeLabelById = (id: string): string => {
    const node = nodes.find((node: NodeData) => node.id === id);
    return node?.label || 'Unknown';
  };

  return (
    <div>
      {/* Nodes Table */}
      <table className="styled-table" aria-label="Table of flowchart nodes">
        <caption>Flowchart Nodes</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Shape</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, index) => (
            <tr key={index}>
              <td>{node.label}</td>
              <td>{node.shape}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: '1rem' }}></div>

      {/* Edges Table */}
      <table className="styled-table" aria-label="Table of flowchart edges">
        <caption>Flowchart Edges</caption>
        <thead>
          <tr>
            <th scope="col">Source (Label)</th>
            <th scope="col">Destination (Label)</th>
            <th scope="col">Edge Label</th>
            <th scope="col">Edge Type</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, index) => (
            <tr key={index}>
              <td>{getNodeLabelById(edge.source)}</td>
              <td>{getNodeLabelById(edge.destination)}</td>
              <td>{edge.label || 'N/A'}</td>
              <td>
                {edge.type === 'solid'
                  ? 'Solid'
                  : 'Dashed'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccessibleTable;
