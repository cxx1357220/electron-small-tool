const path = require('path');
console.log(__dirname, 999)
module.exports = {
    // baseUrl:'./',
    publicPath: './',
    outputDir: path.resolve(__dirname, './static'),
    // assetsDir: './dist',
    assetsDir: './',
    lintOnSave: true,
    devServer: {
        port: '4000'
    },
    // css: {
    //     loaderOptions: {
    //       css: {},
    //       postcss: {
    //         plugins: [
    //           require('postcss-px2rem')({
    //             remUnit: 108
    //           })
    //         ]
    //       }
    //     }
    // },
    // css: {
    //     loaderOptions: {
    //         postcss: {
    //             plugins: [
    //                 require('postcss-pxtorem')({
    //                     rootValue : 32, // 换算的基数
    //                     // selectorBlackList  : ['weui','mu'], // 忽略转换正则匹配项/
    //                     propList   : ['*'],
    //                 }),
    //             ]
    //         }
    //     }
    // },
    configureWebpack: config => {
        Object.assign(config, {
            resolve: {
                alias: {
                    '@': path.resolve(__dirname, './src'),
                    'assets': path.resolve(__dirname, './src/assets'),
                    'common': path.resolve(__dirname, './src/common'),
                    'components': path.resolve(__dirname, './src/components'),
                    'pages': path.resolve(__dirname, './src/pages')
                }
            }
        });
    },
    chainWebpack: config => {
        config.module
            .rule('images')
            .use('url-loader')
            .loader('url-loader')
            .tap(options => Object.assign(options, { limit: 20000 }))
    }
}
