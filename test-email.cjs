// test-email.cjs — Standalone Resend test (no Next.js needed)
// Run: node test-email.cjs

const path = require('path');
const fs = require('fs');

// ─── Load .env.local manually ──────────────────────────────
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const val = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
            process.env[key] = val;
        }
    }
    console.log('✅ Loaded .env.local\n');
} else {
    console.log('⚠️  No .env.local found, checking .env...');
    const envPath2 = path.join(__dirname, '.env');
    if (fs.existsSync(envPath2)) {
        const lines = fs.readFileSync(envPath2, 'utf-8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex).trim();
            const val = trimmed.slice(eqIndex + 1).trim();
            if (!process.env[key]) process.env[key] = val;
        }
        console.log('✅ Loaded .env\n');
    } else {
        console.log('❌ No .env.local or .env found!\n');
    }
}

// ─── Check env vars ─────────────────────────────────────────
async function testEmail() {
    console.log('📧 Resend Email Test');
    console.log('─'.repeat(40));
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY
        ? `✅ Set (${process.env.RESEND_API_KEY.slice(0, 10)}...)`
        : '❌ MISSING'
    );
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '⚠️  Not set (will use onboarding@resend.dev)');
    console.log('');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ Add RESEND_API_KEY=re_xxxxxxxx to your .env.local file');
        process.exit(1);
    }

    // ─── Dynamic import (resend is ESM-compatible) ────────────
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // ╔══════════════════════════════════════════════════════════╗
    // ║  ⚠️  CHANGE THIS to YOUR email address                  ║
    // ║  If using onboarding@resend.dev as sender, this MUST    ║
    // ║  be the email you signed up to Resend with!             ║
    // ╚══════════════════════════════════════════════════════════╝
    const TEST_TO_EMAIL = 'vyassidhartha5@gmail.com';

    if (TEST_TO_EMAIL.includes('PUT_YOUR_EMAIL')) {
        console.error('❌ Open test-email.cjs and change TEST_TO_EMAIL to your real email!');
        process.exit(1);
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL
        || 'Nidsscrochet <onboarding@resend.dev>';

    console.log('From:', fromEmail);
    console.log('To:  ', TEST_TO_EMAIL);
    console.log('─'.repeat(40));
    console.log('⏳ Sending...\n');

    try {
        const result = await resend.emails.send({
            from: fromEmail,
            to: [TEST_TO_EMAIL],
            subject: '🧪 Nidsscrochet — Email Test',
            html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#ff4d8a;text-align:center;margin-bottom:0">Nidsscrochet</h1>
          <p style="text-align:center;color:#888;margin-top:4px">Email Delivery Test</p>
          <div style="background:linear-gradient(135deg,#ff6b9d,#ff4d8a);color:white;border-radius:14px;padding:24px;text-align:center;margin:20px 0">
            <div style="font-size:2.5rem;margin-bottom:8px">✅</div>
            <h2 style="margin:0 0 8px">It Works!</h2>
            <p style="margin:0;opacity:0.9">Resend is configured correctly.</p>
          </div>
          <div style="background:#fff;border:1px solid #ffe5ec;border-radius:12px;padding:16px">
            <p style="margin:4px 0"><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
            <p style="margin:4px 0"><strong>From:</strong> ${fromEmail}</p>
            <p style="margin:4px 0"><strong>Key:</strong> ${process.env.RESEND_API_KEY.slice(0, 10)}...</p>
          </div>
        </div>
      `,
        });

        // Check for API-level errors
        if (result?.error) {
            console.error('❌ Resend API Error:');
            console.error('   Message:', result.error.message);
            console.error('   Status:', result.error.statusCode || 'unknown');
            console.error('');

            if (result.error.message?.toLowerCase().includes('only send')) {
                console.error('┌──────────────────────────────────────────────────┐');
                console.error('│ onboarding@resend.dev can ONLY send to the      │');
                console.error('│ email you signed up to Resend with.             │');
                console.error('│                                                  │');
                console.error('│ To send to real customers:                       │');
                console.error('│ 1. Go to https://resend.com/domains             │');
                console.error('│ 2. Add & verify your domain                     │');
                console.error('│ 3. Set RESEND_FROM_EMAIL=hi@yourdomain.com      │');
                console.error('└──────────────────────────────────────────────────┘');
            }
            process.exit(1);
        }

        console.log('✅ Email sent successfully!');
        console.log('   Email ID:', result?.data?.id);
        console.log('');
        console.log('📬 Check inbox (+ spam) at:', TEST_TO_EMAIL);
        console.log('📊 Dashboard: https://resend.com/emails');

    } catch (err) {
        console.error('❌ Send failed:', err?.message || err);
        console.error('');
        if (err?.message?.includes('Invalid API')) {
            console.error('💡 Your API key is wrong — get a new one at https://resend.com/api-keys');
        }
        if (err?.statusCode === 422 || err?.message?.includes('validation')) {
            console.error('💡 The "from" email format may be wrong');
            console.error('   Use: "Name <email@domain.com>" or just "email@domain.com"');
        }
        process.exit(1);
    }
}

testEmail();