// API service layer for Reelgram client
class ReelgramAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('rg_auth_token');
  }

  // Helper method for API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('rg_auth_token', this.token);
    }
    
    return response;
  }

  async resendVerification(email) {
    const response = await this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('rg_auth_token');
  }

  // User methods
  async getSuggestedUsers() {
    return await this.request('/users/suggested');
  }

  async getUserByName(name) {
    return await this.request(`/users/by-name?name=${encodeURIComponent(name)}`);
  }

  // Reel methods
  async getReels(page = 1, limit = 10) {
    return await this.request(`/reels?page=${page}&limit=${limit}`);
  }

  async createReel(formData) {
    // For file uploads, don't set Content-Type header
    return await this.request('/reels', {
      method: 'POST',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
      body: formData,
    });
  }

  async likeReel(reelId) {
    return await this.request(`/reels/${reelId}/like`, {
      method: 'POST',
    });
  }

  async getReelComments(reelId) {
    return await this.request(`/reels/${reelId}/comments`);
  }

  async addReelComment(reelId, text) {
    return await this.request(`/reels/${reelId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Chat methods
  async getChatHistory(partnerName) {
    return await this.request(`/chat/${encodeURIComponent(partnerName)}`);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

// Create global API instance
window.api = new ReelgramAPI();
