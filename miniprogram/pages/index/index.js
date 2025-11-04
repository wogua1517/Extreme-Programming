Page({
  data: {
    contacts: [],
    filteredContacts: [],
    groups: ['全部', '家人', '同事', '朋友', '其他'],
    currentGroup: '全部',
    keyword: ''
  },

  onLoad() {
    this.loadContacts();
  },

  async loadContacts() {
    const db = wx.cloud.database();
    const res = await db.collection('contacts').get();
    this.setData({
      contacts: res.data,
      filteredContacts: res.data
    });
  },
  onShow() {
    this.loadContacts();
  },

  onSearch(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword });
    this.filterContacts();
  },

  filterByGroup(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({ currentGroup: group });
    this.filterContacts();
  },

  filterContacts() {
    const { contacts, currentGroup, keyword } = this.data;
    let filtered = contacts;

    // 分组筛选
    if (currentGroup !== '全部') {
      filtered = filtered.filter(c => c.group === currentGroup);
    }

    // 关键词搜索
    if (keyword) {
      filtered = filtered.filter(c =>
        c.name.includes(keyword) || c.phone.includes(keyword)
      );
    }

    this.setData({ filteredContacts: filtered });
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  editContact(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/add/add?id=${id}` });
  },

  async deleteContact(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该联系人吗？',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.database().collection('contacts').doc(id).remove();
          this.loadContacts(); // 重新加载
        }
      }
    });
  }
});