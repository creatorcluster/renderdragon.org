export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row extends Record<string, Json | undefined>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ResourceCategory = 'music' | 'sfx' | 'images' | 'animations' | 'fonts' | 'presets';
type ResourceSubcategory = 'davinci' | 'adobe';

type Blog = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  [key: string]: Json | undefined;
};

type CreatorPack = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  small_description: string;
  description: string;
  cover_image_url: string | null;
  external_link: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  review_reason: string | null;
  created_at: string;
  [key: string]: Json | undefined;
};

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  links: Json;
  social_links: Json;
  theme_config: Json;
  verified: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: Json | undefined;
};

type Resource = {
  id: number;
  title: string;
  category: ResourceCategory;
  subcategory: ResourceSubcategory | null;
  credit: string | null;
  filetype: string | null;
  software: string | null;
  image_url: string | null;
  description: string | null;
  preview_url: string | null;
  download_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: Json | undefined;
};

type UserFavorite = {
  id: string;
  user_id: string;
  resource_url: string | null;
  resource_id: string | null;
  folder_id: string | null;
  created_at: string;
  [key: string]: Json | undefined;
};

type FavoriteFolder = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
  [key: string]: Json | undefined;
};

type ShowcasePage = {
  id: string;
  owner_id: string;
  slug: string;
  title: string | null;
  about: string | null;
  theme: Json;
  layout: Json;
  cover_image_path: string | null;
  avatar_image_path: string | null;
  status: 'draft' | 'published' | 'unlisted';
  created_at: string;
  updated_at: string;
  [key: string]: Json | undefined;
};

type ShowcaseMedia = {
  id: string;
  page_id: string;
  kind: 'image';
  path: string;
  position: number;
  created_at: string;
  [key: string]: Json | undefined;
};

type LooneyRateLimit = {
  id: number;
  bucket_type: 'browser' | 'ip' | 'account';
  bucket_hash: string;
  user_id: string | null;
  window_started_at: string;
  check_count: number;
  last_check_at: string;
};

type AnalyticsVisitor = {
  visitor_key: string;
  user_id: string | null;
  browser_id: string | null;
  first_seen: string;
  last_seen: string;
  visits: number;
  [key: string]: Json | undefined;
};

type AnalyticsEvent = {
  id: number;
  visitor_key: string;
  user_id: string | null;
  browser_id: string | null;
  session_id: string | null;
  path: string | null;
  referrer: string | null;
  country: string | null;
  user_agent: string | null;
  is_new: boolean;
  created_at: string;
  [key: string]: Json | undefined;
};

export type Database = {
  public: {
    Tables: {
      blogs: Table<Blog>;
      creator_packs: Table<CreatorPack>;
      creator_packs_covers: Table<{ id: string; creator_pack_id: string; path: string; created_at: string; [key: string]: Json | undefined }>;
      downloads: Table<{ id: number; count: number | null; resource_id: number | null }>;
      profiles: Table<Profile>;
      resources: Table<Resource>;
      showcase_media: Table<ShowcaseMedia>;
      showcase_pages: Table<ShowcasePage>;
      user_favorite_folders: Table<FavoriteFolder>;
      user_favorites: Table<UserFavorite>;
      looney_check_rate_limits: Table<LooneyRateLimit>;
      analytics_events: Table<AnalyticsEvent>;
      analytics_visitors: Table<AnalyticsVisitor>;
    };
    Views: Record<string, never>;
    Functions: {
      consume_looney_check_rate_limit: {
        Args: { p_buckets: Json; p_limit?: number; p_consume?: boolean };
        Returns: Array<{
          allowed: boolean;
          retry_after_seconds: number;
          browser_count: number;
          ip_count: number;
          account_count: number;
        }>;
      };
      release_looney_check_rate_limit: {
        Args: { p_buckets: Json };
        Returns: undefined;
      };
      get_my_profile: {
        Args: Record<string, never>;
        Returns: Json;
      };
      analytics_track: {
        Args: {
          p_visitor_key: string;
          p_browser_id: string | null;
          p_user_id: string | null;
          p_session_id: string | null;
          p_path: string | null;
          p_referrer: string | null;
          p_country: string | null;
          p_user_agent: string | null;
          p_session_window_seconds?: number;
        };
        Returns: Json;
      };
      analytics_overview: {
        Args: {
          p_from: string;
          p_to: string;
          p_granularity?: string;
          p_top_limit?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      resource_category: ResourceCategory;
      resource_subcategory: ResourceSubcategory;
    };
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database['public'];

export type Tables<TableName extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][TableName]['Row'];
export type TablesInsert<TableName extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][TableName]['Insert'];
export type TablesUpdate<TableName extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][TableName]['Update'];
export type Enums<EnumName extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][EnumName];
