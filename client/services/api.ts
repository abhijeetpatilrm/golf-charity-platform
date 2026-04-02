import axios from "axios";

const AUTH_TOKEN_KEY = "golf_charity_access_token";

type ScorePayload = {
	score: number;
	date: string;
};

export type ScoreItem = {
	id: string;
	date: string;
	score: number;
};

type ScoresResponse = {
	scores: ScoreItem[];
};

type AddScoreResponse = {
	message: string;
	score: ScoreItem;
};

export type DrawItem = {
	id: string;
	month: number;
	year: number;
	numbers: number[];
	status: "pending" | "published" | string;
};

type DrawResponse = {
	draw: DrawItem;
	drawType: "3" | "4" | "5";
	drawNumbers: number[];
	totalWinners: number;
};

type DrawsResponse = {
	draws: DrawItem[];
};

export type WinnerStatus = "pending" | "approved" | "rejected" | "paid";

export type WinnerItem = {
	id: string;
	user_id: string;
	draw_id: string;
	status: WinnerStatus | string;
	created_at?: string;
};

type WinnersResponse = {
	winners: WinnerItem[];
};

type WinnerActionResponse = {
	message: string;
	winner: WinnerItem;
};

export type PayoutRecordItem = {
	id: string;
	winner_id: string;
	user_id: string;
	draw_id: string;
	amount: number;
	currency: string;
	status: string;
	reference_code: string | null;
	processed_by: string | null;
	processed_at: string;
	created_at?: string;
};

export type WinnerAuditLogItem = {
	id: string;
	winner_id: string;
	actor_user_id: string | null;
	action: string;
	from_status: string | null;
	to_status: string | null;
	note: string | null;
	created_at: string;
};

type PayoutRecordsResponse = {
	payoutRecords: PayoutRecordItem[];
};

type WinnerAuditLogsResponse = {
	auditLogs: WinnerAuditLogItem[];
};

export type UserItem = {
	id: string;
	name: string | null;
	email: string | null;
	role?: string | null;
	subscription_status: string | null;
	total_scores?: number;
	created_at?: string;
};

type UsersResponse = {
	users: UserItem[];
};

export type CharityItem = {
	id: string;
	name: string;
	description: string | null;
	website_url: string | null;
	logo_url: string | null;
	is_active: boolean | null;
	updated_at?: string;
	created_at?: string;
};

type CharitiesResponse = {
	charities: CharityItem[];
};

type CharityProfileResponse = {
	charity: CharityItem;
	profile: {
		selectedUsers: number;
		averageContributionPercent: number;
	};
};

type CharityImpactSummaryResponse = {
	totalSupporters: number;
	totalMonthlyEstimatedImpact: number;
	charities: Array<{
		charity_id: string;
		charity_name: string;
		is_active: boolean;
		supporters: number;
		monthlyEstimatedImpact: number;
	}>;
};

export type AuthUser = {
	id: string;
	email: string | null;
	role: string;
};

type AuthResponse = {
	message: string;
	user: AuthUser | null;
	session: {
		access_token: string;
		refresh_token?: string;
	} | null;
};

type SubscriptionResponse = {
	subscription: Record<string, unknown> | null;
};

type CheckoutSessionResponse = {
	message: string;
	checkoutUrl: string;
	sessionId: string;
	amount: number;
	currency: string;
	plan: "monthly" | "yearly";
};

type PrizePoolSummaryResponse = {
	month: number;
	year: number;
	subscribersCount: number;
	unitContribution: number;
	totalPrizePool: number;
	tierSplits: {
		"5": number;
		"4": number;
		"3": number;
	};
	tierAmounts: {
		"5": number;
		"4": number;
		"3": number;
	};
	winnersByTier: {
		"5": number;
		"4": number;
		"3": number;
	};
	payoutPerWinner: {
		"5": number;
		"4": number;
		"3": number;
	};
	jackpotRollover: number;
	drawId: string | null;
};

export type VerificationItem = {
	id: string;
	winner_id: string;
	proof_url: string;
	note: string | null;
	status: "submitted" | "approved" | "rejected" | string;
	created_at?: string;
};

type VerificationResponse = {
	message: string;
	verification: VerificationItem;
};

type PendingVerificationsResponse = {
	verifications: VerificationItem[];
};

export type CharityPreference = {
	id: string;
	charity_id: string;
	charity_name: string | null;
	contribution_percent: number;
};

export type WinningsItem = {
	id: string;
	draw_id: string;
	match_type: "3" | "4" | "5" | string;
	prize_amount: number;
	status: string;
	created_at?: string;
};

type MyWinningsResponse = {
	winnings: WinningsItem[];
	summary: {
		totalWinnings: number;
		paidTotal: number;
		pendingCount: number;
	};
};

type CharityPreferenceResponse = {
	preference: CharityPreference | null;
};

type UpdateCharityPreferenceResponse = {
	message: string;
	preference: {
		id: string;
		charity_id: string;
		contribution_percent: number;
	};
};

type UpdateScoreResponse = {
	message: string;
	score: ScoreItem;
};

type DrawSimulationResponse = {
	simulation: {
		drawType: "3" | "4" | "5";
		mode: "random" | "algorithmic";
		drawNumbers: number[];
		projectedWinners: number;
	};
};

type AdminOverviewResponse = {
	metrics: {
		users: number;
		draws: number;
		winners: number;
		charities: number;
		activeCharities: number;
		activeSubscriptions: number;
		payoutCommitted: number;
	};
};

export type AdminReportItem = {
	drawId: string;
	period: string;
	status: string;
	totalWinners: number;
	paidWinners: number;
	approvedWinners: number;
	payoutTotal: number;
};

type AdminReportsResponse = {
	reports: AdminReportItem[];
};

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
	headers: {
		"Content-Type": "application/json",
	},
});

export const getStoredAuthToken = (): string | null => {
	if (typeof window === "undefined") {
		return null;
	}

	return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredAuthToken = (token: string | null) => {
	if (typeof window === "undefined") {
		return;
	}

	if (!token) {
		window.localStorage.removeItem(AUTH_TOKEN_KEY);
		return;
	}

	window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredAuthToken = () => {
	setStoredAuthToken(null);
};

api.interceptors.request.use((config) => {
	const token = getStoredAuthToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (!error.response) {
			return "Cannot connect to backend API. Ensure the server is running on http://localhost:5000.";
		}

		const responseMessage = error.response?.data?.error;
		if (typeof responseMessage === "string") {
			return responseMessage;
		}

		return error.message || "Request failed";
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Unexpected error occurred";
};

export const getScores = async (): Promise<ScoresResponse> => {
	try {
		const response = await api.get<ScoresResponse>("/scores");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const addScore = async (data: ScorePayload): Promise<AddScoreResponse> => {
	try {
		const response = await api.post<AddScoreResponse>("/scores", data);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const updateScore = async (
	scoreId: string,
	data: ScorePayload,
): Promise<UpdateScoreResponse> => {
	try {
		const response = await api.patch<UpdateScoreResponse>(`/scores/${scoreId}`, data);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getDraws = async (): Promise<DrawsResponse> => {
	try {
		const response = await api.get<DrawsResponse>("/draws");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const runDraw = async (payload: {
	drawType: "3" | "4" | "5";
	mode?: "random" | "algorithmic";
}): Promise<DrawResponse> => {
	try {
		const response = await api.post<DrawResponse>("/draw/run", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const simulateDraw = async (payload: {
	drawType: "3" | "4" | "5";
	mode: "random" | "algorithmic";
}): Promise<DrawSimulationResponse> => {
	try {
		const response = await api.post<DrawSimulationResponse>("/draw/simulate", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getWinners = async (): Promise<WinnersResponse> => {
	try {
		const response = await api.get<WinnersResponse>("/winners");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getMyWinnings = async (): Promise<MyWinningsResponse> => {
	try {
		const response = await api.get<MyWinningsResponse>("/winners/me");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const approveWinner = async (winnerId: string): Promise<WinnerActionResponse> => {
	try {
		const response = await api.patch<WinnerActionResponse>(`/winners/${winnerId}/approve`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const rejectWinner = async (winnerId: string): Promise<WinnerActionResponse> => {
	try {
		const response = await api.patch<WinnerActionResponse>(`/winners/${winnerId}/reject`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const payWinner = async (winnerId: string): Promise<WinnerActionResponse> => {
	try {
		const response = await api.patch<WinnerActionResponse>(`/winners/${winnerId}/pay`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getPayoutRecords = async (): Promise<PayoutRecordsResponse> => {
	try {
		const response = await api.get<PayoutRecordsResponse>("/winners/payout-records");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getWinnerAuditLogs = async (): Promise<WinnerAuditLogsResponse> => {
	try {
		const response = await api.get<WinnerAuditLogsResponse>("/winners/audit-logs");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getUsers = async (): Promise<UsersResponse> => {
	try {
		const response = await api.get<UsersResponse>("/users");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const updateUser = async (
	userId: string,
	payload: {
		name?: string;
		role?: "subscriber" | "admin" | "administrator";
		subscription_status?: "inactive" | "active" | "canceled" | "expired";
	},
): Promise<{ message: string; user: UserItem }> => {
	try {
		const response = await api.patch<{ message: string; user: UserItem }>(`/users/${userId}`, payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getCharities = async (params?: {
	search?: string;
	status?: "all" | "active" | "inactive";
}): Promise<CharitiesResponse> => {
	try {
		const response = await api.get<CharitiesResponse>("/charities", { params });
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getCharityProfile = async (charityId: string): Promise<CharityProfileResponse> => {
	try {
		const response = await api.get<CharityProfileResponse>(`/charities/${charityId}`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getCharityImpactSummary = async (): Promise<CharityImpactSummaryResponse> => {
	try {
		const response = await api.get<CharityImpactSummaryResponse>("/charities/impact/summary");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const createCharity = async (payload: {
	name: string;
	description?: string;
	website_url?: string;
	logo_url?: string;
	is_active?: boolean;
}): Promise<{ message: string; charity: CharityItem }> => {
	try {
		const response = await api.post<{ message: string; charity: CharityItem }>("/charities", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const updateCharity = async (
	charityId: string,
	payload: {
		name?: string;
		description?: string;
		website_url?: string;
		logo_url?: string;
		is_active?: boolean;
	},
): Promise<{ message: string; charity: CharityItem }> => {
	try {
		const response = await api.patch<{ message: string; charity: CharityItem }>(
			`/charities/${charityId}`,
			payload,
		);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const deleteCharity = async (charityId: string): Promise<{ message: string }> => {
	try {
		const response = await api.delete<{ message: string }>(`/charities/${charityId}`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getMyCharityPreference = async (): Promise<CharityPreferenceResponse> => {
	try {
		const response = await api.get<CharityPreferenceResponse>("/charity-preferences/me");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const updateMyCharityPreference = async (payload: {
	charityId: string;
	contributionPercent: number;
}): Promise<UpdateCharityPreferenceResponse> => {
	try {
		const response = await api.put<UpdateCharityPreferenceResponse>("/charity-preferences/me", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const signUp = async (payload: {
	email: string;
	password: string;
	name?: string;
	role?: string;
	charityId?: string;
	contributionPercent?: number;
}): Promise<AuthResponse> => {
	try {
		const response = await api.post<AuthResponse>("/auth/signup", payload);
		const token = response.data.session?.access_token || null;
		if (token) {
			setStoredAuthToken(token);
		}
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const signIn = async (payload: {
	email: string;
	password: string;
}): Promise<AuthResponse> => {
	try {
		const response = await api.post<AuthResponse>("/auth/login", payload);
		const token = response.data.session?.access_token || null;
		if (token) {
			setStoredAuthToken(token);
		}
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getMe = async (): Promise<{ user: AuthUser | null }> => {
	try {
		const response = await api.get<{ user: AuthUser | null }>("/auth/me");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getMySubscription = async (): Promise<SubscriptionResponse> => {
	try {
		const response = await api.get<SubscriptionResponse>("/subscriptions/me");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const updateMySubscription = async (payload: {
	action: "renew" | "cancel";
	plan?: "monthly" | "yearly";
}): Promise<{ message: string; subscription: Record<string, unknown> | null }> => {
	try {
		const response = await api.patch<{ message: string; subscription: Record<string, unknown> | null }>(
			"/subscriptions/me",
			payload,
		);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const createCheckoutSession = async (payload: {
	plan: "monthly" | "yearly";
}): Promise<CheckoutSessionResponse> => {
	try {
		const response = await api.post<CheckoutSessionResponse>("/payments/checkout-session", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getPrizePoolSummary = async (params?: {
	month?: number;
	year?: number;
}): Promise<PrizePoolSummaryResponse> => {
	try {
		const response = await api.get<PrizePoolSummaryResponse>("/prize-pool/summary", { params });
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const submitWinnerVerification = async (payload: {
	winnerId: string;
	proofUrl: string;
	note?: string;
}): Promise<VerificationResponse> => {
	try {
		const response = await api.post<VerificationResponse>("/verifications", payload);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getPendingVerifications = async (): Promise<PendingVerificationsResponse> => {
	try {
		const response = await api.get<PendingVerificationsResponse>("/verifications/pending");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const approveVerification = async (verificationId: string): Promise<VerificationResponse> => {
	try {
		const response = await api.patch<VerificationResponse>(`/verifications/${verificationId}/approve`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const rejectVerification = async (verificationId: string): Promise<VerificationResponse> => {
	try {
		const response = await api.patch<VerificationResponse>(`/verifications/${verificationId}/reject`);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getAdminOverview = async (): Promise<AdminOverviewResponse> => {
	try {
		const response = await api.get<AdminOverviewResponse>("/admin/overview");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const getAdminReports = async (): Promise<AdminReportsResponse> => {
	try {
		const response = await api.get<AdminReportsResponse>("/admin/reports");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export default api;
