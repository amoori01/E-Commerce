import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ====================================================================
// TELEBIRR MOBILE MONEY NOTIFICATION WEBHOOK (ETHIO TELECOM SWITCH)
// ====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outTradeNo, tradeNo, totalAmount, tradeStatus } = body;

    console.log(`[TELEBIRR WEBHOOK] Notification received for Order ${outTradeNo} - TradeNo: ${tradeNo} - Status: ${tradeStatus}`);

    // Telebirr status 'COMPLETED' or '2' indicates settled mobile money transaction
    if (tradeStatus === 'COMPLETED' || tradeStatus === '2' || tradeStatus === 'SUCCESS') {
      const supabase = createAdminClient();

      // Record in payments table with idempotency guard
      // In live cloud database:
      // await supabase.from('payments').upsert({
      //   order_id: outTradeNo,
      //   gateway: 'telebirr',
      //   transaction_reference: tradeNo,
      //   idempotency_key: `telebirr-${tradeNo}`,
      //   amount_etb: parseFloat(totalAmount),
      //   status: 'verified',
      //   verified_at: new Date().toISOString()
      // });
      // await supabase.from('orders').update({ status: 'fulfillment_processing' }).eq('order_number', outTradeNo);
    }

    // Telebirr expects response code 0 for acknowledgment
    return NextResponse.json({
      code: 0,
      message: 'success',
      receivedTradeNo: tradeNo,
    });
  } catch (err: any) {
    console.error('[TELEBIRR WEBHOOK ERROR]', err);
    return NextResponse.json(
      { code: 500, message: 'Internal Server Error', error: err.message },
      { status: 500 }
    );
  }
}
