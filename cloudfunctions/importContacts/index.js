// cloudfunctions/importContacts/index.js
const cloud = require('wx-server-sdk');
const XLSX = require('xlsx');

// 初始化云环境（使用当前环境）
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const contactsCollection = db.collection('contacts'); // 请确保集合存在

/**
 * 导入 Excel 联系人到云数据库
 */
exports.main = async (event, context) => {
  const { fileID } = event;

  if (!fileID) {
    return {
      success: false,
      error: '缺少文件 ID (fileID)'
    };
  }

  try {
    // 1. 下载文件
    const fileRes = await cloud.downloadFile({ fileID });

    // 2. 校验文件内容
    if (!fileRes?.fileContent) {
      return {
        success: false,
        error: '文件下载失败：fileContent 为空'
      };
    }

    const buffer = fileRes.fileContent;

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return {
        success: false,
        error: '下载的文件无效或为空'
      };
    }

    // 3. 解析 Excel
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (err) {
      console.error('Excel 解析失败:', err);
      return {
        success: false,
        error: 'Excel 文件格式错误，请使用 Microsoft Excel 或 Google Sheets 导出的标准 .xlsx 文件'
      };
    }

    if (!workbook.SheetNames?.[0]) {
      return {
        success: false,
        error: 'Excel 文件中没有工作表'
      };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return {
        success: false,
        error: 'Excel 数据为空'
      };
    }

    // 4. 提取表头和数据行
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    if (!Array.isArray(headers) || headers.length === 0) {
      return {
        success: false,
        error: '无法识别表头，请确保第一行为字段名（如：姓名、电话等）'
      };
    }

    // 5. 字段映射（只认这些中文表头）
    const fieldMap = {
      '姓名': 'name',
      '电话': 'phone',
      '邮箱': 'emails',
      '地址': 'address',
      '分组': 'group',
      '收藏': 'isFavorite'
    };

    let successCount = 0;

    // 6. 遍历每一行
    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;

      // 构建基础联系人对象（不包含 _id！）
      const contact = {
        _openid: context.OPENID,
        createTime: new Date().toISOString(),
        avatar: '',
        avatarUrl: ''
      };

      // 按列解析
      for (let i = 0; i < headers.length && i < row.length; i++) {
        const header = String(headers[i]).trim();
        const rawValue = row[i];
        const value = rawValue != null ? String(rawValue).trim() : '';

        if (!header || !fieldMap[header]) continue;

        const key = fieldMap[header];

        switch (key) {
          case 'name':
            contact.name = value;
            break;
          case 'phone':
            const phoneMatch = value.match(/\d{11}/);
            if (phoneMatch) {
              contact.phones = [{ type: '手机', value: phoneMatch[0] }];
            }
            break;
          case 'emails':
            const emailMatch = value.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
              contact.emails = [{ type: '个人', value: emailMatch[0] }];
            }
            break;
          case 'address':
            contact.address = value;
            break;
          case 'group':
            contact.group = value;
            break;
          case 'isFavorite':
            contact.isFavorite = value === '是';
            break;
        }
      }

      // 至少要有姓名
      if (!contact.name) continue;

      // ✅【关键修复】只保留允许的字段，彻底排除 _id / id 等非法字段
      const ALLOWED_FIELDS = [
        '_openid', 'createTime', 'avatar', 'avatarUrl',
        'name', 'phones', 'emails', 'address', 'group', 'isFavorite'
      ];

      const cleanDoc = {};
      ALLOWED_FIELDS.forEach(key => {
        if (contact[key] !== undefined) {
          cleanDoc[key] = contact[key];
        }
      });

      // 插入数据库
      await contactsCollection.add({ data: cleanDoc });
      successCount++;
    }

    return {
      success: true,
      message: `成功导入 ${successCount} 条联系人`,
      importedCount: successCount
    };

  } catch (err) {
    console.error('[云函数异常]', err);
    return {
      success: false,
      error: '系统错误：' + (err.message || '未知错误')
    };
  }
};