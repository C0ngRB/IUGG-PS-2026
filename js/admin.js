var Admin = {
  getUsers: async function (params) {
    var qs = new URLSearchParams(params).toString();
    var res = await fetch(API_BASE + '/admin/users?' + qs, {
      headers: {
        'Authorization': 'Bearer ' + Auth.getToken(),
        'Content-Type': 'application/json',
      },
    });
    var data = await res.json();
    if (!res.ok) {
      throw { status: res.status, errors: data.errors || ['Request failed'] };
    }
    return data;
  },

  getUserDetail: async function (id) {
    var res = await fetch(API_BASE + '/admin/users/' + id, {
      headers: {
        'Authorization': 'Bearer ' + Auth.getToken(),
        'Content-Type': 'application/json',
      },
    });
    var data = await res.json();
    if (!res.ok) {
      throw { status: res.status, errors: data.errors || ['Request failed'] };
    }
    return data;
  },
};
