import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Save subscription to DB
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    });

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Optionally: send a welcome notification immediately
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      const payload = JSON.stringify({
        title: 'Annavra Notifications Enabled',
        body: 'You will now receive workout reminders and logging nudges.',
      });

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (pushErr) {
        console.error('Failed to send welcome push:', pushErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Subscribe endpoint error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
