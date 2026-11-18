// 固定时长停留（只用于场景本身要求的停留，例如 S23 “在后台等 2 秒”）。参数：MS
// Maestro 没有固定时长的等待命令，JS 环境也没有 sleep，由 device-helper 代为等待
var r = http.post('http://localhost:4100/sleep?ms=' + MS, { body: '' })
if (r.status !== 200) throw new Error('sleep failed: ' + r.body)
