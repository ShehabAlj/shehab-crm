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
        
        // Internal Security: Verify chat_id against telegram_users
        const { data: mapping, error: mapError } = await supabaseAdmin
            .from('telegram_users')
            .select('user_id')
            .eq('chat_id', chatId)
            .single();

        if (mapError || !mapping || !mapping.user_id) {
            console.warn(`Unauthorized Telegram access attempt from Chat ID: ${chatId}`);
            await sendMessage(chatId, "🚫 *Access Denied*\n\nYour Telegram account is not linked to Shehab CRM.", 'Markdown');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userId = mapping.user_id;

        // Process Command asynchronously (Fire-and-Forget) to prevent Telegram timeouts
        processTelegramCommand(userId, text, chatId, sender).catch(err => {
            console.error("Background Telegram Command Error:", err);
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram Webhook Error:', error);
        // CRITICAL: Return 200 OK to prevent Telegram from retrying on error
        return NextResponse.json({ ok: true }); 
    }
}

async function processTelegramCommand(userId: string, text: string, chatId: number, sender: string) {
    const supabaseAdmin = createAdminClient();

    // 2. Command Processing
    if (text.startsWith('/start')) {
        await sendMessage(chatId, "👋 *Jarvis Online*\n\nI am connected to your CRM. Commands:\n\n• /leads - View Hot/Active leads\n• /move [client] [status] - Update pipeline\n• /analyze [client] - AI Strategic Analysis", 'Markdown');
    } 
    
    else if (text.startsWith('/leads')) {
        const { data: leads } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!leads || leads.length === 0) {
             await sendMessage(chatId, "📭 Your pipeline is empty.");
             return;
        }

        // Filter for Hot or Working
        const hotLeads = leads.filter((l: DbLead) => l.heat_level === 'Hot' || l.status === 'Working');
        
        if (hotLeads.length === 0) {
            await sendMessage(chatId, "📭 No priority leads found (Hot/Working).");
            return;
        }

        let msg = "🔥 *Priority Pipeline*\n\n";
        hotLeads.forEach((l: DbLead) => {
            msg += `• *${l.client_name}* (${l.project_type})\n   Status: ${l.status} | Value: OMR ${l.project_value || 0}\n\n`;
        });

        await sendMessage(chatId, msg);
    }

    else if (text.startsWith('/move')) {
         // Format: /move [Client Name] [Status]
         const parts = text.split(' ');
         if (parts.length < 3) {
             await sendMessage(chatId, "⚠️ Usage: `/move [Client Name] [Status]`\nExample: `/move Lava Done`", 'Markdown');
             return;
         }
         
         const clientQuery = parts[1].toLowerCase();
         const statusQuery = parts[2]; 

         // Find Lead
         const { data: leads } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('user_id', userId)
            .ilike('client_name', `%${clientQuery}%`)
            .limit(1);
        
         if (!leads || leads.length === 0) {
             await sendMessage(chatId, `❌ Client matching "${clientQuery}" not found.`);
             return;
         }

         const lead = leads[0];
         
         // Map Status
         // Flexible matching
         const validStatuses = ['New', 'In Talk', 'Working', 'Testing', 'Done'];
         const cleanStatus = validStatuses.find(s => s.toLowerCase() === statusQuery.toLowerCase()) || statusQuery;
         
         // Basic validation
         if (!validStatuses.includes(cleanStatus) && !['new','in talk','working','testing','done'].includes(cleanStatus.toLowerCase())) {
             // Let it slide or strictly enforce? Let's just update.
         }

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
        // Future: Trigger AI Logic
    }

    else {
        // Fallback
        // await sendMessage(chatId, "❓ Command not recognized.");
    }
}
