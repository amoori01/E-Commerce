import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, enforceAbac } from '@/lib/auth-guard';
import { SEEDED_USERS, BRANCHES, INITIAL_QUOTES } from '@/lib/constants';

// ====================================================================
// BRANCH ADMIN REGIONAL AGENT & CLIENT PORTFOLIO ASSIGNMENT API (SRS Section 2)
// Allows subsidiary branch admins to manage specialized sales agent assignments
// and link them to corporate client accounts within their subsidiary boundary.
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

  const userSubsidiaryId = auth.user.subsidiaryId;
  const branchId = auth.user.branchId;

  // Filter agents within this subsidiary boundary
  let agents = SEEDED_USERS.filter((u) => u.role === 'sales_agent');
  if (auth.user.role === 'branch_admin' && userSubsidiaryId) {
    agents = agents.filter((a) => a.subsidiaryId === userSubsidiaryId);
  }

  // Enrich each agent with their current active deal workload
  const enrichedAgents = agents.map((agent) => {
    const assignedQuotes = INITIAL_QUOTES.filter(
      (q) => q.assignedAgentId === agent.id || q.assignedAgentName === agent.fullName
    );
    const pipelineEtb = assignedQuotes.reduce(
      (sum, q) => sum + (q.finalQuotedTotalEtb || q.estimatedTotalEtb || 0),
      0
    );

    return {
      id: agent.id,
      fullName: agent.fullName,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      subsidiaryId: agent.subsidiaryId,
      subsidiaryName: agent.subsidiaryName,
      branchId: agent.branchId,
      branchName: agent.branchName,
      clientPortfolio: agent.clientPortfolio || 'General Enterprise Accounts',
      specialization: agent.specialization || 'Technical Industrial Sales',
      activeDealsCount: assignedQuotes.length,
      pipelineEtb,
    };
  });

  return NextResponse.json({
    success: true,
    branchId,
    subsidiaryId: userSubsidiaryId,
    agents: enrichedAgents,
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
    const { agentId, targetBranchId, clientPortfolio, specialization } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const agent = SEEDED_USERS.find((u) => u.id === agentId && u.role === 'sales_agent');
    if (!agent) {
      return NextResponse.json({ error: 'Sales agent not found' }, { status: 404 });
    }

    // ABAC Check: Branch Admin can only assign agents within their subsidiary boundary
    const abac = enforceAbac(auth.user, { subsidiaryId: agent.subsidiaryId }, 'write');
    if (!abac.allowed) {
      return NextResponse.json(
        {
          error: 'Subsidiary Boundary Violation',
          details: `Access denied. You can only assign sales agents within your designated subsidiary boundary (${auth.user.subsidiaryName || auth.user.subsidiaryId}).`,
        },
        { status: 403 }
      );
    }

    const effectiveBranchId = targetBranchId || auth.user.branchId || agent.branchId || BRANCHES[1].id;
    const branch = BRANCHES.find(
      (b) =>
        b.id === effectiveBranchId ||
        b.code.toLowerCase() === (effectiveBranchId || '').toLowerCase() ||
        (effectiveBranchId && effectiveBranchId.toLowerCase().includes(b.city.toLowerCase()))
    ) || BRANCHES[1];

    const previousBranch = agent.branchName || 'Unassigned';
    agent.branchId = branch.id;
    agent.branchName = branch.name;

    if (clientPortfolio && clientPortfolio.trim()) {
      agent.clientPortfolio = clientPortfolio.trim();
    }
    if (specialization && specialization.trim()) {
      agent.specialization = specialization.trim();
    }

    return NextResponse.json({
      success: true,
      message: `Sales Agent ${agent.fullName} assigned to ${branch.name} with portfolio: "${agent.clientPortfolio || 'Enterprise Accounts'}".`,
      agent: {
        id: agent.id,
        name: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        subsidiary: agent.subsidiaryName,
        subsidiaryId: agent.subsidiaryId,
        previousBranch,
        newBranch: branch.name,
        branchId: branch.id,
        clientPortfolio: agent.clientPortfolio || 'General Enterprise Accounts',
        specialization: agent.specialization || 'Technical Industrial Sales',
        assignedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Agent assignment error';
    return NextResponse.json({ error: 'Failed to assign agent portfolio', details: msg }, { status: 500 });
  }
}
