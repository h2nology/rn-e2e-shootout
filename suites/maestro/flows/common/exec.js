// 请 device-helper 执行预先登记的外部命令。参数：NAME
var r = http.post('http://localhost:4100/exec?name=' + NAME, { body: '' })
if (r.status !== 200) throw new Error('exec ' + NAME + ' failed: ' + r.body)
