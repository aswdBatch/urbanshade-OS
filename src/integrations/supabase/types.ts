export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          is_public: boolean
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          is_public?: boolean
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          is_public?: boolean
          user_id?: string
        }
        Relationships: []
      }
      admin_access_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          created_at: string | null
          id: string
          note: string
          target_user_id: string
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: string
          note: string
          target_user_id: string
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: string
          note?: string
          target_user_id?: string
        }
        Relationships: []
      }
      admin_pins: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          locked_until: string | null
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          locked_until?: string | null
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      battlepass_seasons: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string
          id: string
          is_active: boolean | null
          max_level: number | null
          name: string
          rewards: Json
          season_key: string
          starts_at: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name: string
          rewards?: Json
          season_key: string
          starts_at: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean | null
          max_level?: number | null
          name?: string
          rewards?: Json
          season_key?: string
          starts_at?: string
        }
        Relationships: []
      }
      chat_rate_limits: {
        Row: {
          identifier: string
          is_authenticated: boolean
          last_message_at: string
        }
        Insert: {
          identifier: string
          is_authenticated?: boolean
          last_message_at?: string
        }
        Update: {
          identifier?: string
          is_authenticated?: boolean
          last_message_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          gift_type: string
          id: string
          item_id: string | null
          item_type: string | null
          message: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          gift_type: string
          id?: string
          item_id?: string | null
          item_type?: string | null
          message?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          gift_type?: string
          id?: string
          item_id?: string | null
          item_type?: string | null
          message?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      global_chat_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          is_deleted: boolean
          is_system: boolean
          is_vip: boolean | null
          reply_to_id: string | null
          temp_session_id: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          is_deleted?: boolean
          is_system?: boolean
          is_vip?: boolean | null
          reply_to_id?: string | null
          temp_session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          is_deleted?: boolean
          is_system?: boolean
          is_vip?: boolean | null
          reply_to_id?: string | null
          temp_session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "global_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_rate_limits: {
        Row: {
          blocked_until: string | null
          message_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          message_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          message_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          priority: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_fake: boolean | null
          reason: string | null
          target_ip: unknown
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_fake?: boolean | null
          reason?: string | null
          target_ip?: unknown
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_fake?: boolean | null
          reason?: string | null
          target_ip?: unknown
          target_user_id?: string | null
        }
        Relationships: []
      }
      monitoring_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      navi_auto_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          reason: string
          reversed: boolean | null
          reversed_at: string | null
          reversed_by: string | null
          target_user_id: string | null
          threat_level: string | null
          trigger_stats: Json | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          reason: string
          reversed?: boolean | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_user_id?: string | null
          threat_level?: string | null
          trigger_stats?: Json | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          reason?: string
          reversed?: boolean | null
          reversed_at?: string | null
          reversed_by?: string | null
          target_user_id?: string | null
          threat_level?: string | null
          trigger_stats?: Json | null
        }
        Relationships: []
      }
      navi_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          priority: string | null
          sent_by: string | null
          target_audience: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          sent_by?: string | null
          target_audience?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          sent_by?: string | null
          target_audience?: string | null
        }
        Relationships: []
      }
      navi_settings: {
        Row: {
          adaptive_thresholds_enabled: boolean | null
          auto_disable_signups: boolean | null
          auto_lockdown_enabled: boolean | null
          auto_read_only_mode: boolean | null
          auto_temp_ban_enabled: boolean | null
          auto_vip_only_mode: boolean | null
          auto_warn_enabled: boolean | null
          degraded_service_messages_enabled: boolean | null
          disable_messages: boolean | null
          disable_signups: boolean | null
          failed_login_rolling_avg: number | null
          failed_login_threshold: number | null
          id: string
          last_threshold_adjustment: string | null
          lockdown_mode: boolean | null
          lockdown_multiplier: number | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          message_rolling_avg: number | null
          message_threshold: number | null
          push_critical_enabled: boolean | null
          push_recovery_enabled: boolean | null
          push_warning_enabled: boolean | null
          read_only_mode: boolean | null
          signup_rolling_avg: number | null
          signup_threshold: number | null
          updated_at: string | null
          updated_by: string | null
          vip_only_mode: boolean | null
          warning_messages_enabled: boolean | null
          welcome_messages_enabled: boolean | null
        }
        Insert: {
          adaptive_thresholds_enabled?: boolean | null
          auto_disable_signups?: boolean | null
          auto_lockdown_enabled?: boolean | null
          auto_read_only_mode?: boolean | null
          auto_temp_ban_enabled?: boolean | null
          auto_vip_only_mode?: boolean | null
          auto_warn_enabled?: boolean | null
          degraded_service_messages_enabled?: boolean | null
          disable_messages?: boolean | null
          disable_signups?: boolean | null
          failed_login_rolling_avg?: number | null
          failed_login_threshold?: number | null
          id?: string
          last_threshold_adjustment?: string | null
          lockdown_mode?: boolean | null
          lockdown_multiplier?: number | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          message_rolling_avg?: number | null
          message_threshold?: number | null
          push_critical_enabled?: boolean | null
          push_recovery_enabled?: boolean | null
          push_warning_enabled?: boolean | null
          read_only_mode?: boolean | null
          signup_rolling_avg?: number | null
          signup_threshold?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_only_mode?: boolean | null
          warning_messages_enabled?: boolean | null
          welcome_messages_enabled?: boolean | null
        }
        Update: {
          adaptive_thresholds_enabled?: boolean | null
          auto_disable_signups?: boolean | null
          auto_lockdown_enabled?: boolean | null
          auto_read_only_mode?: boolean | null
          auto_temp_ban_enabled?: boolean | null
          auto_vip_only_mode?: boolean | null
          auto_warn_enabled?: boolean | null
          degraded_service_messages_enabled?: boolean | null
          disable_messages?: boolean | null
          disable_signups?: boolean | null
          failed_login_rolling_avg?: number | null
          failed_login_threshold?: number | null
          id?: string
          last_threshold_adjustment?: string | null
          lockdown_mode?: boolean | null
          lockdown_multiplier?: number | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          message_rolling_avg?: number | null
          message_threshold?: number | null
          push_critical_enabled?: boolean | null
          push_recovery_enabled?: boolean | null
          push_warning_enabled?: boolean | null
          read_only_mode?: boolean | null
          signup_rolling_avg?: number | null
          signup_threshold?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_only_mode?: boolean | null
          warning_messages_enabled?: boolean | null
          welcome_messages_enabled?: boolean | null
        }
        Relationships: []
      }
      navi_threshold_history: {
        Row: {
          id: string
          metric_type: string
          recorded_at: string | null
          value: number
        }
        Insert: {
          id?: string
          metric_type: string
          recorded_at?: string | null
          value: number
        }
        Update: {
          id?: string
          metric_type?: string
          recorded_at?: string | null
          value?: number
        }
        Relationships: []
      }
      profile_visitors: {
        Row: {
          id: string
          profile_user_id: string
          visited_at: string | null
          visitor_user_id: string
        }
        Insert: {
          id?: string
          profile_user_id: string
          visited_at?: string | null
          visitor_user_id: string
        }
        Update: {
          id?: string
          profile_user_id?: string
          visited_at?: string | null
          visitor_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clearance: number | null
          created_at: string
          display_name: string | null
          equipped_badge_id: string | null
          equipped_title_id: string | null
          id: string
          is_online: boolean | null
          last_login_bonus: string | null
          last_seen: string | null
          lifetime_kroner: number
          login_streak: number
          role: string | null
          settings: Json | null
          spendable_kroner: number
          total_chat_messages: number | null
          total_messages: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clearance?: number | null
          created_at?: string
          display_name?: string | null
          equipped_badge_id?: string | null
          equipped_title_id?: string | null
          id?: string
          is_online?: boolean | null
          last_login_bonus?: string | null
          last_seen?: string | null
          lifetime_kroner?: number
          login_streak?: number
          role?: string | null
          settings?: Json | null
          spendable_kroner?: number
          total_chat_messages?: number | null
          total_messages?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clearance?: number | null
          created_at?: string
          display_name?: string | null
          equipped_badge_id?: string | null
          equipped_title_id?: string | null
          id?: string
          is_online?: boolean | null
          last_login_bonus?: string | null
          last_seen?: string | null
          lifetime_kroner?: number
          login_streak?: number
          role?: string | null
          settings?: Json | null
          spendable_kroner?: number
          total_chat_messages?: number | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          assigned_admin_id: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          report_type: string
          reported_user_id: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          report_type: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean
          item_id: string
          item_type: string
          limited_until: string | null
          name: string
          preview_data: Json | null
          price: number
          rarity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean
          item_id: string
          item_type: string
          limited_until?: string | null
          name: string
          preview_data?: Json | null
          price?: number
          rarity?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean
          item_id?: string
          item_type?: string
          limited_until?: string | null
          name?: string
          preview_data?: Json | null
          price?: number
          rarity?: string
        }
        Relationships: []
      }
      site_locks: {
        Row: {
          id: string
          is_locked: boolean | null
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
        }
        Insert: {
          id?: string
          is_locked?: boolean | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          id?: string
          is_locked?: boolean | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
        }
        Relationships: []
      }
      site_status: {
        Row: {
          id: string
          message: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          message?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_admin_id: string | null
          created_at: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      synced_settings: {
        Row: {
          created_at: string
          desktop_icons: Json | null
          id: string
          install_type: string | null
          installed_apps: Json | null
          last_sync: string
          system_settings: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          desktop_icons?: Json | null
          id?: string
          install_type?: string | null
          installed_apps?: Json | null
          last_sync?: string
          system_settings?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          desktop_icons?: Json | null
          id?: string
          install_type?: string | null
          installed_apps?: Json | null
          last_sync?: string
          system_settings?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          priority: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          priority?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      test_emergencies: {
        Row: {
          ended_at: string | null
          fake_data: Json | null
          id: string
          initiated_by: string | null
          is_active: boolean | null
          started_at: string | null
        }
        Insert: {
          ended_at?: string | null
          fake_data?: Json | null
          id?: string
          initiated_by?: string | null
          is_active?: boolean | null
          started_at?: string | null
        }
        Update: {
          ended_at?: string | null
          fake_data?: Json | null
          id?: string
          initiated_by?: string | null
          is_active?: boolean | null
          started_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          faq_question: string | null
          id: string
          is_faq_response: boolean | null
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          faq_question?: string | null
          id?: string
          is_faq_response?: boolean | null
          sender_id?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          faq_question?: string | null
          id?: string
          is_faq_response?: boolean | null
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_battlepass: {
        Row: {
          claimed_rewards: Json | null
          created_at: string | null
          current_level: number | null
          current_xp: number | null
          id: string
          last_xp_tick: string | null
          season_id: string | null
          total_xp_earned: number | null
          user_id: string
        }
        Insert: {
          claimed_rewards?: Json | null
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          last_xp_tick?: string | null
          season_id?: string | null
          total_xp_earned?: number | null
          user_id: string
        }
        Update: {
          claimed_rewards?: Json | null
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          last_xp_tick?: string | null
          season_id?: string | null
          total_xp_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_battlepass_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battlepass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certificates: {
        Row: {
          achievement_rarity: string | null
          certificate_id: string
          certificate_name: string
          certificate_type: string
          earned_at: string | null
          id: string
          season_key: string | null
          user_id: string
        }
        Insert: {
          achievement_rarity?: string | null
          certificate_id: string
          certificate_name: string
          certificate_type: string
          earned_at?: string | null
          id?: string
          season_key?: string | null
          user_id: string
        }
        Update: {
          achievement_rarity?: string | null
          certificate_id?: string
          certificate_name?: string
          certificate_type?: string
          earned_at?: string | null
          id?: string
          season_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_first_login: {
        Row: {
          created_at: string | null
          user_id: string
          welcomed: boolean | null
          welcomed_at: string | null
        }
        Insert: {
          created_at?: string | null
          user_id: string
          welcomed?: boolean | null
          welcomed_at?: string | null
        }
        Update: {
          created_at?: string | null
          user_id?: string
          welcomed?: boolean | null
          welcomed_at?: string | null
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string | null
          gifted_by: string | null
          id: string
          item_id: string
          item_type: string
          source: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          gifted_by?: string | null
          id?: string
          item_id: string
          item_type: string
          source: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          gifted_by?: string | null
          id?: string
          item_id?: string
          item_type?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          quest_description: string | null
          quest_id: string
          quest_name: string
          rarity: string
          reset_at: string
          target: number | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          quest_description?: string | null
          quest_id: string
          quest_name: string
          rarity: string
          reset_at: string
          target?: number | null
          user_id: string
          xp_reward: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          quest_description?: string | null
          quest_id?: string
          quest_name?: string
          rarity?: string
          reset_at?: string
          target?: number | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_titles: {
        Row: {
          id: string
          source: string
          title_id: string
          title_name: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          source: string
          title_id: string
          title_name: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          source?: string
          title_id?: string
          title_name?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      uur_submission_rate_limits: {
        Row: {
          blocked_until: string | null
          ip_hash: string
          submission_count: number | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          ip_hash: string
          submission_count?: number | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          ip_hash?: string
          submission_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      uur_submissions: {
        Row: {
          author: string
          description: string | null
          github_url: string
          id: string
          package_name: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
        }
        Insert: {
          author: string
          description?: string | null
          github_url: string
          id?: string
          package_name: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Update: {
          author?: string
          description?: string | null
          github_url?: string
          id?: string
          package_name?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Relationships: []
      }
      vips: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          achievement_count: number | null
          avatar_url: string | null
          display_name: string | null
          friend_count: number | null
          is_online: boolean | null
          last_seen: string | null
          member_since: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          total_chat_messages: number | null
          total_messages: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      public_uur_submissions: {
        Row: {
          author: string | null
          description: string | null
          github_url: string | null
          id: string | null
          package_name: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          author?: string | null
          description?: string | null
          github_url?: string | null
          id?: string | null
          package_name?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          author?: string | null
          description?: string | null
          github_url?: string | null
          id?: string | null
          package_name?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_navi_thresholds: { Args: never; Returns: undefined }
      check_and_send_message: {
        Args: {
          p_body: string
          p_priority?: string
          p_recipient_id: string
          p_subject: string
        }
        Returns: Json
      }
      cleanup_old_chat_messages: { Args: never; Returns: undefined }
      get_available_admin: {
        Args: never
        Returns: {
          admin_id: string
          username: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_creator: { Args: { _user_id: string }; Returns: boolean }
      is_vip: { Args: { _user_id: string }; Returns: boolean }
      record_navi_metrics: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "creator"
        | "co_creator"
        | "trial_admin"
      ticket_status:
        | "open"
        | "pending_human"
        | "in_progress"
        | "resolved"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "creator",
        "co_creator",
        "trial_admin",
      ],
      ticket_status: [
        "open",
        "pending_human",
        "in_progress",
        "resolved",
        "closed",
      ],
    },
  },
} as const
