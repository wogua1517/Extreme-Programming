// pages/add/add.js
Page({
  data: {
    id: '',
    mode: 'add',
    name: '',
    phone: '',
    group: '家人',
    avatar: '/images/default-avatar.png',
    tempAvatarPath: '', // 临时路径
    isSaving: false
  },

  // 页面加载
  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, mode: 'edit' });
      this.loadContact(options.id);
    }
  },

  // 加载
  loadContact(id) {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'contact',
      data: { action: 'get', id }
    }).then(res => {
      const contact = res.result.data[0] || {};
      this.setData({
        name: contact.name || '',
        phone: contact.phone || '',
        group: contact.group || '家人',
        avatar: contact.avatar || '/images/default-avatar.png'
      });
      wx.hideLoading();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'error' });
    });
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.compressAndCropImage(tempFilePath);
      }
    });
  },

  // 压缩图片
  compressAndCropImage(src) {
    wx.showLoading({ title: '处理头像...' });
    wx.getImageInfo({
      src,
      success: (info) => {
        const ctx = wx.createCanvasContext('avatarCanvas', this);
        const { width, height } = info;
        const cropSize = Math.min(width, height);
        const x = (width - cropSize) / 2;
        const y = (height - cropSize) / 2;

        ctx.drawImage(info.path, x, y, cropSize, cropSize, 0, 0, 100, 100);
        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'avatarCanvas',
              success: (res) => {
                this.setData({
                  avatar: res.tempFilePath,
                  tempAvatarPath: res.tempFilePath
                });
                wx.hideLoading();
              },
              fail: (err) => {
                console.error('裁剪失败', err);
                wx.showToast({ title: '头像处理失败', icon: 'error' });
                wx.hideLoading();
              }
            }, this);
          }, 100);
        });
      },
      fail: (err) => {
        wx.showToast({ title: '图片加载失败', icon: 'error' });
        wx.hideLoading();
      }
    });
  },

  // 输入绑定
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onGroupChange(e) { this.setData({ group: e.detail.value }); },

  // 保存
  saveContact() {
    if (this.data.isSaving) return;
    
    const { name, phone, group } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入电话', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });

    const uploadAvatar = () => {
      if (this.data.tempAvatarPath) {
        const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.jpg`;
        return wx.cloud.uploadFile({
          cloudPath,
          filePath: this.data.tempAvatarPath
        }).then(res => res.fileID);
      } else {
        return Promise.resolve(this.data.avatar.includes('cloud') ? this.data.avatar : null);
      }
    };

    uploadAvatar().then(avatarFileID => {
      const payload = { name, phone, group, avatar: avatarFileID };

      // 调用云函数
      const callData = this.data.mode === 'edit'
        ? { action: 'update', id: this.data.id, payload }
        : { action: 'create', payload };

      return wx.cloud.callFunction({
        name: 'contact',
        data: callData
      });
    }).then(res => {
      if (res.result && !res.result.error) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 500);
      } else {
        throw new Error(res.result?.error || '未知错误');
      }
    }).catch(err => {
      console.error('保存失败', err);
      wx.showToast({ title: '保存失败', icon: 'error' });
    }).finally(() => {
      this.setData({ isSaving: false });
    });
  }
});