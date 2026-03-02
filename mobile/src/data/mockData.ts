// ─── Types ───────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  totalPickups: number;
  earnings: number;
  rating: number;
}

export interface Pickup {
  id: string;
  tag: string;
  price: number;
  location: string;
  distance: string;
  duration: string;
  parcelType: string;
  weight: string;
  coordinates: { latitude: number; longitude: number };
}

export interface Parcel {
  id: string;
  senderName: string;
  tier: 'PREMIUM' | 'STANDARD';
  destination: string;
  size: 'Small Box' | 'Medium Box' | 'Large Box';
  paymentAmount: number;
  hubName: string;
  status: 'pending' | 'picked' | 'delivered';
}

export interface DeliverySession {
  sessionId: string;
  totalDeliveries: number;
  timeOnRoad: string;
  totalEarnings: number;
  currentTrip: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockDriver: Driver = {
  id: 'DRV-001',
  name: 'Youssef Labnine',
  email: 'youssef.labnine@gmail.com',
  isOnline: true,
  totalPickups: 12,
  earnings: 142.50,
  rating: 4.9,
};

export const mockPickups: Pickup[] = [
  {
    id: 'PKP-001',
    tag: 'IMMEDIATE PICKUP',
    price: 18.50,
    location: 'Ourika Valley',
    distance: '2km away',
    duration: '15 mins',
    parcelType: 'Large Box',
    weight: '12kg',
    coordinates: { latitude: 31.6295, longitude: -7.9811 },
  },
  {
    id: 'PKP-002',
    tag: 'SCHEDULED',
    price: 12.00,
    location: 'Marrakech Plaza',
    distance: '4.5km away',
    duration: '22 mins',
    parcelType: 'Medium Parcel',
    weight: '5kg',
    coordinates: { latitude: 31.6340, longitude: -7.9900 },
  },
  {
    id: 'PKP-003',
    tag: 'IMMEDIATE PICKUP',
    price: 22.00,
    location: 'Gueliz District',
    distance: '6km away',
    duration: '30 mins',
    parcelType: 'Small Box',
    weight: '2kg',
    coordinates: { latitude: 31.6420, longitude: -8.0010 },
  },
];

export const mockParcel: Parcel = {
  id: 'PARCEL-SL-8842',
  senderName: 'Fatima',
  tier: 'PREMIUM',
  destination: 'Marrakech Market',
  size: 'Medium Box',
  paymentAmount: 30,
  hubName: 'Casablanca Logistics Center',
  status: 'pending',
};

export const mockSession: DeliverySession = {
  sessionId: '#4002 - Morning Route',
  totalDeliveries: 12,
  timeOnRoad: '6h 24m',
  totalEarnings: 180,
  currentTrip: 15,
};
