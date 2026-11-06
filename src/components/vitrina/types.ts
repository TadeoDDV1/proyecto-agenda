export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  categoryName: string;
  imageUrl: string | null;
  staffIds: string[];
}

export interface PublicStaff {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  colorCode: string;
  bio: string | null;
  specialties: string | null;
  serviceIds: string[];
}

export interface PublicTestimonial {
  id: string;
  authorName: string;
  quote: string;
  rating: number;
}

export interface BusinessHourItem {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface BookingTenant {
  slug: string;
  name: string;
  currency: string;
  timezone: string;
  address: string | null;
  whatsappNumber: string | null;
}

export interface PublicDay {
  dateKey: string;
  isClosed: boolean;
  count: number;
  firstSlot: string | null;
}
