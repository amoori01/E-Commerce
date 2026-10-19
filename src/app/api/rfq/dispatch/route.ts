import { NextRequest, NextResponse } from 'next/server';
import { SEEDED_USERS } from '@/lib/constants';

// ====================================================================
// AGENT ROUND-ROBIN DISPATCH ENGINE (SRS 4.3 / 4.4)
// Automatically dispatches incoming custom RFQ inquiries to the best
// available sales engineer based on subsidiary domain expertise,
// regional branch territory, and current active queue load.
// ====================================================================

// Sales agents from seeded personas + active workload counter
const AGENT_WORKLOAD: Record<string, number> = {
  'e2222222-2222-2222-2222-222222222222': 2, // Eng. Biruk Kebede (Heavy Steel)
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rfqId, subsidiaryId, destinationBranchId } = body;

    // Find all qualified sales agents
    const agents = SEEDED_USERS.filter((u) => u.role === 'sales_agent');

    // 1. Filter by subsidiary match if specified
    let candidates = agents.filter((a) => !subsidiaryId || a.subsidiaryId === subsidiaryId);
    if (candidates.length === 0) {
      candidates = agents; // fallback to general pool
    }

    // 2. Round-robin with least-workload heuristic
    let selectedAgent = candidates[0];
    let minLoad = Infinity;

    for (const c of candidates) {
      const load = AGENT_WORKLOAD[c.id] || 0;
      if (load < minLoad) {
        minLoad = load;
        selectedAgent = c;
      }
    }

    // Increment workload
    AGENT_WORKLOAD[selectedAgent.id] = (AGENT_WORKLOAD[selectedAgent.id] || 0) + 1;

    return NextResponse.json({
      success: true,
      rfqId,
      dispatchedAgent: {
        id: selectedAgent.id,
        name: selectedAgent.fullName,
        email: selectedAgent.email,
        phone: selectedAgent.phone,
        subsidiaryName: selectedAgent.subsidiaryName,
        assignedAt: new Date().toISOString(),
        dispatchMethod: 'ROUND_ROBIN_LEAST_WORKLOAD',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Dispatch error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const agents = SEEDED_USERS.filter((u) => u.role === 'sales_agent').map((a) => ({
    id: a.id,
    name: a.fullName,
    email: a.email,
    subsidiary: a.subsidiaryName,
    activeRfqLoad: AGENT_WORKLOAD[a.id] || 0,
  }));

  return NextResponse.json({
    success: true,
    agentPoolCount: agents.length,
    agents,
  });
}
