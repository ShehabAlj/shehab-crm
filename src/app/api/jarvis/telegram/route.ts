import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getLeadsFromDb, updateLeadInDb, createLeadInDb, DbLead } from '@/lib/crm'; 
import { getProjectAnalysis, saveProjectAnalysis } from '@/lib/crm';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper to send messages
async function sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode
            })
        });
    } catch (e) {
        console.error('Failed to send Telegram message', e);
    }
}

export async function POST(req: Request) {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    try {
        const update = await req.json();
        
        // Only handle messages
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true }); // Acknowledge to stop retries
        }

        const chatId = update.message.chat.id;
        const text = update.message.text;
        const sender = update.message.from.username;

        // 1. Authenticate User via Database Mapping
        const supabaseAdmin = createAdminClient();
        const { data: mapping, error: mapError } = await supabaseAdmin
            .from('telegram_users')
            .select('user_id')
            .eq('chat_id', chatId)
            .single();

        if (mapError || !mapping) {
            await sendMessage(chatId, "🚫 *Access Denied*\n\nYour Telegram account is not linked to Shehab CRM.\nPlease contact the system administrator.", 'Markdown');
            return NextResponse.json({ ok: true });
        }

        const userId = mapping.user_id;

        // 2. Command Processing
        if (text.startsWith('/start')) {
            await sendMessage(chatId, "👋 *Jarvis Online*\n\nI am connected to your CRM. Commands:\n\n• /leads - View Hot/Active leads\n• /move [client] [status] - Update pipeline\n• /analyze [client] - AI Strategic Analysis", 'Markdown');
        } 
        
        else if (text.startsWith('/leads')) {
            // Fetch leads for this specific user
            // We use admin client but filter by user_id logic IF getLeadsFromDb supports it?
            // Wait, getLeadsFromDb returns ALL leads if we pass admin client because RLS is bypassed.
            // We need to manually filter or use a specific user-scoped query. 
            // Or better: `getLeadsFromDb` just does select * from leads. 
            // With Admin client, it gets ALL. So we MUST filter by user_id manually here.
            
            // Re-implementing fetch here to be safe and scoped
            const { data: leads } = await supabaseAdmin
                .from('leads')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!leads || leads.length === 0) {
                 await sendMessage(chatId, "📭 Your pipeline is empty.");
                 return NextResponse.json({ ok: true });
            }

            const hotLeads = leads.filter((l: DbLead) => l.heat_level === 'Hot' || l.status === 'Working');
            
            let msg = "🔥 *Priority Pipeline*\n\n";
            hotLeads.forEach((l: DbLead) => {
                msg += `• *${l.client_name}* (${l.project_type})\n   Current: ${l.status} | OMR ${l.project_value}\n\n`;
            });

            await sendMessage(chatId, msg);
        }

        else if (text.startsWith('/move')) {
             // Format: /move [Client Name] [Status]
             // Very naive parsing
             const parts = text.split(' ');
             if (parts.length < 3) {
                 await sendMessage(chatId, "⚠️ Usage: `/move [Client Name] [Status]`\nExample: `/move Lava Done`", 'Markdown');
                 return NextResponse.json({ ok: true });
             }
             
             const clientQuery = parts[1].toLowerCase();
             const statusQuery = parts[2]; // Need to map to exact status enum?

             // Find Lead
             const { data: leads } = await supabaseAdmin
                .from('leads')
                .select('*')
                .eq('user_id', userId)
                .ilike('client_name', `%${clientQuery}%`)
                .limit(1);
            
             if (!leads || leads.length === 0) {
                 await sendMessage(chatId, `❌ Client matching "${clientQuery}" not found.`);
                 return NextResponse.json({ ok: true });
             }

             const lead = leads[0];
             
             // Map Status
             const validStatuses = ['New', 'In Talk', 'Working', 'Testing', 'Done'];
             const cleanStatus = validStatuses.find(s => s.toLowerCase() === statusQuery.toLowerCase()) || statusQuery;

             // Update
             const { error: updateError } = await supabaseAdmin
                .from('leads')
                .update({ status: cleanStatus, last_synced_at: new Date().toISOString() })
                .eq('id', lead.id);

             if (updateError) {
                 await sendMessage(chatId, "❌ Database Error.");
             } else {
                 await sendMessage(chatId, `✅ *${lead.client_name}* moved to *${cleanStatus}*.`);
             }
        }

        else if (text.startsWith('/analyze')) {
            await sendMessage(chatId, "🧠 *Thinking...* Analysis triggered.", 'Markdown');
            // Trigger AI Logic here (omitted for brevity, can call lib functions)
            // Ideally we'd call the same logic as /api/jarvis but via function call
        }

        else {
            // Default: Chat with Jarvis (Contextual)
            // For now, simple echo or help
            // await sendMessage(chatId, "❓ Command not recognized. Try /leads.");
            
            // PROACTIVE: Just treat everything else as a conversation?
            // Maybe later.
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram Webhook Error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Error' }, { status: 500 });
    }
}
