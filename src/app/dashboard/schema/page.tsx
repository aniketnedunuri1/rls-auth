"use client"

import { useCallback } from "react"
import ReactFlow, { type Edge, Controls, Background, useNodesState, useEdgesState, MarkerType } from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useDispatch, useSelector } from "react-redux"
import { setSchema, setRLSPolicies } from "@/lib/schemaSlice"
import type { RootState } from "@/lib/store"

// Interfaces
interface Column {
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: { table: string; column: string }
}

interface Table {
  name: string
  columns: Column[]
  rlsPolicies: RLSPolicy[]
}

interface RLSPolicy {
  name: string
  command: string
  using: string
}

// Custom Table Node
const TableNode = ({ data }: { data: { table: Table } }) => {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 min-w-[250px] text-white shadow-md">
      <div className="font-bold border-b pb-2 text-primary flex justify-between items-center">
        <span>{data.table.name}</span>
        {data.table.rlsPolicies.length > 0 && <span className="text-yellow-500">🔒</span>}
      </div>
      <div className="pt-2 space-y-1">
        {data.table.columns.map((col, index) => (
          <div key={index} className="text-sm flex items-center gap-2">
            <span className={`flex-1 ${col.isPrimaryKey ? "font-bold text-blue-400" : ""}`}>{col.name}</span>
            <span className="text-gray-400 text-xs">
              {col.type.toUpperCase()} {col.isPrimaryKey && " 🔑"} {col.isForeignKey && " 🔗"}
            </span>
          </div>
        ))}
      </div>
      {data.table.rlsPolicies.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-xs font-semibold">RLS Policies:</div>
          {data.table.rlsPolicies.map((policy, index) => (
            <div key={index} className="text-xs text-gray-300 mt-1">
              {policy.name}: {policy.command}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { tableNode: TableNode }

export default function SchemaPage() {
  const dispatch = useDispatch()
  const { schema, rlsPolicies } = useSelector((state: RootState) => state.schema)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const parseSchema = useCallback(() => {
    try {
      const tables: Table[] = []

      // Extract CREATE TABLE statements
      const tableMatches = schema.match(/CREATE TABLE (\w+)\s*$$([^)]+)$$/gi) || []
      tableMatches.forEach((stmt) => {
        const [, tableName, columnsStr] = stmt.match(/CREATE TABLE (\w+)\s*$$([^)]+)$$/i) || []
        if (!tableName) return

        const columns: Column[] = columnsStr.split(",").map((col) => {
          const parts = col.trim().split(/\s+/)
          const name = parts[0]
          const type = parts[1]
          const isPrimaryKey = col.includes("PRIMARY KEY")
          const isForeignKey = col.includes("REFERENCES")

          let references
          const refMatch = col.match(/REFERENCES (\w+)$$(\w+)$$/)
          if (refMatch) {
            references = { table: refMatch[1], column: refMatch[2] }
          }

          return { name, type, isPrimaryKey, isForeignKey, references }
        })

        tables.push({ name: tableName, columns, rlsPolicies: [] })
      })

      // Extract Foreign Key Constraints
      const edges: Edge[] = []
      tables.forEach((table) => {
        table.columns.forEach((col) => {
          if (col.isForeignKey && col.references) {
            edges.push({
              id: `${table.name}-${col.references.table}`,
              source: table.name,
              target: col.references.table,
              type: "smoothstep",
              animated: true,
              style: { stroke: "white", strokeWidth: 3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "white" },
              label: `${col.name} ➝ ${col.references.column}`,
              labelStyle: { fill: "white", fontSize: 12 },
              labelBgStyle: { fill: "black", padding: "2px" },
            })
          }
        })
      })

      // Extract RLS Policies
      rlsPolicies.match(/CREATE POLICY (\w+) ON (\w+) FOR (\w+) USING $$([^)]+)$$/gi)?.forEach((stmt) => {
        const [, policyName, tableName, command, using] =
          stmt.match(/CREATE POLICY (\w+) ON (\w+) FOR (\w+) USING $$([^)]+)$$/i) || []
        tables.forEach((table) => {
          if (table.name === tableName) {
            table.rlsPolicies.push({ name: policyName, command, using })
          }
        })
      })

      // Generate nodes
      const nodes = tables.map((table, index) => ({
        id: table.name,
        type: "tableNode",
        position: { x: 150 * (index % 3), y: 200 * Math.floor(index / 3) },
        data: { table },
      }))

      setNodes(nodes)
      setEdges(edges)
    } catch (error) {
      console.error("Error parsing schema:", error)
    }
  }, [schema, rlsPolicies, setNodes, setEdges])

  return (
    <div className="h-screen flex">
      {/* Left Panel: SQL & RLS Input */}
      <div className="w-1/2 p-4 overflow-y-auto border-r border-gray-700 bg-gray-900">
        <div className="mb-4">
          <label className="text-sm font-medium text-white">Database Schema</label>
          <Textarea
            value={schema}
            onChange={(e) => dispatch(setSchema(e.target.value))}
            placeholder="CREATE TABLE users (...);"
            className="mt-1 h-[200px] font-mono text-white bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white">RLS Policies</label>
          <Textarea
            value={rlsPolicies}
            onChange={(e) => dispatch(setRLSPolicies(e.target.value))}
            placeholder="CREATE POLICY..."
            className="mt-1 h-[200px] font-mono text-white bg-gray-800 border-gray-700"
          />
        </div>
        <Button className="mt-4" onClick={parseSchema}>
          Visualize Schema
        </Button>
      </div>

      {/* Right Panel: Visualization */}
      <div className="w-1/2 h-full bg-gray-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

