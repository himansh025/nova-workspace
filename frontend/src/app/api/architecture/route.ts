import { NextRequest, NextResponse } from "next/server";
import { INITIAL_SERVICE_NODES, ServiceNode } from "@/server/meshData";
import { broadcastEvent } from "@/server/events";

declare global {
  var __novaServiceNodes: ServiceNode[] | undefined;
}

const serviceNodes: ServiceNode[] = global.__novaServiceNodes || [...INITIAL_SERVICE_NODES];
if (process.env.NODE_ENV !== "production") {
  global.__novaServiceNodes = serviceNodes;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    nodes: serviceNodes,
    stats: {
      totalServices: serviceNodes.length,
      healthyCount: serviceNodes.filter((n) => n.status === "healthy").length,
      averageP99Latency: "6.1ms",
      aggregateThroughput: "102.4k req/s",
      globalUptime: "99.992%",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, action } = body;

    const node = serviceNodes.find((n) => n.id === nodeId);
    if (!node) {
      return NextResponse.json({ error: "Service node not found" }, { status: 404 });
    }

    if (action === "diagnose") {
      // Simulate live probing
      const jitterLatency = (parseFloat(node.p99Latency) * (0.9 + Math.random() * 0.2)).toFixed(1);
      node.p99Latency = `${jitterLatency}ms`;

      broadcastEvent({
        type: "system",
        category: "system",
        title: `Health Probe Passed: ${node.name}`,
        message: `Diagnostic probe executed on ${node.name} (${node.region}): Latency ${node.p99Latency}, Error rate ${node.errorRate}`,
        link: "/app/architecture",
        meta: { nodeId: node.id },
      });

      return NextResponse.json({
        success: true,
        node,
        message: `Diagnostic health probe successful for ${node.name}. Latency verified at ${node.p99Latency}.`,
      });
    }

    return NextResponse.json({ success: true, node });
  } catch (error) {
    return NextResponse.json({ error: "Failed to run service action" }, { status: 500 });
  }
}
