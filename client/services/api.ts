import axios from "axios";

type ScorePayload = {
	score: number;
	date: string;
};

type DrawResponse = {
	drawNumbers: number[];
	totalWinners: number;
};

const api = axios.create({
	baseURL: "http://localhost:5000/api",
	headers: {
		"Content-Type": "application/json",
	},
});

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
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

export const addScore = async (data: ScorePayload) => {
	try {
		const response = await api.post("/scores", data);
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export const runDraw = async (): Promise<DrawResponse> => {
	try {
		const response = await api.post<DrawResponse>("/draw/run");
		return response.data;
	} catch (error) {
		throw new Error(getErrorMessage(error));
	}
};

export default api;
