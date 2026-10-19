import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as updateProfile } from '@/app/api/user/profile/route';
import { GET as getBranchAgents, POST as assignBranchAgent } from '@/app/api/branch-admin/agents/route';
import { SEEDED_USERS, BRANCHES } from '@/lib/constants';

describe('SRS Compliance Test: MFA Profile Gating & Regional Agent Assignment', () => {
  it('blocks sensitive customer profile modification without MFA OTP verification (SRS 4.2)', async () => {
    const customer = SEEDED_USERS.find((u) => u.role === 'customer')!;

    // Attempting to change Ethiopian TIN Number without MFA
    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'x-user-role': 'customer',
        'x-user-id': customer.id,
      },
      body: JSON.stringify({
        tinNumber: '9999888877',
      }),
    });

    const res = await updateProfile(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.mfaRequired).toBe(true);
    expect(data.error).toContain('MFA Security Challenge Required');
  });

  it('allows sensitive profile modification when valid 6-digit MFA OTP is provided', async () => {
    const customer = SEEDED_USERS.find((u) => u.role === 'customer')!;

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'x-user-role': 'customer',
        'x-user-id': customer.id,
      },
      body: JSON.stringify({
        companyName: 'MIDROC Infrastructure Division PLC',
        mfaCode: '123456',
      }),
    });

    const res = await updateProfile(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.companyName).toBe('MIDROC Infrastructure Division PLC');
  });

  it('allows branch admin to assign regional sales agent to their branch depot (SRS Section 2)', async () => {
    const branchAdmin = SEEDED_USERS.find((u) => u.role === 'branch_admin')!;
    const agent = SEEDED_USERS.find((u) => u.role === 'sales_agent')!;
    // Ensure agent belongs to same subsidiary for ABAC boundary check
    agent.subsidiaryId = branchAdmin.subsidiaryId;
    const targetBranch = BRANCHES[1]; // Adama Hub

    const req = new NextRequest('http://localhost:3000/api/branch-admin/agents', {
      method: 'POST',
      headers: {
        'x-user-role': 'branch_admin',
        'x-user-id': branchAdmin.id,
      },
      body: JSON.stringify({
        agentId: agent.id,
        targetBranchId: targetBranch.id,
      }),
    });

    const res = await assignBranchAgent(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.agent.newBranch).toBe(targetBranch.name);
  });

  it('allows branch admin to assign specialized client portfolio within subsidiary boundary', async () => {
    const branchAdmin = SEEDED_USERS.find((u) => u.role === 'branch_admin')!;
    const agent = SEEDED_USERS.find((u) => u.role === 'sales_agent' && u.subsidiaryId === branchAdmin.subsidiaryId)!;

    const req = new NextRequest('http://localhost:3000/api/branch-admin/agents', {
      method: 'POST',
      headers: {
        'x-user-role': 'branch_admin',
        'x-user-id': branchAdmin.id,
      },
      body: JSON.stringify({
        agentId: agent.id,
        targetBranchId: BRANCHES[0].id,
        clientPortfolio: 'Sunshine Construction & Federal Housing Corp',
        specialization: 'Pre-Painted Tile Sheets & Continuous Box Gutters',
      }),
    });

    const res = await assignBranchAgent(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.agent.clientPortfolio).toBe('Sunshine Construction & Federal Housing Corp');
    expect(data.agent.specialization).toBe('Pre-Painted Tile Sheets & Continuous Box Gutters');
  });

  it('rejects cross-subsidiary agent assignment with 403 Subsidiary Boundary Violation (ABAC enforcement)', async () => {
    const branchAdmin = SEEDED_USERS.find((u) => u.role === 'branch_admin')!;
    // Find an agent belonging to a different subsidiary
    const crossSubsidiaryAgent = SEEDED_USERS.find(
      (u) => u.role === 'sales_agent' && u.subsidiaryId !== branchAdmin.subsidiaryId
    );

    // If all agents currently share the same subsidiary in memory, explicitly set one to another subsidiary
    const agent = crossSubsidiaryAgent || {
      ...SEEDED_USERS.find((u) => u.role === 'sales_agent')!,
      subsidiaryId: '99999999-9999-9999-9999-999999999999',
    };
    if (!crossSubsidiaryAgent) {
      // Temporarily change an agent's subsidiary
      SEEDED_USERS.find((u) => u.role === 'sales_agent')!.subsidiaryId = '99999999-9999-9999-9999-999999999999';
    }

    const req = new NextRequest('http://localhost:3000/api/branch-admin/agents', {
      method: 'POST',
      headers: {
        'x-user-role': 'branch_admin',
        'x-user-id': branchAdmin.id,
      },
      body: JSON.stringify({
        agentId: agent.id,
        clientPortfolio: 'Sur Construction PLC',
      }),
    });

    const res = await assignBranchAgent(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error).toBe('Subsidiary Boundary Violation');
    expect(data.details).toContain('designated subsidiary boundary');
  });

  it('filters branch agent listings to only authenticated subsidiary boundary (GET)', async () => {
    const branchAdmin = SEEDED_USERS.find((u) => u.role === 'branch_admin')!;

    const req = new NextRequest('http://localhost:3000/api/branch-admin/agents', {
      method: 'GET',
      headers: {
        'x-user-role': 'branch_admin',
        'x-user-id': branchAdmin.id,
      },
    });

    const res = await getBranchAgents(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.agents)).toBe(true);
    // Every returned agent must belong to branch admin's subsidiary
    data.agents.forEach((ag: { subsidiaryId: string }) => {
      expect(ag.subsidiaryId).toBe(branchAdmin.subsidiaryId);
    });
  });
});
