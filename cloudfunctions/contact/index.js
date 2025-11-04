const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, payload, id } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'list':
        return await db.collection('contacts').get()

      case 'create':
        return await db.collection('contacts').add({
          data: { ...payload, _openid: wxContext.OPENID }
        })

      case 'update':
        return await db.collection('contacts').doc(id).update({ data: payload })

      case 'delete':
        // 可在此处添加删除头像文件的逻辑
        return await db.collection('contacts').doc(id).remove()

      default:
        throw new Error('Invalid action')
    }
  } catch (err) {
    return { error: err.message }
  }
}