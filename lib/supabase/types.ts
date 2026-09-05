export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          plan: string;
          status: 'active' | 'trial' | 'suspended';
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          plan?: string;
          status?: 'active' | 'trial' | 'suspended';
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          plan?: string;
          status?: 'active' | 'trial' | 'suspended';
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          organization_id: string;
          public_slug: string;
          legacy_slugs: string[];
          name: string;
          category: string;
          google_place_id: string | null;
          google_maps_review_url: string;
          survey_options: Json;
          keywords: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          public_slug: string;
          legacy_slugs?: string[];
          name: string;
          category?: string;
          google_place_id?: string | null;
          google_maps_review_url?: string;
          survey_options?: Json;
          keywords?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          public_slug?: string;
          legacy_slugs?: string[];
          name?: string;
          category?: string;
          google_place_id?: string | null;
          google_maps_review_url?: string;
          survey_options?: Json;
          keywords?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          display_name: string;
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          display_name?: string;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          display_name?: string;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'viewer';
          status: 'active' | 'invited' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'viewer';
          status?: 'active' | 'invited' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'manager' | 'viewer';
          status?: 'active' | 'invited' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_sessions: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          started_at: string;
          completed_at: string | null;
          user_agent: string | null;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          started_at?: string;
          completed_at?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          started_at?: string;
          completed_at?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
        };
      };
      survey_answers: {
        Row: {
          id: string;
          session_id: string;
          organization_id: string;
          location_id: string;
          rating: number | null;
          answers: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          organization_id: string;
          location_id: string;
          rating?: number | null;
          answers?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          organization_id?: string;
          location_id?: string;
          rating?: number | null;
          answers?: Json;
          created_at?: string;
        };
      };
      review_generations: {
        Row: {
          id: string;
          session_id: string;
          organization_id: string;
          location_id: string;
          prompt_version: string;
          model: string;
          generated_reviews: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          organization_id: string;
          location_id: string;
          prompt_version?: string;
          model?: string;
          generated_reviews?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          organization_id?: string;
          location_id?: string;
          prompt_version?: string;
          model?: string;
          generated_reviews?: Json;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          session_id: string | null;
          event_type: string;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          session_id?: string | null;
          event_type: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          session_id?: string | null;
          event_type?: string;
          metadata?: Json;
          occurred_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          title: string;
          description: string;
          badge_text: string | null;
          expiry_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          title: string;
          description?: string;
          badge_text?: string | null;
          expiry_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          title?: string;
          description?: string;
          badge_text?: string | null;
          expiry_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      coupon_issues: {
        Row: {
          id: string;
          coupon_id: string;
          session_id: string | null;
          code_hash: string | null;
          issued_at: string;
          redeemed_at: string | null;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          session_id?: string | null;
          code_hash?: string | null;
          issued_at?: string;
          redeemed_at?: string | null;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          session_id?: string | null;
          code_hash?: string | null;
          issued_at?: string;
          redeemed_at?: string | null;
        };
      };
      gbp_review_cache: {
        Row: {
          id: string;
          location_id: string;
          external_review_id: string;
          reviewer_name: string | null;
          star_rating: number | null;
          comment: string | null;
          review_created_at: string | null;
          source: 'gbp' | 'places' | 'manual' | 'fixture';
          fetched_at: string;
          expires_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          external_review_id: string;
          reviewer_name?: string | null;
          star_rating?: number | null;
          comment?: string | null;
          review_created_at?: string | null;
          source?: 'gbp' | 'places' | 'manual' | 'fixture';
          fetched_at?: string;
          expires_at: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          external_review_id?: string;
          reviewer_name?: string | null;
          star_rating?: number | null;
          comment?: string | null;
          review_created_at?: string | null;
          source?: 'gbp' | 'places' | 'manual' | 'fixture';
          fetched_at?: string;
          expires_at?: string;
          updated_at?: string;
        };
      };
      review_reply_drafts: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          external_review_id: string;
          tone: 'polite' | 'standard' | 'friendly';
          draft_text: string;
          model: string;
          prompt_version: string;
          generated_by: string | null;
          fetched_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          external_review_id: string;
          tone: 'polite' | 'standard' | 'friendly';
          draft_text: string;
          model?: string;
          prompt_version?: string;
          generated_by?: string | null;
          fetched_at?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          external_review_id?: string;
          tone?: 'polite' | 'standard' | 'friendly';
          draft_text?: string;
          model?: string;
          prompt_version?: string;
          generated_by?: string | null;
          fetched_at?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      review_reply_records: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          review_ref_hash: string;
          status: 'unreplied' | 'drafted' | 'replied' | 'ignored';
          first_seen_at: string;
          seen_at: string | null;
          replied_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          review_ref_hash: string;
          status?: 'unreplied' | 'drafted' | 'replied' | 'ignored';
          first_seen_at?: string;
          seen_at?: string | null;
          replied_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          review_ref_hash?: string;
          status?: 'unreplied' | 'drafted' | 'replied' | 'ignored';
          first_seen_at?: string;
          seen_at?: string | null;
          replied_at?: string | null;
          updated_at?: string;
        };
      };
      review_reply_settings: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          store_call_name: string;
          signature: string;
          tone_default: 'polite' | 'standard' | 'friendly';
          ng_words: string[];
          policy_note: string;
          review_source: 'fixture' | 'manual' | 'places' | 'gbp';
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          store_call_name?: string;
          signature?: string;
          tone_default?: 'polite' | 'standard' | 'friendly';
          ng_words?: string[];
          policy_note?: string;
          review_source?: 'fixture' | 'manual' | 'places' | 'gbp';
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          location_id?: string;
          store_call_name?: string;
          signature?: string;
          tone_default?: 'polite' | 'standard' | 'friendly';
          ng_words?: string[];
          policy_note?: string;
          review_source?: 'fixture' | 'manual' | 'places' | 'gbp';
          updated_at?: string;
        };
      };
      gbp_performance_cache: {
        Row: {
          id: string;
          location_id: string;
          date: string;
          metric_type: string;
          metric_value: number;
          fetched_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          date: string;
          metric_type: string;
          metric_value?: number;
          fetched_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          date?: string;
          metric_type?: string;
          metric_value?: number;
          fetched_at?: string;
          expires_at?: string;
        };
      };
    };
  };
}
