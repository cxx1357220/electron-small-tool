# electron-in-vue

## node 
10.2.1

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### 执行浏览器ui
npm run serve

### 执行electron视图
npm run test

### build成程序
npm run build:mac
npm run build:win


### 排坑
package.js文件
```js
  "build": {
    "mac": {
      "icon": "./yang.png" //图标文件
    },
    "extraResources":[{ //打包的时候移动目录到指定目录，不然会忽略打包，丢失文件，从丢失fork文件中发现的问题，
      "from": "./src/worker/",
      "to": "./src/worker/"
    }]
  },
```
