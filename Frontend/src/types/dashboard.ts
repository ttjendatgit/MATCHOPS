export interface DashboardSeriesPoint {
  label: string;
  value: number;
}

export interface DashboardCountPoint {
  label: string;
  count: number;
}

export interface DashboardBreakdownItem {
  label: string;
  count: number;
  value: number;
}

export interface ForecastMetric {
  label: string;
  value: string;
}

export interface DashboardAiSummary {
  summary: string;
  insights: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  forecast: ForecastMetric[];
  isFallback: boolean;
  generatedAt: string;
}

export interface VenuePerformance {
  venueId: string;
  venueName: string;
  bookingCount: number;
  revenue: number;
  cancellationRate: number;
  averageRating: number;
}

export interface CourtPerformance {
  courtId: string;
  courtName: string;
  bookingCount: number;
  revenue: number;
}

export interface DashboardCancellationStats {
  cancelledBookings: number;
  totalBookings: number;
  cancellationRate: number;
}

export interface SpendingStatistics {
  totalSpent: number;
  averageSpend: number;
  thisMonthSpent: number;
}

export interface MatchmakingStatistics {
  totalMatchPosts: number;
  openMatchPosts: number;
  joinedMatchRooms: number;
  matchNotifications: number;
}

export interface DashboardAdminStatistics {
  totalUsers: number;
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: DashboardSeriesPoint[];
  bookingTrend: DashboardSeriesPoint[];
  mostPopularSports: DashboardBreakdownItem[];
  peakBookingHours: DashboardCountPoint[];
  bookingGrowthRate: number;
  topPerformingVenues: VenuePerformance[];
  cancellationRate: number;
  userRetentionRate: number;
  totalReviews: number;
  totalNotifications: number;
}

export interface DashboardOwnerStatistics {
  revenueToday: number;
  revenueThisMonth: number;
  totalBookings: number;
  courtUtilizationRate: number;
  mostPopularCourts: CourtPerformance[];
  peakHours: DashboardCountPoint[];
  cancellationStatistics: DashboardCancellationStats;
  returningCustomers: number;
  revenueForecast: ForecastMetric[];
  revenueTrend: DashboardSeriesPoint[];
  bookingTrend: DashboardSeriesPoint[];
  sportDistribution: DashboardBreakdownItem[];
  venuePerformance: VenuePerformance[];
  totalReviews: number;
  averageRating: number;
}

export interface DashboardUserStatistics {
  totalBookings: number;
  favoriteSports: DashboardBreakdownItem[];
  favoriteVenues: DashboardBreakdownItem[];
  monthlyActivity: DashboardSeriesPoint[];
  preferredHours: DashboardCountPoint[];
  playingFrequencyPerMonth: number;
  spendingStatistics: SpendingStatistics;
  matchmakingStatistics: MatchmakingStatistics;
  spendingTrend: DashboardSeriesPoint[];
  unreadNotifications: number;
  averageReviewRating: number;
}
