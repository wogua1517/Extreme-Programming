// pages/export/export.js
const app = getApp();

Page({
  data: {
    isExporting: false,
    isImporting: false,
    selectedFile: null,
    importResult: null,
    downloadUrl: ''
  },

  // ========== 导出功能 ==========
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
      const downloadTask = wx.downloadFile({
        url: downloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
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

  // ========== 导入功能 ==========
  onChooseFile() {
    if (!wx.canIUse('chooseMessageFile')) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法选择文件，请升级微信至最新版。',
        showCancel: false
      });
      return;
    }
  
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.xlsx'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file || !file.name.toLowerCase().endsWith('.xlsx')) {
          wx.showToast({ title: '请选择 .xlsx 格式的 Excel 文件', icon: 'none' });
          return;
        }
        this.setData({ selectedFile: file });
      },
      fail: () => {
        // 用户取消
      }
    });
  },
  
  clearFile() {
    this.setData({ selectedFile: null, importResult: null });
  },

  async handleImport() {
    const { selectedFile } = this.data;
    if (!selectedFile) {
      wx.showToast({ title: '请选择文件', icon: 'none' });
      return;
    }

    this.setData({ isImporting: true, importResult: null });

    try {
      // 上传文件到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `imports/${Date.now()}_${selectedFile.name}`,
        filePath: selectedFile.path
      });

      // 调用导入云函数
      const res = await wx.cloud.callFunction({
        name: 'importContacts',
        data: {
          fileID: uploadRes.fileID
        }
      });

      if (res.result.success) {
        this.setData({
          importResult: res.result,
          selectedFile: null
        });
        wx.showToast({ title: '导入成功', icon: 'success' });
      } else {
        this.setData({ importResult: res.result });
        wx.showToast({ title: '导入失败', icon: 'error' });
      }
    } catch (err) {
      console.error('[导入错误]', err);
      this.setData({
        importResult: { success: false, error: '网络错误，请重试' }
      });
      wx.showToast({ title: '操作失败', icon: 'error' });
    } finally {
      this.setData({ isImporting: false });
    }
  },

  onShareAppMessage() {
    return {
      title: '联系人导入/导出',
      path: '/pages/export/export'
    };
  }
});