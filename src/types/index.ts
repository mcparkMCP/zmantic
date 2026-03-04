export interface Temple {
  id: string;
  slug: string;
  name: string;
  deity_names: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  cover_image: string | null;
  description: string | null;
  is_published: boolean;
  is_claimed: boolean;
  stripe_metadata_tag: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TempleAdmin {
  id: string;
  temple_id: string;
  user_id: string;
  role: "owner" | "editor";
  created_at: string;
}

export interface Schedule {
  id: string;
  temple_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  day_of_week: number | null; // 0=Sun, 6=Sat, null=daily
  sort_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  temple_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  image_url: string | null;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  temple_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Donation {
  id: string;
  temple_id: string;
  stripe_session_id: string;
  amount_cents: number;
  currency: string;
  donor_email: string | null;
  donor_name: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}
