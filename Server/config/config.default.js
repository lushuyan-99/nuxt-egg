/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path')
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  // const config = exports = {};
  const config = exports = {
    security:{
      csrf:{
        enable:false
      }
    }
 }

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1599443865153_1356';

  config.multipart = {
    mode:'file',
    whitelist:()=>true
  }

  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public')

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  


  return {
    ...config,
    ...userConfig,
  };
};
