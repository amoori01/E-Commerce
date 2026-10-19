import { NextRequest, NextResponse } from 'next/server';
import { calculateConsignmentFreight, INTER_CITY_DISTANCES_KM } from '@/lib/freight-calculator';
import { BRANCHES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originBranchId, destinationCity, weightTons, consignmentValueEtb } = body;

    const branch = BRANCHES.find((b) => b.id === originBranchId) || BRANCHES[0];

    const freight = calculateConsignmentFreight({
      originBranchId: branch.id,
      originBranchName: branch.name,
      destinationCity: destinationCity || 'Addis Ababa Metro',
      weightTons: Number(weightTons) || 1.0,
      consignmentValueEtb: Number(consignmentValueEtb) || 0,
    });

    return NextResponse.json({
      success: true,
      data: freight,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Freight calculation error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    destinations: Object.keys(INTER_CITY_DISTANCES_KM['branch-addis']),
    branches: BRANCHES.map((b) => ({ id: b.id, name: b.name, city: b.city })),
  });
}
