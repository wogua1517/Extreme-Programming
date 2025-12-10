// cloud/functions/exportContacts/index.js
const cloud = require('wx-server-sdk');
const XLSX = require('xlsx');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    console.log('[导出] 开始查询联系人...');
    const contactsRes = await db.collection('contacts').get();
    const contacts = contactsRes.data || [];
    console.log(`[导出] 共 ${contacts.length} 条联系人`);

    const rows = contacts.map(contact => {
      const phoneStr = (contact.phones || [])
        .filter(p => p?.value)
        .map(p => `${p.value} (${p.type || '其他'})`)
        .join('\n') || (contact.phone ? `${contact.phone} (旧数据)` : '');

      const emailStr = (contact.emails || [])
        .filter(e => e?.value)
        .map(e => `${e.value} (${e.type || '其他'})`)
        .join('\n') || '';

      return {
        姓名: contact.name || '',
        电话: phoneStr,
        邮箱: emailStr,
        地址: contact.address || '',
        分组: contact.group || '其他',
        收藏: contact.isFavorite ? '是' : '否'
      };
    });

    console.log('[导出] 开始生成 Excel...');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { cellText: true });
    XLSX.utils.book_append_sheet(wb, ws, '联系人');

    const wbout = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    console.log('[导出] Excel buffer 生成成功，大小:', wbout.length, '字节');

    // 上传到云存储
    const cloudPath = `exports/contacts_${Date.now()}.xlsx`;
    console.log('[导出] 上传文件:', cloudPath);
    const uploadRes = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: wbout
    });

    console.log('[导出] 上传成功，fileID:', uploadRes.fileID);

    // 获取临时链接
    const tempFileURL = await cloud.getTempFileURL({
      fileList: [uploadRes.fileID]
    });

    if (tempFileURL.fileList[0].status === 0) {
      console.log('[导出] 临时链接生成成功');
      return {
        success: true,
        fileUrl: tempFileURL.fileList[0].tempFileURL
      };
    } else {
      throw new Error('获取临时链接失败: ' + tempFileURL.fileList[0].errMsg);
    }

  } catch (err) {
    console.error('[导出失败]', err);
    return {
      success: false,
      error: err.message || '未知错误'
    };
  }
};