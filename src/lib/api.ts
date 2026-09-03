import type {
  ComplianceFinding,
  ManifestArtifact,
  PrivacyPolicyArtifact,
  Project,
  TestCase,
  UserProfile,
  UserRole,
} from "../types/release";

const API_BASE = "/api";

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem("releaseiq_jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  auth: {
    async login(email: string, role?: UserRole): Promise<{ user: UserProfile; access_token: string }> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123", role }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("releaseiq_jwt_token", data.access_token);
      }
      return data;
    },

    async register(name: string, email: string, role: UserRole, organization?: string): Promise<{ user: UserProfile; access_token: string }> {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: "password123", role, organization }),
      });
      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("releaseiq_jwt_token", data.access_token);
      }
      return data;
    },

    async getMe(): Promise<UserProfile> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },

    async regenerateApiToken(): Promise<UserProfile> {
      const res = await fetch(`${API_BASE}/auth/token/regenerate`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to regenerate token");
      return res.json();
    },
  },

  projects: {
    async list(): Promise<Project[]> {
      const res = await fetch(`${API_BASE}/projects`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },

    async create(project: Partial<Project>): Promise<Project> {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },

    async update(id: string, updates: Partial<Project>): Promise<Project> {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },

    async clone(id: string): Promise<Project> {
      const res = await fetch(`${API_BASE}/projects/${id}/clone`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to clone project");
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
  },

  artifacts: {
    async uploadManifest(projectId: string, file?: File, rawXml?: string): Promise<ManifestArtifact> {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (rawXml) formData.append("raw_xml", rawXml);

      const res = await fetch(`${API_BASE}/projects/${projectId}/manifest`, {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload manifest");
      return res.json();
    },

    async getManifest(projectId: string): Promise<ManifestArtifact> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/manifest`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch manifest");
      return res.json();
    },

    async uploadPrivacyPolicy(projectId: string, file?: File, content?: string): Promise<PrivacyPolicyArtifact> {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (content) formData.append("content", content);

      const res = await fetch(`${API_BASE}/projects/${projectId}/privacy-policy`, {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload privacy policy");
      return res.json();
    },

    async getPrivacyPolicy(projectId: string): Promise<PrivacyPolicyArtifact> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/privacy-policy`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch privacy policy");
      return res.json();
    },
  },

  compliance: {
    async list(projectId: string): Promise<ComplianceFinding[]> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/compliance`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch compliance findings");
      return res.json();
    },

    async updateStatus(projectId: string, findingId: string, status: string, exemptionNote?: string): Promise<ComplianceFinding> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/compliance/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status, exemptionNote }),
      });
      if (!res.ok) throw new Error("Failed to update finding status");
      return res.json();
    },
  },

  testCases: {
    async list(projectId: string): Promise<TestCase[]> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/test-cases`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch test cases");
      return res.json();
    },

    async create(projectId: string, testCase: Partial<TestCase>): Promise<TestCase> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/test-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(testCase),
      });
      if (!res.ok) throw new Error("Failed to create test case");
      return res.json();
    },

    async update(projectId: string, testId: string, updates: Partial<TestCase>): Promise<TestCase> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/test-cases/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update test case");
      return res.json();
    },

    async delete(projectId: string, testId: string): Promise<void> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/test-cases/${testId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to delete test case");
    },
  },

  reports: {
    async getReport(projectId: string): Promise<any> {
      const res = await fetch(`${API_BASE}/projects/${projectId}/report`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch report bundle");
      return res.json();
    },
  },
};
