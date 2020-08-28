// const path = require('path')
const fs = require('fs')
const xlsx = require('node-xlsx');  // 互相转换都可以 ,在这写打包会有问题，引用不到，
const defXLSX = require('xlsx');  
process.on('message', function ({ list, expPath, platform }) {
  let filePathSplit = platform ? '/' : '\\';
  for (let idx = 0; idx < list.length; idx++) {
    let file = list[idx];
    process.send([idx, 0, {}]);
    let fileName = file.name.split('.'),
      type = fileName[fileName.length - 1]
    if (type == 'json') {
      fs.readFile(file.path, 'utf8', function (err, data) {
        if (err) {
          process.send([idx, 'error', { error: '文件读取失败，文件是否删除或更改路径' }]);
        } else {
          process.send([idx, 30, {}]);
          try {
            data = JSON.parse(data)
            try {
              const str = xlsx.build(data);
              process.send([idx, 70, {}]);
              let newName = file.name + 'ToXlsx.xlsx'
              let newFilePath = expPath + filePathSplit + newName;
              // fs.writeFileSync(newFilePath, str, 'binary');
              fs.writeFile(newFilePath, str, function (err) {
                if (err) {
                  process.send([idx, 'error', { error: "文件写入失败" }]);
                } else {
                  process.send([idx, 100, { newName, newFilePath }]);
                }
              })
            } catch (e) {
              process.send([idx, 'error', { error: "json不符合转化规范" }]);
            }
          }
          catch (e) {
            process.send([idx, 'error', { error: "json格式错误" }]);
          }
        }

      })
    } else {
      process.send([idx, 10, {}]);
      fs.readFile(file.path, 'utf8', function (err, data) {
        if (err) {
          process.send([idx, 'error', { error: '文件读取失败，文件是否删除或更改路径' }]);
        } else {
          process.send([idx, 30, {}]);
          try {
            process.send([idx, 'log', data]);
            // const json = xlsx.parse(file.path, { type: 'string', raw: true });  //把内容都当string类型，在有些电脑并不能utf8
            // const json = xlsx.parse(data, { type: 'string', raw: true });
            const workSheet = defXLSX.read(data, { type: 'string', raw: true });
            process.send([idx, 50, {}]);
            let json =  Object.keys(workSheet.Sheets).map(function (name) {
              var sheet = workSheet.Sheets[name];
              return { name: name, data: defXLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) };
            });
            process.send([idx, 70, {}]);
            process.send([idx, 'log', json]);
            let newName = file.name + 'ToJson.json';
            let newFilePath = expPath + filePathSplit + newName;
            fs.writeFile(newFilePath, JSON.stringify(json), function (err) {
              if (err) {
                process.send([idx, 'error', { error: "文件写入失败" + err }]);
              } else {
                process.send([idx, 100, { newName, newFilePath }]);
              }
            })
          } catch (e) {
            process.send([idx, 'error', { error: "文件转化失败" }]);
          }
        }
      })

    }
  }
})