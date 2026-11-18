// 状态重置的前半段（METHODOLOGY 5）：服务端 /reset；iOS 另外请 device-helper 清空 app 数据并撤销权限
// （Maestro 的 clearState 在 iOS 上会重装 app，官方文档写明；不符合“不重新安装”）
var r = http.post('http://localhost:4000/reset', { body: '' })
if (r.status !== 200) throw new Error('mock /reset failed: ' + r.status)
if (maestro.platform === 'ios') {
  var c = http.post('http://localhost:4100/ios/clear-data', { body: '' })
  if (c.status !== 200) throw new Error('clear-data failed: ' + c.body)
}
