import { supabase } from '../lib/supabase';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default {
  async findOne(query: Partial<ApiKey>): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .match(query)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ApiKey;
  },

  async updateOne(query: { _id: string }, update: Partial<ApiKey>): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update(update)
      .eq('id', query._id);

    if (error) {
      throw error;
    }
  }
}; 