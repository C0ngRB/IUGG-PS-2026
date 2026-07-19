var API_BASE = 'https://api.iugg-ps2026.com/api';

var Auth = {
  getToken: function () {
    return localStorage.getItem('token');
  },

  setToken: function (token) {
    localStorage.setItem('token', token);
  },

  clearToken: function () {
    localStorage.removeItem('token');
  },

  getUser: function () {
    var raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser: function (user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearUser: function () {
    localStorage.removeItem('user');
  },

  isLoggedIn: function () {
    return !!this.getToken();
  },

  isAdmin: function () {
    var user = this.getUser();
    return user && user.role === 'admin';
  },

  request: async function (method, path, body) {
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    var token = this.getToken();
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body) {
      opts.body = JSON.stringify(body);
    }
    var res = await fetch(API_BASE + path, opts);
    var data = await res.json();
    if (!res.ok) {
      throw { status: res.status, errors: data.errors || ['Request failed'] };
    }
    return data;
  },

  register: async function (fields) {
    var data = await this.request('POST', '/auth/register', fields);
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  login: async function (email, password) {
    var data = await this.request('POST', '/auth/login', { email: email, password: password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  fetchMe: async function () {
    var data = await this.request('GET', '/auth/me');
    this.setUser(data.user);
    return data.user;
  },

  updateMe: async function (fields) {
    var data = await this.request('PUT', '/auth/me', fields);
    this.setUser(data.user);
    return data.user;
  },

  logout: function () {
    this.clearToken();
    this.clearUser();
    window.location.href = 'index.html';
  },

  requireAuth: function () {
    if (!this.isLoggedIn()) {
      window.location.href = 'auth.html';
      return false;
    }
    return true;
  },

  requireAdmin: function () {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },
};
