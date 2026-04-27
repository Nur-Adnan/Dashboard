import { NextResponse } from 'next/server';
import { runRiskScan, daysSince } from '@/lib/risk/engine';
import { getAllStudents } from '@/lib/sheets/students';
import { Resend } from 'resend';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const riskResult = await runRiskScan();

    const allStudents = await getAllStudents();
    const atRiskStudents = allStudents.filter(s => s.risk_status === 'at_risk');

    const resend = new Resend(process.env.RESEND_API_KEY);

    const mentorGroups = new Map<string, { name: string; reasons: string }[]>();
    for (const student of atRiskStudents) {
      const existing = mentorGroups.get(student.mentor_email) || [];
      existing.push({ name: student.name, reasons: student.risk_reasons });
      mentorGroups.set(student.mentor_email, existing);
    }

    let emailsSent = 0;
    const mentorEntries = Array.from(mentorGroups.entries());
    for (const [mentorEmail, students] of mentorEntries) {
      const htmlContent = `
        <h2>⚠️ Daily Risk Alert</h2>
        <p>The following students need attention:</p>
        <ul>
          ${students.map(s => `<li><strong>${s.name}</strong>: ${s.reasons || 'No specific reason'}</li>`).join('')}
        </ul>
        <p>Please review and take necessary action.</p>
      `;

      try {
        await resend.emails.send({
          from: 'Placement Dashboard <onboarding@resend.dev>',
          to: mentorEmail,
          subject: `⚠️ Daily Risk Alert — ${students.length} Students Need Attention`,
          html: htmlContent,
        });
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${mentorEmail}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      risk_scan: riskResult,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}