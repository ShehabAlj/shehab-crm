import { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export async function getRecentMemory(client: SupabaseClient, userId: string, limit = 15): Promise<MemoryMessage[]> {
    // Determine if we need to filter by user_id explicitely
    // If client is service_role (admin), we MUST filter by user_id.
    // If client is auth-scoped, RLS handles it, but adding .eq('user_id', userId) doesn't hurt and ensures correctness.
    
    const { data, error } = await client
        .from('jarvis_memory')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching Jarvis memory:", error);
        return [];
    }

    // Reverse to return in chronological order (oldest first)
    return data ? data.reverse() as MemoryMessage[] : [];
}

export async function saveMemory(
    client: SupabaseClient,
    userId: string,
    content: string,
    role: 'user' | 'assistant',
    channel: 'web' | 'telegram'
) {
    if (!content || !content.trim()) return;

    const { error } = await client
        .from('jarvis_memory')
        .insert({
            user_id: userId,
            content,
            role,
            channel
        });

    if (error) {
        console.error("Error saving Jarvis memory:", error);
    }
}
