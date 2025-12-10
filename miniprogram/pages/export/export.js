// pages/export/export.js
Page({
  data: {
    isExporting: false,
    downloadUrl: ''
  },

  async handleExport() {
    this.setData({ isExporting: true, downloadUrl: '' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'exportContacts'
      });

      if (res.result?.success) {
        const fileUrl = res.result.fileUrl;
        this.setData({ downloadUrl: fileUrl });
        wx.showToast({ title: '导出成功', icon: 'success' });
      } else {
        throw new Error(res.result?.error || '导出失败');
      }
    } catch (err) {
      console.error('[导出错误]', err);
      wx.showToast({ title: '导出失败', icon: 'error' });
    } finally {
      this.setData({ isExporting: false });
    }
  },

  async downloadFile() {
    const { downloadUrl } = this.data;
    if (!downloadUrl) return;

    wx.showLoading({ title: '下载中...' });

    try {
      // 下载到临时路径
      const downloadTask = wx.downloadFile({
        url: downloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            // 打开 Excel 文件（需用户确认）
            wx.openDocument({
              filePath: res.tempFilePath,
              fileType: 'xlsx',
              success: () => {
                console.log('文档打开成功');
              },
              fail: (err) => {
                console.error('打开文档失败', err);
                wx.showToast({ title: '无法打开文件', icon: 'error' });
              }
            });
          } else {
            wx.showToast({ title: '下载失败', icon: 'error' });
          }
        },
        fail: (err) => {
          console.error('下载失败', err);
          wx.showToast({ title: '下载失败', icon: 'error' });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('下载异常', err);
      wx.showToast({ title: '操作失败', icon: 'error' });
    }
  },

  onShareAppMessage() {
    return {
      title: '我的联系人导出',
      path: '/pages/export/export'
    };
  }
});