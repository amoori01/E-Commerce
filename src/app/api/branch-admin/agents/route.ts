import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, enforceAbac } from '@/lib/auth-guard';
import { SEEDED_USERS, BRANCHES } from '@/lib/constants';

// ====================================================================
// BRANCH ADMIN REGIONAL AGENT ASSIGNMENT API (SRS Section 2)
// Allows subsidiary branch admins to manage regional sales agent assignments.
// ====================================================================

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.isAuthenticated || !auth.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Branch Admin or Super Admin
  if (!['branch_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ error: 'Access restricted to Branch Admins' }, { status: 403 });
  }

  const branchId = auth.user.branchId;
  const agents = SEEDED_USERS.filter((u) => u.role === 'sales_agent');
  const branchAgents = branchId ? agents.filter((a) => a.branchId === branchId) : agents;

  return NextResponse.json({
    success: true,
    branchId,
    agents: branchAgents,
    allAgentsPool: agents,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['branch_admin', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Access restricted to Branch Admins' }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, targetBranchId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const effectiveBranchId = targetBranchId || auth.user.branchId;
    const branch = BRANCHES.find((b) => b.id === effectiveBranchId);
    if (!branch) {
      return NextResponse.json({ error: 'Target branch not found' }, { status: 404 });
    }

    const agent = SEEDED_USERS.find((u) => u.id === agentId && u.role === 'sales_agent');
    if (!agent) {
      return NextResponse.json({ error: 'Sales agent not found' }, { status: 404 });
    }

    // ABAC Check: Branch Admin can only assign agents within their subsidiary
    const abac = enforceAbac(auth.user, { subsidiaryId: agent.subsidiaryId }, 'write');
    if (!abac.allowed) {
      return NextResponse.json({ error: abac.reason }, { status: 403 });
    }

    const previousBranch = agent.branchName || 'Unassigned';
    agent.branchId = branch.id;
    agent.branchName = branch.name;

    return NextResponse.json({
      success: true,
      message: `Sales Agent ${agent.fullName} assigned to ${branch.name}.`,
      agent: {
        id: agent.id,
        name: agent.fullName,
        subsidiary: agent.subsidiaryName,
        previousBranch,
        newBranch: branch.name,
        assignedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Agent assignment error';
    return NextResponse.json({ error: 'Failed to assign agent', details: msg }, { status: 500 });
  }
}
